import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Tag } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const d = await req.json();
    delete d._id; delete d.id;
    const t = await Tag.findByIdAndUpdate(params.id, { $set: d }, { new: true }).lean();
    if (!t) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    return NextResponse.json({ tag: { id: String(t._id), ...t } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
