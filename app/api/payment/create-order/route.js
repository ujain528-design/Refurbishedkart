import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

/* POST { orderId, amount } (amount in rupees). Creates a Razorpay order and
   stores its id on our Order. Returns the fields the client checkout needs. */
export async function POST(req) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    const { orderId, amount } = await req.json();
    const rupees = Number(amount);
    if (!rupees || rupees <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const amountPaise = Math.round(rupees * 100);
    const rzpOrder = await rzp.orders.create({ amount: amountPaise, currency: "INR", receipt: orderId || `rcpt_${Date.now()}` });

    if (orderId) {
      await dbConnect();
      await Order.findOneAndUpdate({ orderId }, { $set: { razorpayOrderId: rzpOrder.id } });
    }

    return NextResponse.json({
      razorpayOrderId: rzpOrder.id,
      amount: amountPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    return NextResponse.json({ error: e?.error?.description || e.message || "Razorpay order failed" }, { status: 500 });
  }
}
