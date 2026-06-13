import { NextResponse } from "next/server";
import { getProduct } from "@/lib/server/products";
import { getStoreSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  try {
    const product = await getProduct(params.id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Resolve warranty/tax with the fallback chain: product → store default →
    // hardcoded. The PDP must never show an empty warranty, so we write the
    // resolved value into attrs.warranty (which PurchasePanel/TrustBadges read).
    const settings = await getStoreSettings();
    const warranty =
      product.warrantyPeriod || product.attrs?.warranty || settings.warrantyDefault || "6 months";
    const gstRate = Number(product.gstRate) > 0 ? Number(product.gstRate) : Number(settings.gstRate) || 18;
    const hsnCode = product.hsnCode || settings.hsnDefault || "8471";

    product.warranty = warranty;
    product.attrs = { ...(product.attrs || {}), warranty };
    product.resolvedGstRate = gstRate;
    product.resolvedHsnCode = hsnCode;

    return NextResponse.json({ product });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
