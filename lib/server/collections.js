// Collection helpers — resolve a curated collection's product ids to full,
// storefront-shaped product objects so /collections/[slug] renders identical cards
// to the listing pages. Kept separate from the Tag/homepage-row system.
import { dbConnect } from "@/lib/server/mongoose";
import { Collection, Product } from "@/lib/server/models";
import { generateProductTitle } from "@/lib/generateTitle";

export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Shape a raw product the same way queryProducts does (price normalised + live title).
const shape = (p) => ({ ...p, price: Number(p.price ?? p.listedPrice ?? 0) || 0, generatedTitle: generateProductTitle(p) });

/* Public: resolve a collection by slug to { collection, products }.
   - Only an ACTIVE collection is returned (null otherwise).
   - Only ACTIVE products are included, in the collection's saved order. */
export async function getCollectionBySlug(slug) {
  await dbConnect();
  const col = await Collection.findOne({ slug, active: true }).lean();
  if (!col) return null;

  const ids = (col.productIds || []).map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  const docs = ids.length ? await Product.find({ id: { $in: ids } }).lean() : [];
  const byId = new Map(docs.map((d) => [Number(d.id), d]));

  // Preserve saved order; drop unknown ids and out-of-stock-only? keep all that exist.
  const products = ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .filter((p) => p.status !== "Out of Stock" || (p.chassisStock ?? p.stock ?? 0) >= 0) // keep listed; cards show OOS state
    .map(shape);

  return {
    collection: { name: col.name, slug: col.slug, description: col.description || "" },
    products,
  };
}

/* Admin: resolve lightweight product summaries (id, name, image) in saved order,
   for pre-filling the product picker when editing a collection. */
export async function collectionProductSummaries(productIds = []) {
  await dbConnect();
  const ids = productIds.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  if (!ids.length) return [];
  const docs = await Product.find({ id: { $in: ids } }).select("id name image images").lean();
  const byId = new Map(docs.map((d) => [Number(d.id), d]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((p) => ({ id: String(p.id), name: p.name, image: p.image || (p.images && p.images[0]) || "" }));
}
