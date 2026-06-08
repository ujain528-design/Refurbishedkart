import { NextResponse } from "next/server";
import { getProduct } from "@/lib/server/products";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  try {
    const product = await getProduct(params.id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
