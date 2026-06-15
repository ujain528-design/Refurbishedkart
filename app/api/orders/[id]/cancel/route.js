import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order, Product } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

const CANCELLABLE = ["payment_pending", "Pending", "Confirmed"];

/* Release chassis stock back when an order is cancelled (once). */
async function releaseStock(order) {
  if (order.stockReleased) return;
  const perProduct = {};
  for (const l of order.lines || []) perProduct[l.productId] = (perProduct[l.productId] || 0) + l.qty;
  for (const [pid, qty] of Object.entries(perProduct)) {
    const p = await Product.findOne({ id: Number(pid) });
    if (p) { const next = (p.chassisStock ?? p.stock ?? 0) + qty; p.chassisStock = next; p.stock = next; await p.save(); }
  }
  order.stockReleased = true;
}

export async function POST(req, { params }) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const o = await Order.findOne({ orderId: params.id });
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (o.userId !== auth.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!CANCELLABLE.includes(o.status)) {
      return NextResponse.json({ error: `Cannot cancel a ${o.status} order` }, { status: 409 });
    }
    await releaseStock(o);
    o.status = "Cancelled";
    o.cancellationReason = "user_cancelled";
    o.cancelledAt = new Date();
    await o.save();
    return NextResponse.json({ order: { id: o.orderId, ...o.toObject() } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
