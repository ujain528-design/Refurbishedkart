import { NextResponse } from "next/server";
import { getProduct } from "@/lib/server/products";
import { calculateUpgradePrice, calculateSellableQty, getPricingConfig } from "@/lib/server/pricing";

export const dynamic = "force-dynamic";

/* PRD §5.3 — server computes the price. Body: { productId, ramCapacity, ssdCapacity }
   (legacy { ram, ssd } accepted). Returns { price, isDefault, breakdown, sellable }. */
export async function POST(req) {
  try {
    const body = await req.json();
    const productId = body.productId;
    const ramCapacity = body.ramCapacity ?? body.ram;
    const ssdCapacity = body.ssdCapacity ?? body.ssd;

    const product = await getProduct(productId);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const cfg = await getPricingConfig();
    const dRam = product.defaultRam || {};
    const dSsd = product.defaultSsd || {};
    const ramCap = ramCapacity || dRam.capacity;
    const ssdCap = ssdCapacity || dSsd.capacity;

    const isDefault =
      (!ramCap || String(ramCap) === String(dRam.capacity)) &&
      (!ssdCap || String(ssdCap) === String(dSsd.capacity));

    const price = calculateUpgradePrice(product, ramCap, ssdCap, cfg);

    // availability from the matching config (if one is defined)
    const cfgRow = (product.configs || []).find(
      (c) => String(c.ram || "").split(" ")[0] === String(ramCap) && c.ssd === ssdCap
    );
    const available = cfgRow ? cfgRow.available !== false : true;
    const sellable = available ? calculateSellableQty(product) : 0;

    return NextResponse.json({
      price,
      unitPrice: price, // alias for the existing PurchasePanel
      isDefault,
      sellable,
      ram: ramCap,
      ssd: ssdCap,
      breakdown: {
        listedPrice: Number(product.listedPrice ?? product.price ?? 0),
        deviceCost: Number(product.deviceCost ?? 0),
        upgrade: price - Number(product.listedPrice ?? product.price ?? 0),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
