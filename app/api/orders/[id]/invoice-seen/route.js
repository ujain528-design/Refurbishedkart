import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

/* PATCH /api/orders/[id]/invoice-seen — authenticated customer, owner-only.
   Marks the invoice-updated notification as seen (dismisses the account popup). */
export async function PATCH(req, { params }) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const order = await Order.findOne({ orderId: params.id });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (String(order.userId) !== String(auth.sub)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    order.invoiceUpdateSeen = true;
    await order.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
