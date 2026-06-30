import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order, Return, nextReturnId } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";
import { lineRefundBasis } from "@/lib/server/refunds";
import { sendReturnEmail, sendReturnAdminAlert } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;
const RETURN_WINDOW_DAYS = 7; // fixed by policy; mirrors the client-side gate
const ACTIVE = ["Requested", "Approved", "Received", "Refunded"]; // a Rejected return may be re-requested

// GET — the signed-in customer's own returns, newest first.
export async function GET(req) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const docs = await Return.find({ userId: auth.sub }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ returns: docs.map((r) => ({ id: r.returnId, ...r })) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — create a return request for one of the user's delivered orders.
export async function POST(req) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const { orderId, productId, productName, reason, description, photos, whatsappNumber } = await req.json();

    if (!orderId) return NextResponse.json({ error: "Order is required" }, { status: 400 });
    if (!reason) return NextResponse.json({ error: "Please select a reason" }, { status: 400 });
    if (!description || String(description).trim().length < 20) {
      return NextResponse.json({ error: "Please describe the issue in at least 20 characters" }, { status: 400 });
    }
    // WhatsApp number used to send the unboxing video: exactly 10 digits, 6–9 lead.
    const wa = String(whatsappNumber || "").replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(wa)) {
      return NextResponse.json({ error: "Enter a valid 10-digit WhatsApp number (the one you sent the unboxing video from)" }, { status: 400 });
    }

    // Ownership: the order must belong to this user.
    const order = await Order.findOne({ orderId, userId: auth.sub }).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Must be delivered.
    if (order.status !== "Delivered") return NextResponse.json({ error: "Only delivered orders can be returned" }, { status: 409 });

    // Within the fixed 7-day return window (policy). Base date is deliveredAt,
    // falling back to createdAt — deliberately NOT updatedAt, which an admin edit
    // would bump to today and wrongly reopen an expired window. This server check
    // is authoritative: it blocks late returns even via direct API calls when the
    // UI button is hidden.
    const base = new Date(order.deliveredAt || order.createdAt);
    const days = Math.floor((Date.now() - base.getTime()) / DAY);
    if (days > RETURN_WINDOW_DAYS) {
      return NextResponse.json(
        { error: "Return window expired. Returns are only accepted within 7 days of delivery. Contact us at +91 8448296273 for assistance." },
        { status: 400 }
      );
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
    const dup = await Return.findOne({ orderId, productId: resolvedProductId, status: { $in: ACTIVE } }).lean();
    if (dup) return NextResponse.json({ error: "A return for this item is already in progress" }, { status: 409 });

    const customerEmail = auth.email || order.shippingAddress?.email || "";
    const customerName = order.customerName || auth.name || "";

    const returnId = await nextReturnId();
    const doc = await Return.create({
      returnId,
      orderId,
      orderObjectId: order._id,
      userId: auth.sub,
      userEmail: customerEmail,
      userName: customerName,
      productName: resolvedProductName,
      productId: resolvedProductId,
      reason,
      description: String(description).trim(),
      whatsappNumber: wa,
      photos: Array.isArray(photos) ? photos.slice(0, 3) : [],
      status: "Requested",
      statusHistory: [{ status: "Requested", timestamp: new Date(), note: "Return requested by customer", updatedBy: "customer" }],
      paidAmount,
    });

    // Reflect the in-progress return on the order so the customer's order list shows it.
    try { await Order.updateOne({ orderId, userId: auth.sub }, { $set: { status: "return_requested" } }); } catch {}

    // Emails (non-blocking): support-team alert + customer confirmation.
    const emailData = { returnId, orderNumber: orderId, customerName, customerEmail, productName: resolvedProductName, reason, description: String(description).trim(), whatsappNumber: wa };
    try { await sendReturnAdminAlert(emailData); } catch {}
    try { await sendReturnEmail(customerEmail, "requested", emailData); } catch {}

    return NextResponse.json({ return: { id: doc.returnId, ...doc.toObject() } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
