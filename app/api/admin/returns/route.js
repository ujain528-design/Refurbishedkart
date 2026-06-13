import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Return } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

// GET — all returns, optional ?status= filter, newest first.
export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const status = new URL(req.url).searchParams.get("status");
    const q = status && status !== "All" ? { status } : {};
    const docs = await Return.find(q).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ returns: docs.map((r) => ({ id: r.returnId, ...r })) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
