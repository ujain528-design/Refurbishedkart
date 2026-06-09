import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Banner } from "@/lib/server/models";

export const dynamic = "force-dynamic";

/* Public: only ACTIVE banners, ordered by `order` ascending, from the DB. */
export async function GET() {
  try {
    await dbConnect();
    const banners = await Banner.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ banners: banners.map((b) => ({ id: String(b._id), ...b })) });
  } catch (e) {
    return NextResponse.json({ banners: [], error: e.message }, { status: 500 });
  }
}
