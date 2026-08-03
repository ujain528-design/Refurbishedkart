import { NextResponse } from "next/server";
import { queryProducts } from "@/lib/server/products";

export const dynamic = "force-dynamic";

/* Distinct brands that actually have at least one product in the catalogue.
   Empty/blank brands are dropped; result is sorted alphabetically. */
export async function GET() {
  try {
    const rows = await queryProducts({});
    const brands = [...new Set(rows.map((p) => String(p.brand || "").trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ brands });
  } catch (e) {
    return NextResponse.json({ brands: [], error: e.message }, { status: 500 });
  }
}
