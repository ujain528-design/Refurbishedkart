import { NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

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
    if (order.paymentMethod === "COD") order.codAdvancePaid = true; // ₹500 advance; balance on delivery
    order.status = "Confirmed";
    await order.save();

    // Generate the GST invoice (best-effort — never fail payment if the PDF fails).
    try {
      console.log("[invoice] Generating invoice for order:", order.orderId);
      const { generateInvoice } = await import("@/lib/server/invoiceGenerator");
      const invoicePath = await generateInvoice(order);
      console.log("[invoice] Invoice result:", invoicePath);
      order.invoiceNumber = order.orderId;
      order.invoicePath = invoicePath;
      await order.save();
    } catch (e) {
      console.error("[invoice] Generation FAILED:", e.message, e.stack);
    }

    return NextResponse.json({ success: true, orderId: order.orderId, invoicePath: order.invoicePath || null });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
