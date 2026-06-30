/* eslint-disable no-console -- CLI migration script; console is the intended output. */
/* One-time backfill: recompute `paidAmount` on every existing Return record using
   the per-line refund basis (coupon discount allocated proportionally across the
   order's lines; shipping excluded; COD-not-yet-delivered capped at the line's
   share of codUpfront). Earlier returns stored a raw `unitPrice × qty` line total
   that ignored coupons — this corrects the stored data so reports/exports/emails
   that read paidAmount directly are right too (the live admin panel was already
   reading the correct value).

   RUN MANUALLY — never as part of build/deploy:
     node scripts/backfill-return-amounts.mjs            # apply
     node scripts/backfill-return-amounts.mjs --dry-run  # preview only, no writes

   The logic below MIRRORS lib/server/refunds.js (lineRefundBasis + findReturnLine).
   Keep them in sync if that helper changes. Inlined because the project is CommonJS
   (.js = CJS) and the helper uses ESM `export`, so it can't be imported into a .mjs
   script directly. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

// ── Load MONGODB_URI from .env.local if not already in the environment ──
function loadEnvLocal() {
  if (process.env.MONGODB_URI) return;
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}

// ── Refund-basis logic (mirror of lib/server/refunds.js) ──
function lineRefundBasis(order, line) {
  const lineTotal = (Number(line?.unitPrice) || 0) * (Number(line?.qty) || 1);
  const orderSubtotal =
    Number(order?.subtotal) ||
    (order?.lines || []).reduce((a, l) => a + (Number(l.unitPrice) || 0) * (Number(l.qty) || 1), 0);
  const discount = Number(order?.discount) || 0;
  const lineShare = orderSubtotal > 0 ? (lineTotal / orderSubtotal) * discount : 0;
  const fullBasis = Math.max(0, Math.round(lineTotal - lineShare));

  const isCod = String(order?.paymentMethod || "").toUpperCase() === "COD";
  const delivered = order?.codStatus === "delivered" || order?.status === "Delivered";
  if (isCod && !delivered) {
    const codUpfront = Number(order?.codUpfront) || 0;
    const lineShareOfUpfront = orderSubtotal > 0 ? Math.round((lineTotal / orderSubtotal) * codUpfront) : codUpfront;
    return Math.max(0, Math.min(fullBasis, lineShareOfUpfront));
  }
  return fullBasis;
}

function findReturnLine(order, ret) {
  const lines = order?.lines || [];
  return (
    (ret?.productId != null && lines.find((l) => String(l.productId) === String(ret.productId))) ||
    (ret?.productName && lines.find((l) => l.name === ret.productName)) ||
    lines[0] ||
    null
  );
}

const INR = (n) => "Rs." + Number(n || 0).toLocaleString("en-IN");

async function main() {
  loadEnvLocal();
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set (checked env + .env.local). Aborting.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const Returns = db.collection("returns");
  const Orders = db.collection("orders");

  const returns = await Returns.find({}).toArray();
  console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Found ${returns.length} return record(s).`);

  // Cache orders by orderId to avoid refetching for multiple returns on one order.
  const orderCache = new Map();
  const getOrder = async (orderId) => {
    if (!orderId) return null;
    if (orderCache.has(orderId)) return orderCache.get(orderId);
    const o = await Orders.findOne({ orderId });
    orderCache.set(orderId, o);
    return o;
  };

  let updated = 0, unchanged = 0, skipped = 0;
  for (const ret of returns) {
    const order = await getOrder(ret.orderId);
    if (!order) {
      console.log(`Return ${ret.returnId}: SKIPPED (order ${ret.orderId} not found)`);
      skipped += 1;
      continue;
    }
    const line = findReturnLine(order, ret);
    if (!line) {
      console.log(`Return ${ret.returnId}: SKIPPED (no matching order line)`);
      skipped += 1;
      continue;
    }
    const oldPaid = Number(ret.paidAmount) || 0;
    const newPaid = lineRefundBasis(order, line);
    if (oldPaid === newPaid) {
      unchanged += 1;
      continue;
    }
    console.log(`Return ${ret.returnId}: ${INR(oldPaid)} → ${INR(newPaid)}`);
    if (!DRY_RUN) {
      await Returns.updateOne({ _id: ret._id }, { $set: { paidAmount: newPaid } });
    }
    updated += 1;
  }

  console.log(
    `\n${DRY_RUN ? "[DRY RUN] would update" : "Updated"} ${updated}, unchanged ${unchanged}, skipped ${skipped}.`
  );
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("Backfill failed:", e.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
