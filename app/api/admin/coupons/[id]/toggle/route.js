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
    const { active } = await req.json();
    const coupon = await Coupon.findByIdAndUpdate(params.id, { $set: { active: !!active } }, { new: true });
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    return NextResponse.json({ coupon });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
