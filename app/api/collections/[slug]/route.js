import { NextResponse } from "next/server";
import { getCollectionBySlug } from "@/lib/server/collections";

export const dynamic = "force-dynamic";

/* Public: a collection + its curated products (active only, in saved order). */
export async function GET(_req, { params }) {
  try {
    const data = await getCollectionBySlug(params.slug);
    if (!data) return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
