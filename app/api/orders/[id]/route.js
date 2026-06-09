import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const o = await Order.findOne({ orderId: params.id }).lean();
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const isAdmin = auth.role === "admin" || auth.role === "superadmin";
    if (!isAdmin && o.userId !== auth.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ order: { id: o.orderId, ...o } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
