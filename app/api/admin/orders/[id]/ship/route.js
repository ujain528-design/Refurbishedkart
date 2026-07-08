import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { createOrder } from "@/lib/server/shiprocket";

export const dynamic = "force-dynamic";

// Statuses from which an order may be pushed to Shiprocket.
const SHIPPABLE = ["Confirmed", "Processing", "Packed", "cod_pending"];

// Creates the order in Shiprocket ONLY. Courier/AWB assignment + pickup are done by
// the admin in the Shiprocket dashboard (or Shiprocket auto-assign). The AWB + courier
// are saved later via the webhook (Courier Assigned event). Status → "Processing".
export async function POST(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const order = await Order.findOne({ orderId: params.id });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.shiprocketShipmentId) {
      return NextResponse.json({ error: "This order has already been created in Shiprocket." }, { status: 409 });
    }
    if (!SHIPPABLE.includes(order.status)) {
      return NextResponse.json({ error: `Order status "${order.status}" can't be shipped yet.` }, { status: 409 });
    }

    // Create the Shiprocket order → shipment. Do NOT assign AWB or schedule pickup.
    const { shiprocketOrderId, shipmentId } = await createOrder(order.toObject());
    order.shiprocketOrderId = shiprocketOrderId;
    order.shiprocketShipmentId = shipmentId;
    order.status = "Processing"; // stays here until the courier picks up (via webhook)
    order.shiprocketStatus = "Order Created";
    await order.save();

    return NextResponse.json({
      order: { id: order.orderId, ...order.toObject() },
      message: "Order created in Shiprocket. Log into Shiprocket to assign a courier — the AWB & tracking will appear here automatically once assigned.",
      shipment: { shiprocketOrderId: order.shiprocketOrderId, shipmentId: order.shiprocketShipmentId },
    });
  } catch (e) {
    // e.message is already a friendly Shiprocket message from the service layer.
    return NextResponse.json({ error: e.message || "Shipment failed" }, { status: 502 });
  }
}
