import { NextResponse } from "next/server";
import { queryProducts } from "@/lib/server/products";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const sp = req.nextUrl.searchParams;
  const params = Object.fromEntries(sp.entries());
  try {
    const products = await queryProducts(params);
    // The storefront listing paginates client-side (fetch-all + slice), so the full
    // matching set is returned in one response. `total` is included for the requested
    // { products, total, page, limit } shape; page/limit reflect "all in one page".
    const total = products.length;
    return NextResponse.json({ products, total, count: total, page: 1, limit: total });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
