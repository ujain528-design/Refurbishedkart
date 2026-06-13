// DB-aware slug uniqueness. productSlugBase() gives the deterministic base; this
// guarantees global uniqueness by appending a short suffix (the numeric id, then
// a counter) when another product already owns the base slug.
import { Product } from "@/lib/server/models";
import { productSlugBase } from "@/lib/productSlug";

// True if `slug` is already used by a DIFFERENT product than `selfId`.
async function takenByOther(slug, selfId) {
  const hit = await Product.findOne({ slug }).select("id").lean();
  return !!hit && Number(hit.id) !== Number(selfId);
}

/* Resolve a unique slug for `product` (which must already have its `id`). */
export async function assignUniqueSlug(product) {
  const base = productSlugBase(product);
  if (!(await takenByOther(base, product.id))) return base;
  const withId = `${base}-${product.id}`;
  if (!(await takenByOther(withId, product.id))) return withId;
  let n = 2;
  while (await takenByOther(`${withId}-${n}`, product.id)) n++;
  return `${withId}-${n}`;
}

/* Backfill slugs for every product missing one. Existing slugs are kept stable.
   Collision-safe across the whole set + against already-assigned slugs. */
export async function backfillSlugs() {
  const all = await Product.find({}).lean();
  const taken = new Set(all.filter((p) => p.slug).map((p) => p.slug));
  let updated = 0;
  for (const p of all) {
    if (p.slug) continue;
    const base = productSlugBase(p);
    let slug = base;
    if (taken.has(slug)) slug = `${base}-${p.id}`;
    let n = 2;
    while (taken.has(slug)) { slug = `${base}-${p.id}-${n}`; n++; }
    taken.add(slug);
    await Product.updateOne({ id: p.id }, { $set: { slug } });
    updated++;
  }
  return { updated, total: all.length };
}
