import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

const CANCELLABLE = ["Pending", "Confirmed"];

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
    o.status = "Cancelled";
    o.cancelledAt = new Date();
    await o.save();
    return NextResponse.json({ order: { id: o.orderId, ...o.toObject() } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
