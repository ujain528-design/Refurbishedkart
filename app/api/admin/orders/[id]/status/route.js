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
    // Stamp deliveredAt the first time an order is marked Delivered — it's the
    // base date for the return window.
    const patch = { status };
    if (status === "Delivered") {
      const existing = await Order.findOne({ orderId: params.id }).select("deliveredAt").lean();
      if (existing && !existing.deliveredAt) patch.deliveredAt = new Date();
    }
    const o = await Order.findOneAndUpdate({ orderId: params.id }, { $set: patch }, { new: true });
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order: { id: o.orderId, ...o.toObject() } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
