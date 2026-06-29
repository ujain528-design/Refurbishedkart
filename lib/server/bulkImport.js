// Server-side bulk import with THREE-STATE validation:
//   VALID — in master / valid free text/number
//   NEW VALUE — typed override not in master (brand/RAM/SSD/OS/warranty/processor);
//               importable, and ADDED to its master table on import (RAM/SSD have
//               no price table to grow, so they import with component cost ₹0)
//   ERROR — missing required field, bad number, or invalid category; blocks the row
// Builds product docs reusing the pricing engine. The Excel "deviceCost" column
// is the FINAL listed price (inclusive of the default RAM + SSD); the bare
// chassis deviceCost is back-calculated (listed − RAM − SSD). Uses the SEO-title
// path too. The route re-validates on import, so the preview can't be bypassed.
import crypto from "crypto";
import { getColumns, CATEGORIES, CONDITIONS, isRequired, GROWABLE_TABLES } from "@/lib/bulkTemplates";
import { PORT_TYPES, normalizePorts } from "@/lib/ports";
import { getPricingConfig, getPriceForCapacity, getSsdPrice, ramGB } from "@/lib/server/pricing";
import { MasterData } from "@/lib/server/models";
import {
  MASTER_TABLES, OS_OPTIONS, SERVER_OS, WARRANTY_PERIODS, PROCESSOR_FAMILIES, PROCESSOR_MODELS,
} from "@/lib/admin-data";

export const CATEGORY_LIST = CATEGORIES;

const lc = (v) => String(v).trim().toLowerCase();
const blank = (v) => v == null || String(v).trim() === "";

async function masterValues(tableName) {
  try {
    const doc = await MasterData.findOne({ tableName }).lean();
    if (doc?.rows?.length) return doc.rows.filter((r) => r.active !== false).map((r) => r.value);
  } catch { /* fall through */ }
  return MASTER_TABLES[tableName] || [];
}

/* Resolve validation context once per request. Master sets union DB master data
   with the app constants so the editor's existing dropdown values are recognised. */
export async function loadValidationContext() {
  const cfg = await getPricingConfig();
  const [brands, osDb, warrDb, procDb, ramTypeDb, panelDb, ramExpDb, aspectDb, srvFfDb] = await Promise.all([
    masterValues("Brands"), masterValues("Operating System"), masterValues("Warranty Period"),
    masterValues("Processor Family"), masterValues("RAM Type"), masterValues("Panel Type"),
    masterValues("RAM Expandability"), masterValues("Aspect Ratio"), masterValues("Server Form Factor"),
  ]);

  const setOf = (...lists) => new Set(lists.flat().filter(Boolean).map(lc));
  const ramCaps = new Set();
  for (const type of Object.keys(cfg.ram || {})) {
    for (const gb of Object.keys(cfg.ram[type] || {})) {
      if (Number(cfg.ram[type][gb]) > 0) ramCaps.add(`${gb}gb`);
    }
  }
  // masterSets keyed by MasterData table name → drives kind "master" validation.
  const masterSets = {
    Brands: setOf(brands),
    "Operating System": setOf(osDb, OS_OPTIONS, SERVER_OS),
    "Warranty Period": setOf(warrDb, WARRANTY_PERIODS),
    "Processor Family": setOf(procDb, PROCESSOR_FAMILIES, Object.values(PROCESSOR_MODELS).flat()),
    "RAM Type": setOf(ramTypeDb),
    "Panel Type": setOf(panelDb),
    "RAM Expandability": setOf(ramExpDb),
    "Aspect Ratio": setOf(aspectDb),
    "Server Form Factor": setOf(srvFfDb),
  };
  return {
    cfg,
    masterSets,
    brandSet: masterSets.Brands, // kept for buildProductDoc / brand kind
    ramCaps,
    ssdCaps: new Set(Object.keys(cfg.ssd || {}).map(lc)),
  };
}

const setForTable = (ctx, table) => ctx.masterSets?.[table] || null;

/* Validate one record → { row, name, rowState, errors[], news[], cells[] }.
   cells carry a per-field state for the preview ("valid"|"new"|"error"). */
export function validateRow(category, rec, ctx) {
  const cols = getColumns(category);
  const errors = [], news = [], cells = [];
  const note = (key, state, reason) => cells.push({ key, state, reason: reason || "" });

  for (const col of cols) {
    const raw = rec[col.key];
    const req = isRequired(category, col.key);
    if (blank(raw)) {
      if (req) { errors.push(`${col.key} is required`); note(col.key, "error", "required"); }
      continue;
    }
    const v = String(raw).trim();
    switch (col.kind) {
      case "category":
        if (!CATEGORIES.includes(v)) { errors.push(`category '${v}' is not one of the 5 categories`); note(col.key, "error", `invalid category '${v}'`); }
        else note(col.key, "valid");
        break;
      case "brand":
        if (ctx.brandSet.has(lc(v))) note(col.key, "valid");
        else { news.push({ field: col.key, table: "Brands", value: v }); note(col.key, "new", `new brand '${v}'`); }
        break;
      case "model":
        note(col.key, "valid");
        break;
      case "numpos": {
        const n = Number(v);
        if (!Number.isFinite(n)) { errors.push(`${col.key} '${v}' is not a number`); note(col.key, "error", "not a number"); }
        else if (!(n > 0)) { errors.push(`${col.key} must be greater than 0`); note(col.key, "error", "must be > 0"); }
        else note(col.key, "valid");
        break;
      }
      case "num": {
        const n = Number(v);
        const portLabel = PORT_TYPES.includes(col.key) ? `port '${col.key}' qty` : col.key;
        if (!Number.isFinite(n)) { errors.push(`${portLabel} '${v}' is not a number`); note(col.key, "error", "not a number"); }
        else if (n < 0 || !Number.isInteger(n)) { errors.push(`${portLabel} must be a non-negative integer`); note(col.key, "error", "non-negative integer"); }
        else note(col.key, "valid");
        break;
      }
      case "condition":
        if (CONDITIONS.includes(v)) note(col.key, "valid");
        else { errors.push(`condition '${v}' must be one of ${CONDITIONS.join("/")}`); note(col.key, "error", `invalid condition`); }
        break;
      case "ram":
        if (ctx.ramCaps.has(lc(v))) note(col.key, "valid");
        else { news.push({ field: col.key, table: "__RAM__", value: v }); note(col.key, "new", `RAM '${v}' not priced — imports at ₹0 component cost`); }
        break;
      case "ssd":
        if (ctx.ssdCaps.has(lc(v))) note(col.key, "valid");
        else { news.push({ field: col.key, table: "__SSD__", value: v }); note(col.key, "new", `storage '${v}' not priced — imports at ₹0 component cost`); }
        break;
      case "master": {
        const set = setForTable(ctx, col.table);
        if (set && set.has(lc(v))) note(col.key, "valid");
        else { news.push({ field: col.key, table: col.table, value: v }); note(col.key, "new", `new ${col.key} '${v}'`); }
        break;
      }
      case "bool":
        if (/^(yes|no|true|false|1|0)$/i.test(v)) note(col.key, "valid");
        else { errors.push(`${col.key} '${v}' must be Yes or No`); note(col.key, "error", "must be Yes/No"); }
        break;
      default:
        note(col.key, "valid"); // free text
    }
  }

  // Cross-field: the DeviceCost column is the FINAL listed price, so it must
  // cover the default RAM + SSD component cost — otherwise the back-calculated
  // deviceCost (listed − RAM − SSD) would be negative. Block such rows. (Skipped
  // when deviceCost is blank/non-numeric — the per-column checks already flag that.)
  const ramKey = cols.find((col) => col.kind === "ram")?.key;
  const ssdKey = cols.find((col) => col.kind === "ssd")?.key;
  const ramCap = ramKey && !blank(rec[ramKey]) ? String(rec[ramKey]).trim() : "";
  const ssdCap = ssdKey && !blank(rec[ssdKey]) ? String(rec[ssdKey]).trim() : "";
  const ramCost = ramCap ? getPriceForCapacity(ramGB(ramCap), "DDR4", ctx.cfg) : 0;
  const ssdCost = ssdCap ? getSsdPrice(ssdCap, ctx.cfg) : 0;
  const componentCost = ramCost + ssdCost;
  if (!blank(rec.deviceCost)) {
    const enteredPrice = Number(String(rec.deviceCost).trim());
    if (Number.isFinite(enteredPrice) && enteredPrice < componentCost) {
      errors.push(
        `Listed price ₹${enteredPrice.toLocaleString("en-IN")} is less than the combined RAM + SSD cost (₹${componentCost.toLocaleString("en-IN")}). Please enter the correct selling price.`
      );
      const cell = cells.find((c) => c.key === "deviceCost");
      if (cell) { cell.state = "error"; cell.reason = "below RAM + SSD cost"; }
      else note("deviceCost", "error", "below RAM + SSD cost");
    }
  }

  const rowState = errors.length ? "error" : news.length ? "new" : "valid";
  const name = [rec.brand, rec.model].filter((x) => !blank(x)).join(" ").trim() || "—";
  return { row: rec.__row ?? null, name, rowState, errors, news, cells, error: errors[0] || "" };
}

export function validateRows(category, records, ctx) {
  return records.map((rec) => validateRow(category, rec, ctx));
}

const val = (rec, key) => { const v = rec[key]; return blank(v) ? "" : String(v).trim(); };

/* Build a product doc from a validated record. Ports built from the PORT_TYPES
   number columns (qty > 0). RAM/SSD cost from pricing when known, else 0. */
export function buildProductDoc(category, rec, ctx, id) {
  const cols = getColumns(category);
  const hasRam = cols.some((col) => col.kind === "ram");
  const hasSsd = cols.some((col) => col.kind === "ssd");
  const ramKey = cols.find((col) => col.kind === "ram")?.key;
  const ssdKey = cols.find((col) => col.kind === "ssd")?.key;

  const brand = val(rec, "brand");
  const model = val(rec, "model");
  // The Excel "deviceCost" column is the FINAL listed price (inclusive of the
  // default RAM + SSD). We treat it as listedPrice and back-calculate the bare
  // chassis deviceCost = listedPrice − ramCost − ssdCost, mirroring how the
  // pricing engine recomposes listed = deviceCost + RAM + SSD.
  const enteredPrice = Number(val(rec, "deviceCost")) || 0;
  const condition = val(rec, "condition") || "Excellent";
  const warranty = val(rec, "warrantyPeriod");
  const stock = Math.max(0, Math.round(Number(val(rec, "chassisStock")) || 0));

  const ramCap = hasRam ? val(rec, ramKey) : "";
  const ssdCap = hasSsd ? val(rec, ssdKey) : "";
  const ramCost = ramCap ? getPriceForCapacity(ramGB(ramCap), "DDR4", ctx.cfg) : 0;
  const ssdCost = ssdCap ? getSsdPrice(ssdCap, ctx.cfg) : 0;
  const listedPrice = enteredPrice;
  const deviceCost = listedPrice - ramCost - ssdCost;

  // attrs from every non-RAM/SSD spec column (skip top-level fields). bool cols
  // store a real boolean; numeric cols store a Number; everything else a string.
  const isYes = (s) => /^(yes|true|1)$/i.test(s);
  const TOP = new Set(["brand", "model", "deviceCost", "mrp", "chassisStock", "condition", "warrantyPeriod", "hsnCode", "description", "whats_in_box", "seoTitle", "category", "workstationTag"]);
  const attrs = { condition };
  for (const col of cols) {
    if (TOP.has(col.key) || col.kind === "ram" || col.kind === "ssd" || PORT_TYPES.includes(col.key)) continue;
    const v = val(rec, col.key);
    if (v === "") continue;
    if (col.kind === "bool") attrs[col.field] = isYes(v);
    else if (col.kind === "num") attrs[col.field] = Number(v);
    else attrs[col.field] = v;
  }
  if (warranty) attrs.warranty = warranty;

  // Mobile workstation = a tagged laptop. workstationTag=Yes → "workstation" tag.
  const tags = [];
  if (isYes(val(rec, "workstationTag"))) tags.push("workstation");
  const mrpVal = Number(val(rec, "mrp"));
  const mrp = Number.isFinite(mrpVal) && mrpVal > 0 ? mrpVal : undefined;

  // ports map from PORT_TYPES number columns.
  const portsRaw = {};
  for (const t of PORT_TYPES) { const n = Number(val(rec, t)); if (n > 0) portsRaw[t] = n; }
  const ports = normalizePorts(portsRaw);

  const doc = {
    id,
    name: `${brand} ${model}`.trim(),
    brand,
    category,
    listedPrice,
    price: listedPrice,
    deviceCost,
    status: "Published",
    chassisStock: stock,
    stock,
    condition,
    warrantyPeriod: warranty || "",
    hsnCode: val(rec, "hsnCode") || "",
    // Preserve description line breaks (Excel alt+enter) — normalise CRLF→\n so the
    // PDP renderer can split bullets/headings/paragraphs reliably.
    description: (val(rec, "description") || "").replace(/\r\n?/g, "\n"),
    // "What's in the box" — preserve line breaks (Excel alt+enter) the same way.
    whatsInBox: (val(rec, "whats_in_box") || "").replace(/\r\n?/g, "\n"),
    tags,
    images: [],
    ports,
    attrs,
  };
  if (mrp) doc.mrp = mrp;
  const seo = val(rec, "seoTitle");
  if (seo) doc.seoTitle = seo;

  if (hasRam) doc.defaultRam = { capacity: ramCap, type: "DDR4", isOnboard: false, cost: ramCost };
  if (hasSsd) doc.defaultSsd = { capacity: ssdCap, cost: ssdCost };
  if (hasRam && hasSsd) {
    doc.configs = [{ ram: `${ramCap} DDR4`.trim(), ssd: ssdCap, isDefault: true, price: listedPrice, available: true, show: true }];
  }
  return doc;
}

/* Add a typed value to a growable master table (lazy-seed + case-insensitive
   dedupe). Skips the RAM/SSD pseudo-tables (no master to grow). Returns true if a
   new value was actually appended. */
export async function addMasterValue(tableName, value) {
  if (!tableName || tableName === "__RAM__" || tableName === "__SSD__") return false;
  if (!Object.values(GROWABLE_TABLES).includes(tableName)) return false;
  let doc = await MasterData.findOne({ tableName });
  if (!doc) {
    const seed = MASTER_TABLES[tableName] || [];
    doc = await MasterData.create({ tableName, rows: seed.map((v) => ({ id: crypto.randomUUID(), value: v, active: true })) });
  }
  if (doc.rows.some((r) => lc(r.value) === lc(value))) return false;
  doc.rows.push({ id: crypto.randomUUID(), value, active: true });
  doc.markModified("rows");
  await doc.save();
  return true;
}
