import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Coupon } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { couponFieldsFromBody } from "@/lib/server/couponFields";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const d = await req.json();
    const set = couponFieldsFromBody(d);
    // `used` is server-managed (claimed at payment). Never let a form edit reset it.
    delete set.used;
    const coupon = await Coupon.findByIdAndUpdate(params.id, { $set: set }, { new: true });
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    return NextResponse.json({ coupon });
  } catch (e) {
    const msg = e.code === 11000 ? "Coupon code already exists" : e.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
