// DB orchestration over the pure pricing core. Re-exports the pure functions so
// callers import everything from one place.
import { dbConnect } from "@/lib/server/mongoose";
import { Product, PricingConfig } from "@/lib/server/models";
import * as core from "@/lib/server/pricing-core";

export const {
  ramGB, getPriceForCapacity, getSsdPrice,
  calculateDeviceCost, calculateUpgradePrice, calculateSellableQty, recomputeProductPricing,
} = core;

export async function getPricingConfig() {
  await dbConnect();
  const doc = await PricingConfig.findById("pricing").lean();
  return doc || { ram: {}, ssd: {} };
}

/* Recompute every listing's listedPrice (= deviceCost + new component costs) and
   all config prices against the current pricing config. Returns the count of
   listings whose price actually changed. */
export async function recalculateListingsOnPriceChange() {
  await dbConnect();
  const cfg = await getPricingConfig();
  const all = await Product.find({}).lean();
  let updated = 0;
  for (const p of all) {
    const r = core.recomputeProductPricing(p, cfg);
    if (!r) continue;
    const changed = r.listedPrice !== p.listedPrice || JSON.stringify(r.configs) !== JSON.stringify(p.configs || []);
    if (changed) {
      await Product.updateOne(
        { id: p.id },
        { $set: { listedPrice: r.listedPrice, price: r.listedPrice, "defaultRam.cost": r.defaultRamCost, "defaultSsd.cost": r.defaultSsdCost, configs: r.configs } }
      );
      updated++;
    }
  }
  return updated;
}
