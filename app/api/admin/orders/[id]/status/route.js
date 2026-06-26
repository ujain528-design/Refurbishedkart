import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

const VALID = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Returned", "cod_pending", "cod_failed"];

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { status, cancellationReason } = await req.json();
    if (!VALID.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    // Cancellation requires a reason (shown to the customer on their order). All
    // other status changes don't need one.
    const reason = typeof cancellationReason === "string" ? cancellationReason.trim() : "";
    if (status === "Cancelled" && !reason) {
      return NextResponse.json({ error: "Cancellation reason required" }, { status: 400 });
    }
    const existing = await Order.findOne({ orderId: params.id }).select("deliveredAt paymentMethod").lean();
    // Stamp deliveredAt the first time an order is marked Delivered — it's the
    // base date for the return window.
    const patch = { status };
    if (status === "Cancelled") patch.cancellationReason = reason;
    if (status === "Delivered" && existing && !existing.deliveredAt) patch.deliveredAt = new Date();
    // COD delivery outcome → codStatus. Marking a COD order Confirmed means the
    // courier delivered and collected the balance; cod_failed means delivery failed.
    if (existing?.paymentMethod === "COD") {
      if (status === "Confirmed" || status === "Delivered") patch.codStatus = "delivered";
      else if (status === "cod_failed") patch.codStatus = "failed";
    }
    const o = await Order.findOneAndUpdate({ orderId: params.id }, { $set: patch }, { new: true });
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order: { id: o.orderId, ...o.toObject() } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
