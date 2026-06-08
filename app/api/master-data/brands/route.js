import { NextResponse } from "next/server";
import { queryProducts } from "@/lib/server/products";

export const dynamic = "force-dynamic";

/* Distinct brands from the real products collection. Optional ?category= scopes
   the brands to one category (used by the navbar mega dropdown). */
export async function GET(req) {
  const category = req.nextUrl.searchParams.get("category") || undefined;
  try {
    const rows = await queryProducts(category ? { category } : {});
    const brands = [...new Set(rows.map((p) => p.brand))].sort();
    return NextResponse.json({ brands });
  } catch (e) {
    return NextResponse.json({ error: e.message, brands: [] }, { status: 500 });
  }
}
