// DB orchestration over the pure pricing core. Re-exports the pure functions so
// callers import everything from one place.
import { dbConnect } from "@/lib/server/mongoose";
import { Product, PricingConfig } from "@/lib/server/models";
import * as core from "@/lib/server/pricing-core";

export const {
  ramGB, getPriceForCapacity, getSsdPrice,
  calculateDeviceCost, calculateUpgradePrice, calculateSellableQty, recomputeProductPricing,
} = core;

// Default component price tables — the safety net when no PricingConfig doc has
// been set in the DB (the seed route that used to populate it was removed). The
// admin's Pricing Control page writes a doc that fully OVERRIDES these per table.
// Keyed: ram[type][extraGB], ssd[capacityLabel]. DDR4 8GB = ₹1,100 → 16GB extra
// = ₹2,200, which is what the editor's upgrade math expects.
export const PRICING_DEFAULTS = {
  ram: {
    DDR4: { 4: 600, 8: 1100, 16: 2200, 32: 4400, 64: 8800 },
    DDR5: { 8: 1600, 16: 3200, 32: 6400, 64: 12800 },
    LPDDR4X: { 8: 1100, 16: 2200, 32: 4400 },
    LPDDR3: { 8: 1100, 16: 2200 },
    "DDR4 ECC": { 8: 1400, 16: 2800, 32: 5600, 64: 11200 },
  },
  ssd: { "128GB": 800, "256GB": 1500, "512GB": 2800, "1TB": 5000, "2TB": 9000 },
};

export async function getPricingConfig() {
  await dbConnect();
  const doc = await PricingConfig.findById("pricing").lean();
  // Per-table fallback: a table set in the DB fully replaces the default for that
  // table; an empty/missing table falls back to PRICING_DEFAULTS so upgrade pricing
  // never silently collapses to the base price.
  const hasRam = doc?.ram && Object.keys(doc.ram).length > 0;
  const hasSsd = doc?.ssd && Object.keys(doc.ssd).length > 0;
  return {
    ...(doc || {}),
    ram: hasRam ? doc.ram : PRICING_DEFAULTS.ram,
    ssd: hasSsd ? doc.ssd : PRICING_DEFAULTS.ssd,
  };
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
