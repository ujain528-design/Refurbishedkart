import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

const VALID = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { status } = await req.json();
    if (!VALID.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const o = await Order.findOneAndUpdate({ orderId: params.id }, { $set: { status } }, { new: true });
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order: { id: o.orderId, ...o.toObject() } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
