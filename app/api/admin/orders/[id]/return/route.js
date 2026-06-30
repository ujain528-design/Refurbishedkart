import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order, Return, nextReturnId } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { lineRefundBasis } from "@/lib/server/refunds";
import { sendReturnEmail } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

const ACTIVE = ["Requested", "Approved", "Received", "Refunded"];

// POST — ADMIN OVERRIDE: file a return on a customer's behalf for a delivered
// order, WITHOUT the 7-day window check. For legitimate late returns the support
// team agrees to honour. A required admin note records why it's past the window.
export async function POST(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { reason, description, whatsappNumber, adminNote, productId, productName } = await req.json();

    if (!reason) return NextResponse.json({ error: "Please select a reason" }, { status: 400 });
    if (!description || !String(description).trim()) return NextResponse.json({ error: "Please describe the issue" }, { status: 400 });
    if (!adminNote || !String(adminNote).trim()) {
      return NextResponse.json({ error: "Admin note is required (why is this return being created past the normal window?)" }, { status: 400 });
    }

    // Fetch as a document (not lean) so we can update the order status.
    const order = await Order.findOne({ orderId: params.id });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    // Must have been delivered — admin override skips the WINDOW, not the
    // requirement that there's something delivered to return.
    if (order.status !== "Delivered" && !order.deliveredAt && order.status !== "return_requested") {
      return NextResponse.json({ error: "Returns can only be created for delivered orders" }, { status: 409 });
    }

    // Resolve the line being returned (default: the only/first line).
    const lines = order.lines || [];
    const line =
      (productId != null && lines.find((l) => String(l.productId) === String(productId))) ||
      (productName && lines.find((l) => l.name === productName)) ||
      lines[0] ||
      null;
    const resolvedProductId = productId ?? (line ? String(line.productId) : "");
    const resolvedProductName = productName || (line ? line.name : "");
    // What the customer actually paid for THIS line (coupon discount allocated
    // proportionally; shipping excluded) — not the raw line total.
    const paidAmount = line ? lineRefundBasis(order, line) : 0;

    // No duplicate active return for this order + product.
    const dup = await Return.findOne({ orderId: order.orderId, productId: resolvedProductId, status: { $in: ACTIVE } }).lean();
    if (dup) return NextResponse.json({ error: "A return for this item is already in progress" }, { status: 409 });

    const customerEmail = order.shippingAddress?.email || "";
    // Admin note preserves the override reason + the customer's WhatsApp (the
    // Return schema has no WhatsApp field, so it's folded into the note).
    const noteParts = [
      "Created by admin on behalf of customer.",
      `Override reason: ${String(adminNote).trim()}`,
    ];
    if (whatsappNumber && String(whatsappNumber).trim()) noteParts.push(`Customer WhatsApp: ${String(whatsappNumber).trim()}`);

    const returnId = await nextReturnId();
    const doc = await Return.create({
      returnId,
      orderId: order.orderId,
      orderObjectId: order._id,
      userId: order.userId || "",
      userEmail: customerEmail,
      userName: order.customerName || "",
      productName: resolvedProductName,
      productId: resolvedProductId,
      reason,
      description: String(description).trim(),
      whatsappNumber: whatsappNumber && String(whatsappNumber).trim() ? String(whatsappNumber).replace(/\D/g, "") : "",
      photos: [],
      status: "Requested",
      statusHistory: [{ status: "Requested", timestamp: new Date(), note: noteParts.join(" "), updatedBy: "admin" }],
      adminNotes: noteParts.join(" "),
      paidAmount,
    });

    // NOTE: admin-created returns do NOT change the order status — the order
    // stays as-is; only the Return record is created.

    // Same customer email as the self-serve flow (non-blocking; skipped if no email).
    if (customerEmail) {
      try { await sendReturnEmail(customerEmail, "requested", { returnId, orderNumber: order.orderId, customerName: order.customerName || "", productName: resolvedProductName, reason, whatsappNumber }); } catch {}
    }

    return NextResponse.json({ return: { id: doc.returnId, ...doc.toObject() } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
