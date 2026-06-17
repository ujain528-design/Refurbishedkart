// Pure pricing math — NO imports, so it can be unit-tested directly and reused
// on both server and client. pricingConfig = { ram: { DDR4: {8:800,...}, ... },
// ssd: { "256GB":1000, ... } }.

export const ramGB = (s) => parseInt(String(s ?? ""), 10) || 0;

/* Price of a RAM module of `capacityGB` and `ramType`. Falls back to the DDR4
   table when the exact type isn't priced. Used for the EXTRA capacity on an
   upgrade (charge only the difference). */
export function getPriceForCapacity(capacityGB, ramType, cfg) {
  const ram = cfg?.ram || {};
  const table = ram[ramType] || ram.DDR4 || {};
  return Number(table[capacityGB]) || 0;
}

/* Price of the EXTRA RAM capacity added on an upgrade. If the extra capacity is a
   standard stick it's a direct lookup; otherwise it's decomposed greedily into
   the largest available sticks (e.g. 24GB → 16GB + 8GB) and the prices summed.
   Stick configuration is never surfaced to buyers — this is cost math only. */
export function priceForExtraCapacity(extraGB, ramType, cfg) {
  if (!(extraGB > 0)) return 0;
  const table = (cfg?.ram && (cfg.ram[ramType] || cfg.ram.DDR4)) || {};
  // exact standard stick
  if (Number(table[extraGB]) > 0) return Number(table[extraGB]);
  const sizes = Object.keys(table).map(Number).filter((s) => Number(table[s]) > 0).sort((a, b) => b - a);
  if (!sizes.length) return 0;
  let remaining = extraGB, total = 0, guard = 0;
  while (remaining > 0 && guard++ < 16) {
    const stick = sizes.find((s) => s <= remaining) ?? sizes[sizes.length - 1]; // smallest if none fit
    total += Number(table[stick]);
    remaining -= stick;
  }
  return total;
}

/* Full price of an SSD capacity from the global table. */
export function getSsdPrice(capacity, cfg) {
  return Number(cfg?.ssd?.[capacity]) || 0;
}

/* Back-calculated and stored on save. */
export function calculateDeviceCost(listedPrice, defaultRamCost, defaultSsdCost) {
  return Math.max(0, Number(listedPrice || 0) - Number(defaultRamCost || 0) - Number(defaultSsdCost || 0));
}

/* Listed Price ± the variant DELTA.
   listedPrice is the all-inclusive price of the DEFAULT RAM + SSD. Selecting a
   different RAM or SSD therefore only ever adds the DIFFERENCE between the chosen
   component's price and the default's price — positive for an upgrade, negative
   for a downgrade. The default component cost is never added a second time
   (that was the inflation bug: SSD used to add its full price on top). */
export function calculateUpgradePrice(product, ramCapacity, ssdCapacity, cfg) {
  let price = Number(product.listedPrice ?? product.price ?? 0);
  const dRam = product.defaultRam || {};
  const dSsd = product.defaultSsd || {};

  if (ramCapacity && dRam.capacity && String(ramCapacity) !== String(dRam.capacity)) {
    const selRam = getPriceForCapacity(ramGB(ramCapacity), dRam.type, cfg);
    // Default RAM value to subtract. A stored onboard cost of 0 is treated as
    // "unset" → fall back to the pricing table, otherwise the full selected RAM
    // price would be charged instead of the delta. A non-zero onboard cost is
    // authoritative; non-onboard always uses the table.
    const defRam = (dRam.isOnboard && Number(dRam.cost || 0) > 0)
      ? Number(dRam.cost)
      : getPriceForCapacity(ramGB(dRam.capacity), dRam.type, cfg);
    price += selRam - defRam; // delta (can be negative for a downgrade)
  }
  if (ssdCapacity && dSsd.capacity && String(ssdCapacity) !== String(dSsd.capacity)) {
    price += getSsdPrice(ssdCapacity, cfg) - getSsdPrice(dSsd.capacity, cfg); // delta
  }
  return Math.max(0, Math.round(price));
}

export const calculateSellableQty = (product) => product?.chassisStock ?? product?.stock ?? 0;

/* Recompute one product's defaultRam/Ssd costs, listedPrice (= deviceCost + new
   costs) and every config price against the current pricing config. deviceCost
   is fixed. Returns { listedPrice, defaultRamCost, defaultSsdCost, configs }. */
export function recomputeProductPricing(p, cfg) {
  if (!p.defaultRam || !p.defaultSsd) return null;
  // Onboard cost of 0 is treated as "unset" → use the pricing table (fixes stale
  // onboard RAM cost). A non-zero onboard cost stays authoritative.
  const ramCost = (p.defaultRam.isOnboard && Number(p.defaultRam.cost || 0) > 0)
    ? Number(p.defaultRam.cost)
    : getPriceForCapacity(ramGB(p.defaultRam.capacity), p.defaultRam.type, cfg);
  const ssdCost = getSsdPrice(p.defaultSsd.capacity, cfg);
  const listedPrice = Number(p.deviceCost || 0) + ramCost + ssdCost;
  const ref = { listedPrice, defaultRam: p.defaultRam, defaultSsd: p.defaultSsd };
  const configs = (p.configs || []).map((c) => {
    const ramCap = String(c.ram || "").split(" ")[0];
    const isDefault = ramCap === p.defaultRam.capacity && c.ssd === p.defaultSsd.capacity;
    const price = isDefault ? listedPrice : calculateUpgradePrice(ref, ramCap, c.ssd, cfg);
    return { ...c, isDefault, price };
  });
  return { listedPrice, defaultRamCost: ramCost, defaultSsdCost: ssdCost, configs };
}
