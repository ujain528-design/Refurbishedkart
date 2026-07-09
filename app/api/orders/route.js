import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order, Coupon, Product, nextOrderId } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";
import { calcPrice } from "@/lib/server/products";
import { getStoreSettings, deliveryRules } from "@/lib/server/settings";
import { computeLineTaxes, SELLER_STATE } from "@/lib/data";
import { sendOrderConfirmationEmail, sendOrderAdminNotification } from "@/lib/server/mailer";
import { validateCoupon } from "@/lib/server/couponEngine";

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
    const couponItems = []; // {category, brand} per line — for coupon restrictions
    for (const it of items) {
      const q = await calcPrice(it.productId, it.ram, it.ssd);
      if (q.error) return NextResponse.json({ error: `Product ${it.productId} unavailable` }, { status: 409 });
      if (q.sellable < (it.qty || 1)) return NextResponse.json({ error: `${q.product.name} is out of stock` }, { status: 409 });
      const hsnCode = q.product.hsnCode || defHsn;
      lines.push({ productId: q.product.id, name: q.product.name, ram: q.ram, ssd: q.ssd, qty: it.qty || 1, unitPrice: q.unitPrice, gstRate: defGst, hsnCode });
      couponItems.push({ category: q.product.category, brand: q.product.brand });
    }
    const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);

    // Re-validate the coupon against the DB at ORDER TIME — never trust any
    // client-sent discount. Checks: exists, active, not expired (by date), and
    // the order meets the minimum. Discount is recomputed here. A coupon that was
    // valid when applied but has since expired/been disabled is rejected so the
    // customer is never silently charged full price (and can't sneak a stale
    // discount through either).
    // Re-validate through the full coupon engine (segments, per-customer limit,
    // category/brand restrictions, date window, discount cap, etc.). The engine is
    // the single source of truth — same code the /apply and /auto endpoints use — so
    // a coupon that was valid when applied but has since expired/been disabled/used
    // up is rejected here and the discount is recomputed authoritatively. The total
    // usage slot is still only CLAIMED at payment confirmation (couponUsage), never
    // here, so an abandoned order can't burn a slot.
    let discount = 0, appliedCode = null;
    if (couponCode) {
      const r = await validateCoupon(couponCode, auth.sub, subtotal, couponItems, "");
      if (!r.valid) return NextResponse.json({ error: r.message }, { status: 400 });
      discount = r.discount;
      appliedCode = r.coupon.code;
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
    // Guarantee a recipient email on the order: the address form's email if present,
    // else the signed-in account email. Saved addresses may not carry an email, so
    // this backfills it at order time (status emails depend on it).
    const shipTo = shippingAddress
      ? { ...shippingAddress, email: shippingAddress.email || auth.email || "" }
      : null;
    const order = await Order.create({
      orderId, userId: auth.sub, lines, subtotal, discount, delivery, shippingCharge: delivery, gst, total,
      couponCode: appliedCode, paymentMethod: paymentMethod || "UPI",
      shippingAddress: shipTo, buyerGstin: buyerGstin || null,
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

    // Order confirmation emails — customer + admin, in parallel. Best-effort: a mail
    // failure must NEVER block order creation (the order is already saved). Errors are
    // logged, not thrown.
    try {
      const orderObj = order.toObject();
      const customerEmail = auth.email || shippingAddress?.email || "";
      const whatsappOptIn = (shippingAddress?.whatsappOptIn ?? orderObj.shippingAddress?.whatsappOptIn) === true;
      await Promise.all([
        sendOrderConfirmationEmail(customerEmail, orderObj),
        sendOrderAdminNotification(orderObj, { customerEmail, phone: shippingAddress?.phone, whatsappOptIn }),
      ]);
    } catch (mailErr) {
      // eslint-disable-next-line no-console
      console.error("Order email failed:", mailErr.message);
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
