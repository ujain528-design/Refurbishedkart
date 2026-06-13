import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Collection } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { collectionProductSummaries } from "@/lib/server/collections";

export const dynamic = "force-dynamic";

// GET one — includes resolved product summaries (id/name/image) for the picker.
export async function GET(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const c = await Collection.findById(params.id).lean();
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const products = await collectionProductSummaries(c.productIds || []);
    return NextResponse.json({
      collection: { id: String(c._id), name: c.name, slug: c.slug, description: c.description || "", active: c.active !== false, productIds: c.productIds || [], products },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — update name/description/active/productIds. The slug stays STABLE after
// creation so existing banner links / shared URLs never break on rename.
export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const b = await req.json();
    const patch = {};
    if (b.name !== undefined) patch.name = String(b.name).trim();
    if (b.description !== undefined) patch.description = b.description || "";
    if (b.active !== undefined) patch.active = !!b.active;
    if (b.productIds !== undefined) patch.productIds = Array.isArray(b.productIds) ? b.productIds.map(String) : [];
    const c = await Collection.findByIdAndUpdate(params.id, { $set: patch }, { new: true });
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ collection: { id: String(c._id), ...c.toObject() } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    await Collection.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
