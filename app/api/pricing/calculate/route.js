import { NextResponse } from "next/server";
import { calcPrice } from "@/lib/server/products";

export const dynamic = "force-dynamic";

/* PRD §5.3 — server computes the price; the client display price is never trusted. */
export async function POST(req) {
  try {
    const { productId, ram, ssd } = await req.json();
    const q = await calcPrice(productId, ram, ssd);
    if (q.error) return NextResponse.json({ error: q.error }, { status: q.status });
    return NextResponse.json({ productId: q.product.id, ram: q.ram, ssd: q.ssd, unitPrice: q.unitPrice, sellable: q.sellable });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
