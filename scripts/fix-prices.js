/* One-time data migration: guarantee every product has a usable numeric price.
 *
 * Run from the project root (with the dev server stopped OR running — concurrent
 * connections are fine):
 *
 *     node scripts/fix-prices.js
 *
 * What it does (idempotent — safe to run more than once):
 *   1. price > 0 already        → left untouched.
 *   2. price missing/0 but       → price = listedPrice  (safe mirror migration)
 *      listedPrice > 0
 *   3. BOTH missing/0           → price = listedPrice = 1 (₹1 placeholder so the
 *                                 card never shows "free") AND needsPricing = true
 *                                 so you can find + fix them in the admin editor.
 *                                 It does NOT invent a "real" price from the name —
 *                                 fabricated prices are worse than an obvious flag.
 *
 * It logs every product it changes and prints a summary, then disconnects.
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Load MONGODB_URI from .env.local without needing the dotenv package.
function loadEnvLocal() {
  if (process.env.MONGODB_URI) return;
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

async function main() {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("✖ MONGODB_URI not found (checked process.env and .env.local). Aborting — nothing changed.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  // Minimal loose model bound to the existing "products" collection.
  const Product =
    mongoose.models.Product ||
    mongoose.model("Product", new mongoose.Schema({ id: Number }, { strict: false, collection: "products" }));

  const all = await Product.find({}).lean();
  console.log(`Scanning ${all.length} products for missing/zero price...\n`);

  let mirrored = 0;
  let placeholder = 0;
  let ok = 0;

  for (const p of all) {
    const price = Number(p.price) || 0;
    const listed = Number(p.listedPrice) || 0;
    const label = p.name || p.model || "(unnamed)";

    if (price > 0) { ok++; continue; }

    if (listed > 0) {
      await Product.updateOne({ id: p.id }, { $set: { price: listed } });
      mirrored++;
      console.log(`  [mirror]      id=${p.id}  "${label}"  price 0 → ${listed}  (from listedPrice)`);
    } else {
      await Product.updateOne({ id: p.id }, { $set: { price: 1, listedPrice: 1, needsPricing: true } });
      placeholder++;
      console.log(`  [PLACEHOLDER] id=${p.id}  "${label}"  had NO price/listedPrice → set ₹1, needsPricing=true  ← FIX MANUALLY`);
    }
  }

  console.log(
    `\nDone.\n` +
    `  ${ok} already had a price (untouched)\n` +
    `  ${mirrored} mirrored from listedPrice\n` +
    `  ${placeholder} set to ₹1 placeholder (needsPricing=true — set a real price in the admin editor)\n`
  );
  if (placeholder > 0) {
    console.log(`Find the ones still needing a real price with: GET /api/admin/products/audit → zeroPriceProducts (now ₹1, flagged needsPricing).`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
