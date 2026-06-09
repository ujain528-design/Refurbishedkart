// Server-side product querying + pricing, now backed by MongoDB. Documents are
// read with .lean() so they're plain objects — the pure pricing engine in
// lib/pdp (variantsFor/priceFor) works on them unchanged.
import { dbConnect } from "@/lib/server/mongoose";
import { Product } from "@/lib/server/models";
import { CATEGORY_SLUGS } from "@/lib/data";
import { reviewsFor, reviewSummary } from "@/lib/pdp";
import { calculateUpgradePrice, calculateSellableQty, getPricingConfig } from "@/lib/server/pricing";

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

export function productReviews(id) {
  const reviews = reviewsFor(Number(id));
  return { reviews, summary: reviewSummary(reviews) };
}
