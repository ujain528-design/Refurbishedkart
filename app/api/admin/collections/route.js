import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Collection } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { slugify } from "@/lib/server/collections";

export const dynamic = "force-dynamic";

// Generate a slug unique across collections (base, base-2, base-3, …).
async function uniqueSlug(base) {
  const root = base || "collection";
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Collection.findOne({ slug }).select("_id").lean();
    if (!existing) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const docs = await Collection.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      collections: docs.map((c) => ({
        id: String(c._id),
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        active: c.active !== false,
        productCount: (c.productIds || []).length,
        createdAt: c.createdAt,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { name, description, active, productIds } = await req.json();
    if (!name || !String(name).trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const slug = await uniqueSlug(slugify(name));
    const doc = await Collection.create({
      name: String(name).trim(),
      slug,
      description: description || "",
      active: active !== false,
      productIds: Array.isArray(productIds) ? productIds.map(String) : [],
    });
    return NextResponse.json({ collection: { id: String(doc._id), ...doc.toObject() } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
