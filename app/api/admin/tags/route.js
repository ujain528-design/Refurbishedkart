import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Tag } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

const slugify = (s) => String(s || "").toLowerCase().trim().replace(/\s+/g, "-");

export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const docs = await Tag.find({}).sort({ type: 1, name: 1 }).lean();
    return NextResponse.json({ tags: docs.map((t) => ({ id: String(t._id), ...t })) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const d = await req.json();
    const t = await Tag.create({ name: d.name, slug: d.slug || slugify(d.name), type: d.type || "custom", visible: d.visible !== false });
    return NextResponse.json({ tag: { id: String(t._id), ...t.toObject() } }, { status: 201 });
  } catch (e) {
    const msg = e.code === 11000 ? "Tag already exists" : e.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
