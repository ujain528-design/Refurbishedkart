// Server-side product querying + pricing, now backed by MongoDB. Documents are
// read with .lean() so they're plain objects — the pure pricing engine in
// lib/pdp (variantsFor/priceFor) works on them unchanged.
import { dbConnect } from "@/lib/server/mongoose";
import { Product } from "@/lib/server/models";
import { CATEGORY_SLUGS } from "@/lib/data";
import { variantsFor, priceFor, reviewsFor, reviewSummary } from "@/lib/pdp";

function matchesQuery(p, q) {
  const hay = `${p.name} ${p.brand} ${p.category} ${p.specs || ""}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

export async function queryProducts(params = {}) {
  await dbConnect();
  let rows = await Product.find({}).lean();
  const { tags, category, brand, maxPrice, exclude, q, limit } = params;

  if (q) rows = rows.filter((p) => matchesQuery(p, q));
  if (tags) {
    const want = String(tags).split(",").map((t) => t.replace(/-/g, " ").toLowerCase());
    rows = rows.filter((p) => (p.tags || []).some((t) => want.includes(t.replace(/-/g, " "))));
  }
  if (category) {
    const name = CATEGORY_SLUGS[String(category).toLowerCase()] || category;
    rows = rows.filter((p) => p.category === name);
  }
  if (brand) rows = rows.filter((p) => p.brand === brand);
  if (maxPrice) rows = rows.filter((p) => p.price <= Number(maxPrice));
  if (exclude) rows = rows.filter((p) => String(p.id) !== String(exclude));
  rows.sort((a, b) => a.id - b.id);
  if (limit) rows = rows.slice(0, Number(limit));
  return rows;
}

export async function getProduct(id) {
  await dbConnect();
  return Product.findOne({ id: Number(id) }).lean();
}

/* Server-authoritative price for a configuration (PRD §5.3). */
export async function calcPrice(productId, ram, ssd) {
  const product = await getProduct(productId);
  if (!product) return { error: "Product not found", status: 404 };
  const variants = variantsFor(product);
  if (!variants) return { product, unitPrice: product.price, sellable: product.stock, ram: null, ssd: null };
  const r = ram != null ? Number(ram) : null;
  if (r != null && ssd) {
    const sellable = Math.min(variants.unitStock, variants.ramStock[r] ?? 0, variants.ssdStock[ssd] ?? 0);
    return { product, unitPrice: priceFor(product, r, ssd), sellable, ram: r, ssd };
  }
  return { product, variants, unitPrice: product.price, sellable: product.stock };
}

export function productReviews(id) {
  const reviews = reviewsFor(Number(id));
  return { reviews, summary: reviewSummary(reviews) };
}
