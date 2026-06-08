import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order, Coupon, nextOrderId } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";
import { calcPrice } from "@/lib/server/products";
import { gstBreakup } from "@/lib/data";

const FREE_DELIVERY_ABOVE = 999, DELIVERY_FEE = 99;

export const dynamic = "force-dynamic";

export async function POST(req) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const { items = [], shippingAddress, paymentMethod, couponCode, buyerGstin } = await req.json();
    if (!items.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    // Recompute every line server-side — never trust client prices (PRD §5.3).
    const lines = [];
    for (const it of items) {
      const q = await calcPrice(it.productId, it.ram, it.ssd);
      if (q.error) return NextResponse.json({ error: `Product ${it.productId} unavailable` }, { status: 409 });
      if (q.sellable < (it.qty || 1)) return NextResponse.json({ error: `${q.product.name} is out of stock` }, { status: 409 });
      lines.push({ productId: q.product.id, name: q.product.name, ram: q.ram, ssd: q.ssd, qty: it.qty || 1, unitPrice: q.unitPrice });
    }
    const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);

    // Validate coupon against the DB, server-side.
    let discount = 0, appliedCode = null;
    if (couponCode) {
      const c = await Coupon.findOne({ code: String(couponCode).toUpperCase(), active: true }).lean();
      if (c && subtotal >= (c.minSubtotal || 0)) {
        discount = c.type === "flat" ? c.value : Math.round(subtotal * (c.value / 100));
        appliedCode = c.code;
      }
    }
    const delivery = subtotal > FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
    const total = subtotal - discount + delivery;
    const gst = gstBreakup(subtotal - discount, false);

    const orderId = await nextOrderId();
    const order = await Order.create({
      orderId, userId: auth.sub, lines, subtotal, discount, delivery, gst, total,
      couponCode: appliedCode, paymentMethod: paymentMethod || "UPI",
      shippingAddress: shippingAddress || null, buyerGstin: buyerGstin || null,
      status: paymentMethod === "COD" ? "Pending" : "Confirmed",
    });
    return NextResponse.json({ order: { id: order.orderId, ...order.toObject() } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const docs = await Order.find({ userId: auth.sub }).sort({ createdAt: -1 }).lean();
    const orders = docs.map((o) => ({ id: o.orderId, ...o }));
    return NextResponse.json({ orders });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
