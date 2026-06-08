import { NextResponse } from "next/server";
import { queryProducts } from "@/lib/server/products";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const q = req.nextUrl.searchParams.get("q") || "";
  try {
    const products = q ? await queryProducts({ q }) : [];
    return NextResponse.json({ products, count: products.length });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
