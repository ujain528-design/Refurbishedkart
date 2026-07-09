import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Coupon } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { couponFieldsFromBody } from "@/lib/server/couponFields";

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
    const fields = couponFieldsFromBody(d);
    if (!fields.code) return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    const coupon = await Coupon.create(fields);
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (e) {
    const msg = e.code === 11000 ? "Coupon code already exists" : e.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
