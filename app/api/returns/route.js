import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order, Return, nextReturnId } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";
import { getStoreSettings } from "@/lib/server/settings";
import { sendReturnEmail } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;
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
    const { orderId, productId, productName, reason, description, photos } = await req.json();

    if (!orderId) return NextResponse.json({ error: "Order is required" }, { status: 400 });
    if (!reason) return NextResponse.json({ error: "Please select a reason" }, { status: 400 });
    if (!description || !String(description).trim()) return NextResponse.json({ error: "Please describe the issue" }, { status: 400 });

    // Ownership: the order must belong to this user.
    const order = await Order.findOne({ orderId, userId: auth.sub }).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Must be delivered.
    if (order.status !== "Delivered") return NextResponse.json({ error: "Only delivered orders can be returned" }, { status: 409 });

    // Within the return window (deliveredAt → fallback updatedAt/createdAt).
    const settings = await getStoreSettings();
    const returnDays = Number(settings.returnDays ?? 7);
    const base = new Date(order.deliveredAt || order.updatedAt || order.createdAt);
    const days = Math.floor((Date.now() - base.getTime()) / DAY);
    if (days > returnDays) return NextResponse.json({ error: "Return window closed" }, { status: 409 });

    // Resolve the line being returned (default: the only/first line).
    const lines = order.lines || [];
    const line =
      (productId != null && lines.find((l) => String(l.productId) === String(productId))) ||
      (productName && lines.find((l) => l.name === productName)) ||
      lines[0] ||
      null;
    const resolvedProductId = productId ?? (line ? String(line.productId) : "");
    const resolvedProductName = productName || (line ? line.name : "");
    const paidAmount = line ? (Number(line.unitPrice) || 0) * (Number(line.qty) || 1) : 0;

    // No duplicate active return for this order + product.
    const dup = await Return.findOne({ orderId, productId: resolvedProductId, status: { $in: ACTIVE } }).lean();
    if (dup) return NextResponse.json({ error: "A return for this item is already in progress" }, { status: 409 });

    const returnId = await nextReturnId();
    const doc = await Return.create({
      returnId,
      orderId,
      orderObjectId: order._id,
      userId: auth.sub,
      userEmail: auth.email || "",
      userName: order.customerName || auth.name || "",
      productName: resolvedProductName,
      productId: resolvedProductId,
      reason,
      description: String(description).trim(),
      photos: Array.isArray(photos) ? photos.slice(0, 3) : [],
      status: "Requested",
      paidAmount,
    });

    // Notify the customer (non-blocking).
    try { await sendReturnEmail(auth.email, "requested", { returnId, productName: resolvedProductName }); } catch {}

    return NextResponse.json({ return: { id: doc.returnId, ...doc.toObject() } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
