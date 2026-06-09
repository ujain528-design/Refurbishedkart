import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";
import { log, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/* POST { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }.
   Verifies the signature server-side (HMAC SHA256 over "orderId|paymentId")
   then confirms our order and generates the GST invoice. */
export async function POST(req) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ success: false, error: "Login required" }, { status: 401 });
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = await req.json();

    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generated !== razorpaySignature) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    await dbConnect();
    const order = await Order.findOne({ orderId });
    if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    if (order.userId !== auth.sub) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    order.paymentId = razorpayPaymentId;
    order.razorpayOrderId = razorpayOrderId;
    if (order.paymentMethod === "COD") {
      // COD: the ₹500 was an advance; balance on delivery. Keep paymentMethod = "COD"
      // (the order flow, not the instrument, is what matters here).
      order.codAdvancePaid = true;
    } else {
      // Online order: record the ACTUAL instrument the customer used in the Razorpay
      // modal (card / upi / netbanking / wallet), read back from Razorpay. Best-effort —
      // if the fetch fails we leave the "ONLINE" placeholder rather than failing the order.
      try {
        const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        const payment = await rzp.payments.fetch(razorpayPaymentId);
        // Razorpay returns lowercase ("card"/"upi"/...). Store UPPERCASE for consistency with "COD".
        if (payment?.method) order.paymentMethod = String(payment.method).toUpperCase();
      } catch {
        // Method fetch failed — keep the "ONLINE" placeholder; the order still confirms.
      }
    }
    order.status = "Confirmed";
    await order.save();

    // Generate the GST invoice (best-effort — never fail payment if the PDF fails).
    try {
      log("[invoice] Generating invoice for order:", order.orderId);
      const { generateInvoice } = await import("@/lib/server/invoiceGenerator");
      const invoicePath = await generateInvoice(order);
      log("[invoice] Invoice result:", invoicePath);
      order.invoiceNumber = order.orderId;
      order.invoicePath = invoicePath;
      await order.save();
    } catch (e) {
      logError("[invoice] Generation FAILED:", e.message, e.stack);
    }

    return NextResponse.json({ success: true, orderId: order.orderId, invoicePath: order.invoicePath || null });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
