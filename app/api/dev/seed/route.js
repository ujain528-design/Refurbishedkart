import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Product, Coupon, MasterData, PricingConfig, Review, Banner, Tag } from "@/lib/server/models";
import { ALL_PRODUCTS } from "@/lib/data";
import { RAM_PRICE_MATRIX, SSD_PRICE_TABLE, ADMIN_REVIEWS, ADMIN_BANNERS, ADMIN_TAGS } from "@/lib/admin-data";

const slugify = (s) => String(s || "").toLowerCase().trim().replace(/\s+/g, "-");
import { synonymRows } from "@/lib/search-synonyms";
import { calculateDeviceCost, calculateUpgradePrice, getPriceForCapacity, getSsdPrice, priceForExtraCapacity } from "@/lib/server/pricing-core";

const RAM_LADDER = [4, 8, 16, 32, 64];
const SSD_LADDER = ["256GB", "512GB", "1TB", "2TB"];

export const dynamic = "force-dynamic";

// Global price tables → pricing config shape used by the engine.
const RAM_TABLE = RAM_PRICE_MATRIX?.prices || {
  DDR3: { 4: 400, 8: 500, 16: 1400, 32: 3200 },
  DDR4: { 4: 600, 8: 800, 16: 2200, 32: 4800 },
  "DDR4 ECC": { 16: 2600, 32: 5400, 64: 11000 },
  DDR5: { 8: 1100, 16: 2900, 32: 6200 },
  LPDDR4X: { 8: 1000, 16: 2600, 32: 5600 },
};
const SSD_TABLE = (SSD_PRICE_TABLE || [
  { cap: "256GB", price: 1000 }, { cap: "512GB", price: 2200 }, { cap: "1TB", price: 3800 }, { cap: "2TB", price: 6900 },
]).reduce((o, r) => ((o[r.cap] = r.price), o), {});
const PRICE_CFG = { ram: RAM_TABLE, ssd: SSD_TABLE };

const THINKPAD_IMAGES = [
  "/products/thinkpad-a.avif",
  "/products/thinkpad-b.avif",
  "/products/thinkpad-c.avif",
  "/products/thinkpad-d.avif",
  "/products/thinkpad-e.avif",
];

/* Dev-only seeder. Loads the catalogue into MongoDB (upsert by id, idempotent),
   assigns real ThinkPad images to ThinkPad products that lack them, seeds the
   SAVE10 coupon, and seeds search synonyms into MasterData (search_synonyms). */
export async function POST() {
  try {
    await dbConnect();

    let ti = 0;
    const ops = ALL_PRODUCTS.map((p) => {
      const doc = { ...p };
      if (!doc.image && /thinkpad/i.test(doc.name)) {
        const img = THINKPAD_IMAGES[ti % THINKPAD_IMAGES.length];
        ti++;
        doc.image = img;
        if (!doc.images || !doc.images.length) doc.images = [img];
      }
      // New pricing model: chassisStock=5; back-calc deviceCost; default config.
      doc.chassisStock = 5;
      doc.stock = 5; // mirror for legacy card reads
      const a = doc.attrs || {};
      if (a.ram && a.ssd) {
        const type = a.ramType || "DDR4";
        const isOnboard = /LPDDR/i.test(type) || !!doc.onboardRam; // soldered RAM = onboard
        const ramCost = isOnboard ? 0 : getPriceForCapacity(a.ram, type, PRICE_CFG);
        const ssdCost = getSsdPrice(a.ssd, PRICE_CFG);
        const listedPrice = doc.price;
        doc.listedPrice = listedPrice;
        doc.deviceCost = calculateDeviceCost(listedPrice, ramCost, ssdCost);
        doc.defaultRam = { capacity: `${a.ram}GB`, type, isOnboard, cost: ramCost };
        doc.defaultSsd = { capacity: a.ssd, cost: ssdCost };

        // Default config + a couple of upgrade configs whose prices are CALCULATED
        // by the engine (never hardcoded), so they track the global price tables.
        const synthetic = { listedPrice, defaultRam: doc.defaultRam, defaultSsd: doc.defaultSsd };
        const configs = [{ ram: `${a.ram}GB ${type}`, ssd: a.ssd, isDefault: true, price: listedPrice, available: true, show: true }];
        // next RAM tier up that has a known extra-capacity price
        const nextRam = RAM_LADDER.find((c) => c > a.ram && priceForExtraCapacity(c - a.ram, type, PRICE_CFG) > 0);
        if (nextRam) {
          configs.push({ ram: `${nextRam}GB ${type}`, ssd: a.ssd, isDefault: false, override: false, price: calculateUpgradePrice(synthetic, `${nextRam}GB`, a.ssd, PRICE_CFG), available: true, show: true });
        }
        // next SSD tier up that has a price
        const ssdIdx = SSD_LADDER.indexOf(a.ssd);
        const nextSsd = ssdIdx >= 0 ? SSD_LADDER[ssdIdx + 1] : null;
        if (nextSsd && getSsdPrice(nextSsd, PRICE_CFG) > 0) {
          configs.push({ ram: `${a.ram}GB ${type}`, ssd: nextSsd, isDefault: false, override: false, price: calculateUpgradePrice(synthetic, `${a.ram}GB`, nextSsd, PRICE_CFG), available: true, show: true });
        }
        // combined upgrade (RAM + SSD both up) — calculated, never hardcoded
        if (nextRam && nextSsd && getSsdPrice(nextSsd, PRICE_CFG) > 0) {
          configs.push({ ram: `${nextRam}GB ${type}`, ssd: nextSsd, isDefault: false, override: false, price: calculateUpgradePrice(synthetic, `${nextRam}GB`, nextSsd, PRICE_CFG), available: true, show: true });
        }
        doc.configs = configs;
      } else {
        doc.listedPrice = doc.price;
        doc.deviceCost = doc.price;
      }
      return { updateOne: { filter: { id: doc.id }, update: { $set: doc }, upsert: true } };
    });
    const res = await Product.bulkWrite(ops);

    await Coupon.updateOne(
      { code: "SAVE10" },
      { $set: { code: "SAVE10", type: "percent", value: 10, minSubtotal: 0, active: true } },
      { upsert: true }
    );

    await MasterData.updateOne(
      { tableName: "search_synonyms" },
      { $set: { tableName: "search_synonyms", rows: synonymRows() } },
      { upsert: true }
    );

    // Global pricing tables (used by the pricing engine for upgrade costs).
    await PricingConfig.findByIdAndUpdate(
      "pricing",
      { $set: { ram: RAM_TABLE, ssd: SSD_TABLE } },
      { upsert: true }
    );

    // Reviews / Banners / Tags — seed only when empty so re-seeding never wipes admin edits.
    let reviewsSeeded = 0, bannersSeeded = 0, tagsSeeded = 0;
    if ((await Review.countDocuments()) === 0) {
      const r = await Review.insertMany(ADMIN_REVIEWS.map((x) => {
        const prod = ALL_PRODUCTS.find((p) => p.name.includes(x.product)); // resolve id from name
        return { productId: prod?.id ?? null, productName: x.product, reviewer: x.reviewer, rating: x.rating, text: x.text, status: x.status || "pending", featured: !!x.featured };
      }));
      reviewsSeeded = r.length;
    }
    if ((await Banner.countDocuments()) === 0) {
      const b = await Banner.insertMany(ADMIN_BANNERS.map((x) => ({ headline: x.headline, active: x.status === "active", clickable: x.clickable !== false, order: x.order ?? 0 })));
      bannersSeeded = b.length;
    }
    if ((await Tag.countDocuments()) === 0) {
      const t = await Tag.insertMany(ADMIN_TAGS.map((x) => ({ name: x.name, slug: slugify(x.name), type: x.type || "custom", visible: x.visible !== false })));
      tagsSeeded = t.length;
    }

    const count = await Product.countDocuments();
    return NextResponse.json({
      ok: true,
      seeded: ALL_PRODUCTS.length,
      thinkpadImagesAssigned: ti,
      upserted: res.upsertedCount,
      modified: res.modifiedCount,
      productsInDb: count,
      coupons: ["SAVE10"],
      synonyms: synonymRows().length,
      reviewsSeeded, bannersSeeded, tagsSeeded,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const GET = POST;
