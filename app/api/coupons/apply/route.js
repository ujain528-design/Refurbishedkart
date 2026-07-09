import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { userFromRequest } from "@/lib/server/jwt";
import { validateCoupon } from "@/lib/server/couponEngine";

export const dynamic = "force-dynamic";

// POST { code, subtotal, items?, category? } → validate against the full engine.
// Auth is optional (segment/per-customer coupons require a signed-in user; the engine
// returns a clear message when they don't).
export async function POST(req) {
  try {
    await dbConnect();
    const { code, subtotal = 0, items = [], category = "" } = await req.json();
    const auth = userFromRequest(req);
    const r = await validateCoupon(code, auth?.sub || null, Number(subtotal) || 0, items, category);
    if (!r.valid) return NextResponse.json({ valid: false, error: r.message }, { status: 400 });
    return NextResponse.json({
      valid: true,
      code: r.coupon.code,
      type: r.coupon.type,
      value: r.coupon.value,
      discount: r.discount,
    });
  } catch (e) {
    return NextResponse.json({ valid: false, error: e.message }, { status: 500 });
  }
}
