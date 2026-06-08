import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const auth = userFromRequest(req);
  try {
    await dbConnect();
    const o = await Order.findOne({ orderId: params.id }).lean();
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (auth && o.userId !== auth.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ order: { id: o.orderId, ...o } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
