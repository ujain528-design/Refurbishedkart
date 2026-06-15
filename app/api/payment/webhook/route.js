import { NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/server/mongoose";
import { Order, Product } from "@/lib/server/models";
import { log, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/* Razorpay server-to-server webhook.

   SECURITY: the signature is an HMAC-SHA256 of the *raw* request body keyed by
   RAZORPAY_WEBHOOK_SECRET (the secret configured in the Razorpay dashboard, NOT
   the API key secret). We must read the raw text BEFORE JSON.parse — re-stringifying
   parsed JSON would change byte-for-byte and break verification. Mismatch ⇒ 400.

   Events handled:
     payment.captured / order.paid → confirm the order, generate invoice, (later) trigger Shiprocket
     payment.failed                → cancel the order (cancellationReason: payment_failed)
     anything else                 → acknowledged with 200 (Razorpay stops retrying)

   The webhook is idempotent: it never re-confirms an already-Confirmed order, and
   never re-cancels an already-final one, so duplicate deliveries are safe. */

/* Put chassis stock back when an order is cancelled (once). Mirrors the cancel route. */
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

export async function POST(request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      logError("[webhook] RAZORPAY_WEBHOOK_SECRET is not set");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    // 1) Raw body for signature verification (must NOT be the re-serialised JSON).
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    // Constant-time compare; lengths must match for timingSafeEqual.
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      logError("[webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 2) Now it's safe to parse.
    const body = JSON.parse(rawBody);
    const event = body?.event;
    const payment = body?.payload?.payment?.entity;
    const orderEntity = body?.payload?.order?.entity;
    const rzpOrderId = payment?.order_id || orderEntity?.id;

    log("[webhook] event:", event, "rzpOrderId:", rzpOrderId);

    if (!rzpOrderId) {
      // Nothing to correlate to one of our orders — acknowledge so Razorpay stops retrying.
      return NextResponse.json({ received: true }, { status: 200 });
    }

    await dbConnect();
    const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
    if (!order) {
      // Unknown order (e.g. test event) — acknowledge.
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (event === "payment.captured" || event === "order.paid") {
      // Idempotent: skip if already confirmed (e.g. client verify ran first).
      if (order.status !== "Confirmed") {
        order.status = "Confirmed";
        order.razorpayPaymentId = payment?.id || order.razorpayPaymentId;
        order.paymentId = payment?.id || order.paymentId;
        order.razorpaySignature = signature;
        order.paidAt = new Date();
        if (order.paymentMethod === "COD") order.codAdvancePaid = true;
        else if (payment?.method) order.paymentMethod = String(payment.method).toUpperCase();
        await order.save();

        // GST invoice — best-effort, never fail the webhook on a PDF error.
        try {
          const { generateInvoice } = await import("@/lib/server/invoiceGenerator");
          const invoicePath = await generateInvoice(order);
          order.invoiceNumber = order.orderId;
          order.invoicePath = invoicePath;
          await order.save();
        } catch (e) {
          logError("[webhook][invoice] generation failed:", e.message);
        }

        // TODO: trigger Shiprocket order creation
        // await createShiprocketOrder(order)
      }
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (event === "payment.failed") {
      // Only cancel if still awaiting payment — never override a Confirmed/fulfilled order.
      if (order.status === "payment_pending") {
        await releaseStock(order);
        order.status = "Cancelled";
        order.cancellationReason = "payment_failed";
        order.cancelledAt = new Date();
        order.razorpayPaymentId = payment?.id || order.razorpayPaymentId;
        await order.save();
      }
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Any other event — acknowledge without acting.
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    logError("[webhook] error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
