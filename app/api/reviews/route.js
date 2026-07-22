import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Review, Order, Product } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

// True if the user has a DELIVERED order that contains this product.
async function hasPurchased(userId, productId) {
  const o = await Order.findOne({
    userId,
    "lines.productId": productId,
    $or: [{ status: "Delivered" }, { deliveredAt: { $exists: true, $ne: null } }],
  }).select("_id").lean();
  return !!o;
}

/* GET /api/reviews?productId=  → eligibility for the current customer.
   Returns 200 { loggedIn:false } when not authenticated (so the client shows the
   "login to review" state without the shared 401→/login redirect). */
export async function GET(req) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ loggedIn: false });
  try {
    await dbConnect();
    const pid = Number(new URL(req.url).searchParams.get("productId"));
    if (!pid) return NextResponse.json({ error: "productId required" }, { status: 400 });
    const [purchased, existing] = await Promise.all([
      hasPurchased(auth.sub, pid),
      Review.findOne({ productId: pid, userId: auth.sub }).select("_id").lean(),
    ]);
    return NextResponse.json({ loggedIn: true, purchased, alreadyReviewed: !!existing });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* POST /api/reviews — authenticated customer submits a review.
   Verified-purchase + one-per-product enforced server-side; saved as pending. */
export async function POST(req) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const { productId, rating, title, body } = await req.json();
    const pid = Number(productId);
    const stars = Number(rating);
    const text = String(body || "").trim();
    if (!pid) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    if (!(stars >= 1 && stars <= 5)) return NextResponse.json({ error: "Please select a star rating" }, { status: 400 });
    if (text.length < 20) return NextResponse.json({ error: "Review must be at least 20 characters" }, { status: 400 });

    if (!(await hasPurchased(auth.sub, pid))) {
      return NextResponse.json({ error: "Verified purchase required to write a review" }, { status: 403 });
    }
    const dup = await Review.findOne({ productId: pid, userId: auth.sub }).select("_id").lean();
    if (dup) return NextResponse.json({ error: "You've already reviewed this product" }, { status: 409 });

    const product = await Product.findOne({ id: pid }).select("name").lean();
    const review = await Review.create({
      productId: pid,
      productName: product?.name || "",
      reviewer: auth.name || "Verified Buyer",
      userId: auth.sub,
      rating: stars,
      title: String(title || "").trim().slice(0, 100) || undefined,
      text,
      verifiedPurchase: true,
      status: "pending",
    });
    return NextResponse.json({ ok: true, id: String(review._id) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
