import { NextResponse } from "next/server";
import { queryProducts } from "@/lib/server/products";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const sp = req.nextUrl.searchParams;
  const params = Object.fromEntries(sp.entries());
  try {
    const products = await queryProducts(params);
    return NextResponse.json({ products, count: products.length });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
