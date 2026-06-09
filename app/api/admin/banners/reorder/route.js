import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Banner } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

/* PUT body: { ids: [bannerId, ...] } in the desired order. Static "reorder"
   segment takes precedence over the [id] dynamic route. */
export async function PUT(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { ids = [] } = await req.json();
    await Promise.all(ids.map((id, i) => Banner.findByIdAndUpdate(id, { $set: { order: i + 1 } })));
    const docs = await Banner.find({}).sort({ order: 1 }).lean();
    return NextResponse.json({ banners: docs.map((b) => ({ id: String(b._id), ...b })) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
