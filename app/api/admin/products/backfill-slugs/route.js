import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { requireAdmin } from "@/lib/server/adminAuth";
import { backfillSlugs } from "@/lib/server/slug";

export const dynamic = "force-dynamic";

/* One-time (idempotent) backfill: assign a unique SEO slug to every product that
   doesn't have one yet. Existing slugs are left untouched (stable URLs). */
export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const result = await backfillSlugs();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
