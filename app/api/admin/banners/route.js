import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Banner } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const docs = await Banner.find({}).sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ banners: docs.map((b) => ({ id: String(b._id), ...b })) });
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
    const count = await Banner.countDocuments();
    const b = await Banner.create({ ...d, order: d.order ?? count + 1 });
    return NextResponse.json({ banner: { id: String(b._id), ...b.toObject() } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
