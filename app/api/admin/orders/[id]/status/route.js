import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import {
  sendOrderCancelledEmail,
  sendOrderPackedEmail,
  sendOrderDispatchedEmail,
  sendOrderDeliveredEmail,
  sendOrderRefundedEmail,
} from "@/lib/server/orderEmails";

export const dynamic = "force-dynamic";

const VALID = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Returned", "Refunded", "cod_pending", "cod_failed"];

// Fire the customer email that matches a status transition. Async + never awaited so
// a mail failure can't delay or fail the status update; errors are logged only.
function fireStatusEmail(status, order) {
  let p = null;
  switch (status) {
    case "Cancelled": p = sendOrderCancelledEmail(order); break;
    case "Packed": p = sendOrderPackedEmail(order); break;
    case "Shipped": p = sendOrderDispatchedEmail(order); break;
    case "Delivered": p = sendOrderDeliveredEmail(order); break;
    case "Refunded": p = sendOrderRefundedEmail(order, order.refundAmount); break;
    default: return;
  }
  if (p && typeof p.catch === "function") {
    // eslint-disable-next-line no-console
    p.catch((err) => console.error(`Status email failed [${status}]:`, err.message));
  }
}

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { status, cancellationReason, codBalanceCollected, courierName, trackingNumber, trackingUrl, refundAmount } = await req.json();
    if (!VALID.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    // Cancellation requires a reason (shown to the customer on their order). All
    // other status changes don't need one.
    const reason = typeof cancellationReason === "string" ? cancellationReason.trim() : "";
    if (status === "Cancelled" && !reason) {
      return NextResponse.json({ error: "Cancellation reason required" }, { status: 400 });
    }
    const existing = await Order.findOne({ orderId: params.id }).select("deliveredAt packedAt shippedAt paymentMethod").lean();
    // Stamp deliveredAt the first time an order is marked Delivered — it's the
    // base date for the return window. packedAt/shippedAt likewise stamp once.
    const patch = { status };
    if (status === "Cancelled") patch.cancellationReason = reason;
    if (status === "Delivered" && existing && !existing.deliveredAt) patch.deliveredAt = new Date();
    if (status === "Packed" && existing && !existing.packedAt) patch.packedAt = new Date();
    // Shipment details are saved WITH the status change so the dispatch email has them.
    if (status === "Shipped") {
      if (existing && !existing.shippedAt) patch.shippedAt = new Date();
      if (courierName !== undefined) { patch.courierName = courierName; patch.courier = courierName; }
      if (trackingNumber !== undefined) patch.trackingNumber = trackingNumber;
      if (trackingUrl !== undefined) patch.trackingUrl = trackingUrl;
    }
    if (status === "Refunded" && refundAmount !== undefined) patch.refundAmount = Number(refundAmount) || 0;
    // COD delivery outcome → codStatus. Marking a COD order Delivered means the
    // courier delivered and collected the balance; cod_failed means delivery failed.
    // ("Confirmed" is accepted for backward compatibility with any pre-unification
    // records, but every UI path now sends "Delivered".)
    if (existing?.paymentMethod === "COD") {
      if (status === "Confirmed" || status === "Delivered") {
        patch.codStatus = "delivered";
        // Record the explicit cash/UPI balance-collection confirmation when the
        // admin ticks the box at delivery (drives the refund breakdown).
        if (codBalanceCollected === true) {
          patch.codBalanceCollected = true;
          patch.codBalanceCollectedAt = new Date();
        }
      } else if (status === "cod_failed") patch.codStatus = "failed";
    }
    const o = await Order.findOneAndUpdate({ orderId: params.id }, { $set: patch }, { new: true });
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    // Customer status email (async, non-blocking). Admin is making the change, so no
    // admin notification here.
    fireStatusEmail(status, o.toObject());
    return NextResponse.json({ order: { id: o.orderId, ...o.toObject() } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
