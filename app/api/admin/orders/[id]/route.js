import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const o = await Order.findOne({ orderId: params.id }).lean();
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order: { id: o.orderId, ...o } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
