import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Review } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const status = req.nextUrl.searchParams.get("status");
    const filter = status && status !== "all" ? { status } : {};
    const docs = await Review.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ reviews: docs.map((r) => ({ id: String(r._id), ...r })) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
