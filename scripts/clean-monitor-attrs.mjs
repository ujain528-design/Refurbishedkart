/* eslint-disable no-console -- CLI migration script; console is the intended output. */
/* One-time cleanup: null out stale laptop/desktop attributes that were saved onto
   Monitor products before the admin editor gated fields by category. Monitors have
   no RAM/SSD/processor/OS/battery, but older monitor documents carried those attrs
   (and default RAM/SSD + variant configs) from the editor's laptop defaults. The PDP
   already hides them at read time (lib/pdp.js), but this fixes the DATA at the source
   so any future export/filter/compare that reads attrs directly is correct too.

   RUN MANUALLY — never as part of build/deploy:
     node scripts/clean-monitor-attrs.mjs --dry-run   # preview only, no writes
     node scripts/clean-monitor-attrs.mjs             # apply

   Listed price, images, ports, warranty, condition, screen/resolution/panel/refresh
   and other monitor-relevant fields are left untouched. */
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

// attrs.* keys to null. Covers BOTH the task-named fields and the real keys the
// codebase actually reads (e.g. `gen` not `processorGeneration`, `ssd` not
// `storage`, `batteryHealth`/`batCap`/`batLife`, `backlit`), so the clean-up is
// effective regardless of which naming a given document used.
const ATTR_KEYS = [
  "ram", "ramType", "ramExpandability",
  "processor", "gen", "processorGeneration",
  "ssd", "storage", "storageType",
  "gpu", "os",
  "battery", "batteryHealth", "batCap", "batLife",
  "touchscreen", "backlitKeyboard", "backlit", "webcam",
];

// Does this monitor actually carry any stale field worth clearing?
function isDirty(p) {
  const a = p.attrs || {};
  const attrDirty = ATTR_KEYS.some((k) => a[k] !== undefined && a[k] !== null && a[k] !== "");
  const defaultsDirty = p.defaultRam != null || p.defaultSsd != null;
  const configsDirty = Array.isArray(p.configs) && p.configs.length > 0;
  return attrDirty || defaultsDirty || configsDirty;
}

async function main() {
  loadEnvLocal();
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set (checked env + .env.local). Aborting.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const Products = db.collection("products");

  // Case-insensitive match: "Monitors", "monitors", etc.
  const monitors = await Products.find({ category: { $regex: /^monitors$/i } }).toArray();
  console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Found ${monitors.length} monitor product(s).`);

  // $set every attrs.* key to null (dot notation) + clear defaults/configs.
  const setClause = { defaultRam: null, defaultSsd: null, configs: [] };
  for (const k of ATTR_KEYS) setClause[`attrs.${k}`] = null;

  let cleared = 0, alreadyClean = 0;
  for (const p of monitors) {
    const name = p.name || `${p.brand || ""} ${p.model || ""}`.trim() || `id ${p.id}`;
    if (!isDirty(p)) {
      alreadyClean += 1;
      continue;
    }
    console.log(`Monitor ${name}: cleared stale attrs`);
    if (!DRY_RUN) {
      await Products.updateOne({ _id: p._id }, { $set: setClause });
    }
    cleared += 1;
  }

  console.log(
    `\n${DRY_RUN ? "[DRY RUN] would clear" : "Cleared"} ${cleared} monitor(s); ${alreadyClean} already clean.`
  );
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("Monitor attr cleanup failed:", e.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
