import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status"), q = sp.get("q");
    const filter = {};
    if (status && status !== "all") filter.status = status;
    let docs = await Order.find(filter).sort({ createdAt: -1 }).lean();
    if (q) {
      const t = q.toLowerCase();
      docs = docs.filter((o) => `${o.orderId} ${o.customerName || ""}`.toLowerCase().includes(t));
    }
    const orders = docs.map((o) => ({ id: o.orderId, ...o }));
    return NextResponse.json({ orders, total: orders.length });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
