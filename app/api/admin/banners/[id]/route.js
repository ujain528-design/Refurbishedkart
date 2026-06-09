import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Banner } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const d = await req.json();
    delete d._id; delete d.id;
    const b = await Banner.findByIdAndUpdate(params.id, { $set: d }, { new: true }).lean();
    if (!b) return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    return NextResponse.json({ banner: { id: String(b._id), ...b } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    await Banner.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
