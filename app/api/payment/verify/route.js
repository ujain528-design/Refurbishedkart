import { NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

/* POST { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }.
   Verifies the signature server-side (HMAC SHA256 over "orderId|paymentId")
   then confirms our order. */
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
      order.codAdvancePaid = true; // ₹500 advance paid; balance on delivery
      order.status = "Confirmed";
    } else {
      order.status = "Confirmed";
    }
    await order.save();

    // TODO (not built): invoice PDF generation + order confirmation email.
    return NextResponse.json({ success: true, orderId: order.orderId });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
