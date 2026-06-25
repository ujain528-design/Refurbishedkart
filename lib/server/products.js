// Server-side product querying + pricing, now backed by MongoDB. Documents are
// read with .lean() so they're plain objects — the pure pricing engine in
// lib/pdp (variantsFor/priceFor) works on them unchanged.
import { dbConnect } from "@/lib/server/mongoose";
import { Product } from "@/lib/server/models";
import { CATEGORY_SLUGS } from "@/lib/data";
import { reviewsFor, reviewSummary } from "@/lib/pdp";
import { calculateUpgradePrice, calculateSellableQty, getPricingConfig } from "@/lib/server/pricing";
import { generateProductTitle } from "@/lib/generateTitle";

function matchesQuery(p, q) {
  const hay = `${p.name} ${p.brand} ${p.category} ${p.specs || ""}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

export async function queryProducts(params = {}) {
  await dbConnect();
  let rows = await Product.find({}).lean();
  // Every product MUST have a numeric `price`. Older/bulk rows may only carry
  // `listedPrice`; mirror it so the storefront (cards, slider, formatINR) never
  // receives undefined. Done before the maxPrice filter so it compares real numbers.
  // Normalize price + attach the live SEO title (seoTitle override or generated)
  // so the storefront can display it without re-importing the generator everywhere.
  // Canonical cover image: fall back to images[0] so list/search/card consumers
  // (which read `image`) match the PDP gallery (which reads `images[]`).
  rows = rows.map((p) => ({ ...p, price: Number(p.price ?? p.listedPrice ?? 0) || 0, image: p.image || (Array.isArray(p.images) ? p.images[0] : null) || null, generatedTitle: generateProductTitle(p) }));
  const { tags, category, brand, minPrice, maxPrice, exclude, q, limit } = params;
  const priceOf = (p) => Number(p.listedPrice ?? p.price ?? 0);

  if (q) rows = rows.filter((p) => matchesQuery(p, q));
  if (tags) {
    const want = String(tags).split(",").map((t) => t.replace(/-/g, " ").toLowerCase());
    rows = rows.filter((p) => (p.tags || []).some((t) => want.includes(t.replace(/-/g, " "))));
  }
  if (category) {
    const name = CATEGORY_SLUGS[String(category).toLowerCase()] || category;
    rows = rows.filter((p) => p.category === name);
  }
  if (brand) {
    const b = String(brand).toLowerCase();
    rows = rows.filter((p) => String(p.brand || "").toLowerCase() === b);
  }
  if (minPrice) rows = rows.filter((p) => priceOf(p) >= Number(minPrice));
  if (maxPrice && Number(maxPrice) < 999999) rows = rows.filter((p) => priceOf(p) <= Number(maxPrice));
  if (exclude) rows = rows.filter((p) => String(p.id) !== String(exclude));
  rows.sort((a, b) => a.id - b.id);
  if (limit) rows = rows.slice(0, Number(limit));
  return rows;
}

/* Resolve a product by numeric id OR SEO slug. A purely numeric param is treated
   as the legacy id; anything else is looked up by slug. */
export async function getProduct(idOrSlug) {
  await dbConnect();
  const key = String(idOrSlug ?? "");
  const query = /^\d+$/.test(key) ? { id: Number(key) } : { slug: key };
  const p = await Product.findOne(query).lean();
  if (!p) return p;
  return { ...p, image: p.image || (Array.isArray(p.images) ? p.images[0] : null) || null, generatedTitle: generateProductTitle(p) };
}

/* Server-authoritative price for a configuration (PRD §5.3), new pricing model:
   listed price + upgrade cost; sellable = chassisStock (shared by all configs). */
export async function calcPrice(productId, ram, ssd) {
  const product = await getProduct(productId);
  if (!product) return { error: "Product not found", status: 404 };

  const cfg = await getPricingConfig();
  const dRam = product.defaultRam || {};
  const dSsd = product.defaultSsd || {};
  const ramCap = ram ? String(ram).split(" ")[0] : dRam.capacity;
  const ssdCap = ssd || dSsd.capacity;

  const unitPrice = calculateUpgradePrice(product, ramCap, ssdCap, cfg);
  const cfgRow = (product.configs || []).find(
    (c) => String(c.ram || "").split(" ")[0] === String(ramCap) && c.ssd === ssdCap
  );
  const available = cfgRow ? cfgRow.available !== false : true;
  const sellable = available ? calculateSellableQty(product) : 0;

  return { product, unitPrice, sellable, ram: ramCap, ssd: ssdCap };
}

/* Approved reviews for a product from the Review collection, with average +
   star breakdown computed from approved reviews only. */
export async function productReviews(id) {
  const { Review } = await import("@/lib/server/models");
  await dbConnect();
  const docs = await Review.find({ productId: Number(id), status: "approved" }).sort({ createdAt: -1 }).lean();
  const reviews = docs.map((r) => ({ id: String(r._id), name: r.reviewer, reviewer: r.reviewer, rating: r.rating, text: r.text, date: r.createdAt }));
  const total = reviews.length;
  const avg = total ? Math.round((reviews.reduce((a, r) => a + (r.rating || 0), 0) / total) * 10) / 10 : 0;
  const breakdown = [5, 4, 3, 2, 1].reduce((o, star) => { o[star] = reviews.filter((r) => r.rating === star).length; return o; }, {});
  return { reviews, summary: { avg, total, breakdown } };
}
