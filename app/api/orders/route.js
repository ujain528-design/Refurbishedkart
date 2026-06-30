import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order, Coupon, Product, nextOrderId } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";
import { calcPrice } from "@/lib/server/products";
import { getStoreSettings, deliveryRules } from "@/lib/server/settings";
import { computeLineTaxes, SELLER_STATE } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const { items = [], shippingAddress, paymentMethod, couponCode, buyerGstin } = await req.json();
    if (!items.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    const settings = await getStoreSettings();
    const defGst = Number(settings.gstRate) || 18;
    const defHsn = settings.hsnDefault || "8471";

    // Recompute every line server-side — never trust client prices (PRD §5.3).
    // GST is a flat store-wide rate (defGst); HSN is still per-product. Both are
    // stamped on the line so the invoice/admin render authoritatively.
    const lines = [];
    for (const it of items) {
      const q = await calcPrice(it.productId, it.ram, it.ssd);
      if (q.error) return NextResponse.json({ error: `Product ${it.productId} unavailable` }, { status: 409 });
      if (q.sellable < (it.qty || 1)) return NextResponse.json({ error: `${q.product.name} is out of stock` }, { status: 409 });
      const hsnCode = q.product.hsnCode || defHsn;
      lines.push({ productId: q.product.id, name: q.product.name, ram: q.ram, ssd: q.ssd, qty: it.qty || 1, unitPrice: q.unitPrice, gstRate: defGst, hsnCode });
    }
    const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);

    // Re-validate the coupon against the DB at ORDER TIME — never trust any
    // client-sent discount. Checks: exists, active, not expired (by date), and
    // the order meets the minimum. Discount is recomputed here. A coupon that was
    // valid when applied but has since expired/been disabled is rejected so the
    // customer is never silently charged full price (and can't sneak a stale
    // discount through either).
    let discount = 0, appliedCode = null;
    if (couponCode) {
      const c = await Coupon.findOne({ code: String(couponCode).toUpperCase(), active: true }).lean();
      const expired = c?.expiry && new Date(c.expiry).getTime() < Date.now();
      if (!c || expired) {
        return NextResponse.json({ error: "Coupon no longer valid, please remove and retry." }, { status: 400 });
      }
      if (subtotal < (c.minSubtotal || 0)) {
        return NextResponse.json({ error: `This coupon needs a minimum order of ₹${c.minSubtotal}. Please remove it or add more to your cart.` }, { status: 400 });
      }
      // Usage limit (null/0 → unlimited). READ-ONLY at order creation — the slot
      // is NOT claimed here. It's claimed atomically only when payment is confirmed
      // (lib/server/couponUsage.claimCouponSlotOnce), so an abandoned/unpaid order
      // never burns a slot. This check just blocks placing an order against a coupon
      // that's already exhausted.
      if (Number(c.usageLimit) > 0 && (c.used || 0) >= c.usageLimit) {
        return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 });
      }
      discount = c.type === "flat" ? c.value : Math.round(subtotal * (c.value / 100));
      appliedCode = c.code;
    }
    const { freeDeliveryAbove, deliveryFee } = deliveryRules(settings);
    // Free-shipping threshold uses the PRODUCT SUBTOTAL **before** the coupon
    // discount, so a coupon can't push an order under the free-shipping line. Must
    // match the checkout UI (CheckoutView). "₹7,999 and above" ships free (>=).
    // productTotal (post-discount) still drives the total + COD upfront below.
    const productTotal = subtotal - discount;
    const delivery = subtotal >= freeDeliveryAbove ? 0 : deliveryFee;
    const total = productTotal + delivery;
    // Per-line GST at each product's rate; inter-state derived from the ship-to
    // state (CGST+SGST intra-Delhi, IGST otherwise) — same basis the invoice uses.
    const interState = (shippingAddress?.state || SELLER_STATE) !== SELLER_STATE;
    const gst = computeLineTaxes(lines, discount, interState).gst;

    // Cash on Delivery: upfront = 10% of the product total (rounded up) PLUS the
    // full shipping fee, charged via Razorpay now; the balance is paid on delivery.
    const isCod = String(paymentMethod || "").toUpperCase() === "COD";
    const codUpfront = isCod ? Math.ceil(productTotal * 0.1) + delivery : undefined;
    const codRemaining = isCod ? total - codUpfront : undefined;

    const orderId = await nextOrderId();
    const order = await Order.create({
      orderId, userId: auth.sub, lines, subtotal, discount, delivery, shippingCharge: delivery, gst, total,
      couponCode: appliedCode, paymentMethod: paymentMethod || "UPI",
      shippingAddress: shippingAddress || null, buyerGstin: buyerGstin || null,
      customerName: shippingAddress?.name || auth.name || null,
      // COD bookkeeping (only set for COD orders).
      ...(isCod ? { codUpfront, codRemaining, codStatus: "pending" } : {}),
      // Created unconfirmed; payment webhook/verification flips it to Confirmed
      // (online) or cod_pending (COD, after the 10% advance). The customer has
      // 30 minutes to pay the amount due before auto-cancellation. The coupon usage
      // slot is claimed at payment confirmation, not here.
      status: "payment_pending",
      paymentDeadline: new Date(Date.now() + 30 * 60 * 1000),
    });

    // Deduct chassis stock: any config sold deducts 1 chassis per unit (qty).
    const perProduct = {};
    for (const l of lines) perProduct[l.productId] = (perProduct[l.productId] || 0) + l.qty;
    for (const [pid, qty] of Object.entries(perProduct)) {
      const p = await Product.findOne({ id: Number(pid) });
      if (p) {
        const next = Math.max(0, (p.chassisStock ?? p.stock ?? 0) - qty);
        p.chassisStock = next; p.stock = next; // mirror
        await p.save();
      }
    }

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
