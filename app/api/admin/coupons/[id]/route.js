import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Coupon } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const d = await req.json();
    const set = {};
    if (d.code != null) set.code = String(d.code).toUpperCase();
    if (d.type != null) set.type = d.type === "flat" ? "flat" : "percent";
    if (d.value != null) set.value = Number(d.value);
    if (d.minSubtotal != null || d.min != null) set.minSubtotal = Number(d.minSubtotal ?? d.min);
    if (d.expiry != null) set.expiry = new Date(d.expiry);
    if (d.usageLimit != null || d.limit != null) set.usageLimit = d.usageLimit ?? d.limit;
    if (d.active != null) set.active = !!d.active;
    const coupon = await Coupon.findByIdAndUpdate(params.id, { $set: set }, { new: true });
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    return NextResponse.json({ coupon });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
