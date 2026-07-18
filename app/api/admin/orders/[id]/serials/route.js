import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

/* PATCH /api/admin/orders/[id]/serials — admin-only. Sets order.serialNumbers
   WITHOUT changing status. Used to add/fix serial numbers on already-shipped or
   delivered orders (e.g. orders placed before serials were mandatory). */
export async function PATCH(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { serialNumbers } = await req.json().catch(() => ({}));
    const serials = Array.isArray(serialNumbers) ? serialNumbers : [];
    const clean = serials.map((s) => ({
      productId: Number(s.productId) || undefined,
      productName: String(s.productName || ""),
      variant: String(s.variant || ""),
      serialNumber: String(s.serialNumber || "").trim(),
    }));
    const o = await Order.findOneAndUpdate({ orderId: params.id }, { $set: { serialNumbers: clean } }, { new: true });
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order: { id: o.orderId, ...o.toObject() } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
