import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { trackingNumber, courier } = await req.json();
    const set = {};
    if (trackingNumber != null) set.trackingNumber = trackingNumber;
    if (courier != null) set.courier = courier;
    const o = await Order.findOneAndUpdate({ orderId: params.id }, { $set: set }, { new: true });
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order: { id: o.orderId, ...o.toObject() } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
