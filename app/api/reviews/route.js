import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { dbConnect } from "@/lib/server/mongoose";
import { Review, Order, Product } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

const REVIEW_DIR = path.join(process.cwd(), "public", "uploads", "reviews");
const IMG_EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_IMG_BYTES = 5 * 1024 * 1024; // 5MB per uploaded image
const MAX_IMAGES = 3; // combined uploaded + selected product images

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
    // multipart/form-data (fields + optional uploaded photos)
    const form = await req.formData();
    const pid = Number(form.get("productId"));
    const stars = Number(form.get("rating"));
    const text = String(form.get("body") || "").trim();
    const title = String(form.get("title") || "");
    let productImages = [];
    try { productImages = JSON.parse(form.get("productImages") || "[]"); } catch { productImages = []; }
    productImages = (Array.isArray(productImages) ? productImages : []).filter((s) => typeof s === "string" && s).slice(0, MAX_IMAGES);
    const files = form.getAll("photos").filter((f) => f && typeof f !== "string");

    if (!pid) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    if (!(stars >= 1 && stars <= 5)) return NextResponse.json({ error: "Please select a star rating" }, { status: 400 });
    if (text.length < 20) return NextResponse.json({ error: "Review must be at least 20 characters" }, { status: 400 });

    if (!(await hasPurchased(auth.sub, pid))) {
      return NextResponse.json({ error: "Verified purchase required to write a review" }, { status: 403 });
    }
    const dup = await Review.findOne({ productId: pid, userId: auth.sub }).select("_id").lean();
    if (dup) return NextResponse.json({ error: "You've already reviewed this product" }, { status: 409 });

    // Save uploaded photos (product-image URLs are stored as-is, no re-upload).
    const uploaded = [];
    const remaining = Math.max(0, MAX_IMAGES - productImages.length);
    if (files.length && remaining > 0) await mkdir(REVIEW_DIR, { recursive: true });
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      const ext = IMG_EXT[file.type];
      if (!ext) return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed" }, { status: 400 });
      if (file.size > MAX_IMG_BYTES) return NextResponse.json({ error: "Each image must be 5MB or less" }, { status: 400 });
      const name = `review-${auth.sub}-${Date.now()}-${i}.${ext}`;
      await writeFile(path.join(REVIEW_DIR, name), Buffer.from(await file.arrayBuffer()));
      uploaded.push(`/uploads/reviews/${name}`);
    }
    const images = [...uploaded, ...productImages].slice(0, MAX_IMAGES);

    const product = await Product.findOne({ id: pid }).select("name").lean();
    const review = await Review.create({
      productId: pid,
      productName: product?.name || "",
      reviewer: auth.name || "Verified Buyer",
      userId: auth.sub,
      rating: stars,
      title: String(title || "").trim().slice(0, 100) || undefined,
      text,
      images,
      verifiedPurchase: true,
      status: "pending",
    });
    return NextResponse.json({ ok: true, id: String(review._id) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
