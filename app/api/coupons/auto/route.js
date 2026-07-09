import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Coupon } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";
import { validateCoupon } from "@/lib/server/couponEngine";

export const dynamic = "force-dynamic";

// GET ?subtotal=&category= → the best auto-applicable coupon for this customer (the
// one giving the highest discount), or { coupon: null } if none qualifies.
export async function GET(req) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const url = new URL(req.url);
    const subtotal = Number(url.searchParams.get("subtotal")) || 0;
    const category = url.searchParams.get("category") || "";

    const candidates = await Coupon.find({ autoApply: true, active: true }).select("code").lean();
    let best = null;
    for (const cand of candidates) {
      // eslint-disable-next-line no-await-in-loop -- small set of auto-apply coupons
      const r = await validateCoupon(cand.code, auth.sub, subtotal, [], category);
      if (r.valid && r.discount > 0 && (!best || r.discount > best.discount)) {
        best = { code: r.coupon.code, type: r.coupon.type, value: r.coupon.value, discount: r.discount };
      }
    }
    return NextResponse.json({ coupon: best });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
