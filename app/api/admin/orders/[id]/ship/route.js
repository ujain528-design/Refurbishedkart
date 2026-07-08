import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { createOrder, generateAWB, schedulePickup, getTrackingUrl } from "@/lib/server/shiprocket";

export const dynamic = "force-dynamic";

// Statuses from which an order may be pushed to Shiprocket.
const SHIPPABLE = ["Confirmed", "Processing", "Packed", "cod_pending"];

export async function POST(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const order = await Order.findOne({ orderId: params.id });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.awbCode) {
      return NextResponse.json({ error: "This order already has a shipment (AWB assigned)." }, { status: 409 });
    }
    if (!SHIPPABLE.includes(order.status)) {
      return NextResponse.json({ error: `Order status "${order.status}" can't be shipped yet.` }, { status: 409 });
    }

    // 1) Create the Shiprocket order → shipment. Persist immediately so a retry after
    //    a later step fails doesn't create a duplicate shipment.
    const { shiprocketOrderId, shipmentId } = await createOrder(order.toObject());
    order.shiprocketOrderId = shiprocketOrderId;
    order.shiprocketShipmentId = shipmentId;
    await order.save();

    // 2) Assign courier + AWB.
    const { awbCode, courierName } = await generateAWB(shipmentId);
    order.awbCode = awbCode;
    order.courierName = courierName;
    order.courier = courierName; // legacy field mirror
    order.trackingNumber = awbCode;
    order.trackingUrl = getTrackingUrl(awbCode);
    order.status = "Processing"; // not "Shipped" until the courier actually picks up
    order.shiprocketStatus = "AWB Assigned";
    await order.save();

    // 3) Schedule pickup — best-effort (shipment + AWB already exist; can be redone
    //    from the Shiprocket dashboard if this fails).
    try {
      await schedulePickup(shipmentId);
      order.pickupScheduledAt = new Date();
      order.shiprocketStatus = "Pickup Scheduled";
      await order.save();
    } catch {
      // swallow — surface success with the AWB; pickup can be scheduled later.
    }

    return NextResponse.json({
      order: { id: order.orderId, ...order.toObject() },
      shipment: {
        shiprocketOrderId: order.shiprocketOrderId,
        shipmentId: order.shiprocketShipmentId,
        awbCode: order.awbCode,
        courierName: order.courierName,
        trackingUrl: order.trackingUrl,
      },
    });
  } catch (e) {
    // e.message is already a friendly Shiprocket message from the service layer.
    return NextResponse.json({ error: e.message || "Shipment failed" }, { status: 502 });
  }
}
