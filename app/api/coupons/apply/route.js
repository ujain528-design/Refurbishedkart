import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Coupon } from "@/lib/server/models";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await dbConnect();
    const { code, subtotal = 0 } = await req.json();
    const c = await Coupon.findOne({ code: String(code || "").trim().toUpperCase(), active: true }).lean();
    if (!c) return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { status: 400 });
    if (subtotal < (c.minSubtotal || 0)) {
      return NextResponse.json({ valid: false, error: `Minimum order ₹${c.minSubtotal}` }, { status: 400 });
    }
    const discount = c.type === "flat" ? c.value : Math.round(subtotal * (c.value / 100));
    return NextResponse.json({ valid: true, code: c.code, type: c.type, value: c.value, discount });
  } catch (e) {
    return NextResponse.json({ valid: false, error: e.message }, { status: 500 });
  }
}
