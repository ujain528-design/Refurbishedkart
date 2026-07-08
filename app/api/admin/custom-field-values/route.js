import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { CustomFieldValue } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

// GET — custom values for a field, optionally scoped to a family.
//   ?field=processor&family=Intel Xeon  → values under that family
//   ?field=gpu                          → all values for the field (any family)
//   (no field)                          → every custom value (master-data admin view)
export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const url = new URL(req.url);
    const field = url.searchParams.get("field");
    const family = url.searchParams.get("family");
    const q = {};
    if (field) q.field = field;
    if (family != null) q.family = family;
    const docs = await CustomFieldValue.find(q).sort({ field: 1, family: 1, value: 1 }).lean();
    return NextResponse.json({ values: docs.map((d) => ({ id: String(d._id), field: d.field, family: d.family || "", value: d.value, category: d.category || [] })) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — add a custom value. Case-insensitive dedupe within the same field+family.
export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const body = await req.json();
    const field = String(body.field || "").trim();
    const family = String(body.family || "").trim();
    const value = String(body.value || "").trim();
    const category = Array.isArray(body.category) ? body.category.filter(Boolean).map(String) : [];
    if (!field) return NextResponse.json({ error: "field is required" }, { status: 400 });
    if (!value) return NextResponse.json({ error: "value is required" }, { status: 400 });

    // Case-insensitive duplicate check within the same field + family.
    const existing = await CustomFieldValue.findOne({
      field,
      family,
      value: { $regex: `^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    }).lean();
    if (existing) {
      return NextResponse.json({ value: { id: String(existing._id), field, family, value: existing.value, category: existing.category || [] }, duplicate: true });
    }

    const doc = await CustomFieldValue.create({ field, family, value, category });
    return NextResponse.json({ value: { id: String(doc._id), field, family, value, category } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
