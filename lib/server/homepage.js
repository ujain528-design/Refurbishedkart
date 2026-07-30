import { dbConnect } from "@/lib/server/mongoose";
import { HomepageSection } from "@/lib/server/models";

// Default sections seeded on first read — mirror the homepage's original hardcoded
// product rows so the page looks identical after switching to the DB zone. Tags
// match the catalogue tags (lowercase-hyphenated) used by the old rows.
const DEFAULTS = [
  { type: "product_row", title: "Bestsellers", tag: "bestseller", maxProducts: 8, order: 0, active: true },
  { type: "product_row", title: "Best for Students", tag: "student", maxProducts: 8, order: 1, active: true },
  { type: "product_row", title: "New Arrivals", tag: "new-arrival", maxProducts: 8, order: 2, active: true },
  { type: "product_row", title: "Best for WFH", tag: "best-for-wfh", maxProducts: 8, order: 3, active: true },
];

const toClient = (r) => ({ id: String(r._id), ...r, _id: undefined });

/* Sections sorted by order. Seeds the defaults the first time (empty collection).
   activeOnly=true for the public homepage; false for the admin builder. */
export async function getHomepageSections({ activeOnly = false } = {}) {
  await dbConnect();
  const count = await HomepageSection.countDocuments();
  if (count === 0) await HomepageSection.insertMany(DEFAULTS);
  const filter = activeOnly ? { active: true } : {};
  const rows = await HomepageSection.find(filter).sort({ order: 1, createdAt: 1 }).lean();
  return rows.map(toClient);
}

// Fields an admin may set (whitelist — never trust arbitrary keys from the client).
const FIELDS = [
  "type", "title", "order", "active", "tag", "category", "maxProducts",
  "imageUrl", "heading", "subheading", "ctaText", "ctaLink", "bgColor",
  "categories", "text", "textColor",
];

function sanitize(s, i) {
  const out = {};
  for (const k of FIELDS) if (s[k] !== undefined) out[k] = s[k];
  out.order = i; // order is authoritative from array position on publish
  if (!out.type) out.type = "product_row";
  return out;
}

/* Atomic "publish": replace the whole section set with the admin's working copy.
   Upserts by id, deletes any section not in the payload, and stamps order by
   array index — so create / edit / delete / reorder all land in one save. */
export async function publishHomepageSections(sections = []) {
  await dbConnect();
  const arr = Array.isArray(sections) ? sections : [];
  const keptIds = [];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const data = sanitize(arr[i], i);
    const id = arr[i].id;
    let doc;
    if (id && /^[a-f\d]{24}$/i.test(String(id))) {
      doc = await HomepageSection.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    }
    if (!doc) doc = (await HomepageSection.create(data)).toObject();
    keptIds.push(doc._id);
    out.push(toClient(doc));
  }
  await HomepageSection.deleteMany({ _id: { $nin: keptIds } });
  return out;
}
