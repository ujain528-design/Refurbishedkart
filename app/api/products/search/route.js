import { NextResponse } from "next/server";
import { queryProducts } from "@/lib/server/products";
import { matchSynonym } from "@/lib/search-synonyms";

export const dynamic = "force-dynamic";

/* Synonym mapping runs BEFORE fuzzy text search (case-insensitive). A matched
   term filters by mapped category + optional formFactor/brand; otherwise we fall
   back to fuzzy text search across name/brand/category/specs. */
export async function GET(req) {
  const q = req.nextUrl.searchParams.get("q") || "";
  try {
    if (!q.trim()) return NextResponse.json({ products: [], count: 0 });

    const syn = matchSynonym(q);
    if (syn) {
      let products = await queryProducts({ category: syn.category, brand: syn.brand });
      if (syn.formFactor) products = products.filter((p) => p.attrs?.formFactor === syn.formFactor);
      return NextResponse.json({
        products,
        count: products.length,
        matchedSynonym: q.trim().toLowerCase(),
        mappedTo: syn,
      });
    }

    const products = await queryProducts({ q });
    return NextResponse.json({ products, count: products.length });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
