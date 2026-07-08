import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { getOrderDetail } from "@/lib/server/shiprocket";
import { applyShipmentUpdate } from "@/lib/server/shipmentStatus";

export const dynamic = "force-dynamic";

// GET — manual recovery: pull the order's current AWB / courier / status from
// Shiprocket and apply the SAME logic the webhook uses (idempotent — status guards
// prevent double emails when the webhook later arrives).
export async function GET(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const order = await Order.findOne({ orderId: params.id });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!order.shiprocketOrderId) {
      return NextResponse.json({ error: "This order hasn't been created in Shiprocket yet." }, { status: 409 });
    }

    const { awb, courier, status } = await getOrderDetail(order.shiprocketOrderId);
    const { fire } = applyShipmentUpdate(order, { awb, courier, rawStatus: status });
    await order.save();

    if (fire) {
      const p = fire();
      // eslint-disable-next-line no-console
      if (p && typeof p.catch === "function") p.catch((e) => console.log("[sync] email failed:", e.message));
    }

    return NextResponse.json({ order: { id: order.orderId, ...order.toObject() } });
  } catch (e) {
    // e.message is already a friendly Shiprocket message from the service layer.
    return NextResponse.json({ error: e.message || "Sync failed" }, { status: 502 });
  }
}
