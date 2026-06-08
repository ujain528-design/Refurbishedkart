import { NextResponse } from "next/server";
import { queryProducts } from "@/lib/server/products";

export const dynamic = "force-dynamic";

const uniq = (arr) => [...new Set(arr.filter((v) => v != null && v !== ""))];

/* Returns the filter values that actually exist in the DB for a category, so the
   listing sidebar only offers options that return results. */
export async function GET(_req, { params }) {
  try {
    const rows = await queryProducts({ category: params.category });
    const a = (key) => uniq(rows.map((p) => p.attrs?.[key]));
    const prices = rows.map((p) => p.price).filter((n) => typeof n === "number");

    return NextResponse.json({
      count: rows.length,
      brands: uniq(rows.map((p) => p.brand)).sort(),
      processors: a("processor").sort(),
      ram: uniq(rows.map((p) => p.attrs?.ram)).sort((x, y) => x - y),
      ramType: a("ramType").sort(),
      ssd: a("ssd").sort(),
      screen: a("screen").sort(),
      gpu: a("gpu").sort(),
      os: a("os").sort(),
      warranty: a("warranty").sort(),
      formFactor: a("formFactor").sort(),
      touchscreen: uniq(rows.map((p) => p.attrs?.touchscreen)),
      priceMin: prices.length ? Math.min(...prices) : 0,
      priceMax: prices.length ? Math.max(...prices) : 0,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
