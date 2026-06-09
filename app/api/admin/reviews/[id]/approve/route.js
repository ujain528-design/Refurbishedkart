import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Review } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const r = await Review.findByIdAndUpdate(params.id, { $set: { status: "approved" } }, { new: true }).lean();
    if (!r) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    return NextResponse.json({ review: { id: String(r._id), ...r } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
