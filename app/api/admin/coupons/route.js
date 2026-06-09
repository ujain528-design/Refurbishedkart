import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Coupon } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const d = await req.json();
    const coupon = await Coupon.create({
      code: String(d.code || "").toUpperCase(),
      type: d.type === "flat" ? "flat" : "percent",
      value: Number(d.value),
      minSubtotal: Number(d.minSubtotal || d.min || 0),
      expiry: d.expiry ? new Date(d.expiry) : undefined,
      usageLimit: d.usageLimit ?? d.limit ?? undefined,
      active: d.active !== false,
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (e) {
    const msg = e.code === 11000 ? "Coupon code already exists" : e.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
