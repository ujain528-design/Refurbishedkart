"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, Toggle, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import {
  MASTER_TABLES, PROCESSOR_FAMILIES, PROCESSOR_MODELS, GENERATIONS, DISPLAY_SIZES, RESOLUTIONS,
  REFRESH_RATES, STORAGE_TYPES, OS_OPTIONS, BATTERY_CAPACITIES, BATTERY_LIVES,
  WARRANTY_PERIODS, SERVER_OS, WORKSTATION_CHASSIS,
} from "@/lib/admin-data";
import { CATEGORY_SLUGS } from "@/lib/data";
import PortsGrid from "@/components/admin/PortsGrid";
import { normalizePorts } from "@/lib/ports";
import { adminGetProduct, adminCreateProduct, adminUpdateProduct, adminUpdateStock, adminGetPricingConfig, adminUploadImage } from "@/lib/api";
import ImageSearch from "@/components/admin/ImageSearch";
import { calculateDeviceCost, calculateUpgradePrice, priceForExtraCapacity, getSsdPrice } from "@/lib/server/pricing-core";
import { generateProductTitle } from "@/lib/generateTitle";
import { generateMetaDescription } from "@/lib/generateMetaDescription";

// Build a product-shaped object from the editor form so the SEO generators can
// preview the auto-generated title/description live as the admin edits.
function formAsProduct(f) {
  return {
    brand: f.brand,
    name: `${f.brand} ${f.model}`.trim(),
    model: f.model,
    category: f.category,
    listedPrice: Number(f.listedPrice) || 0,
    attrs: {
      processor: f.specs?.procModel || f.specs?.family || "",
      gen: f.specs?.gen || "",
      screen: f.specs?.size || "",
      touchscreen: !!f.touch,
      os: f.specs?.serverOs || f.specs?.os || "",
      warranty: f.specs?.warranty || "",
      formFactor: f.specs?.formFactor || "",
      resolution: f.specs?.res || "",
      panel: f.specs?.panel || "",
      refreshRate: f.specs?.refresh || "",
      chassis: f.specs?.chassis || "",
      gpu: f.specs?.gpu || "",
    },
  };
}

const TABS = ["Basic Info", "Pricing & Variants", "Images", "Specs", "Inspection", "Tags", "SEO"];
const RAM_CAPS = ["4GB", "8GB", "16GB", "32GB", "64GB"];
const RAM_TYPES = MASTER_TABLES["RAM Type"];
const SSD_CAPS = ["256GB", "512GB", "1TB", "2TB"];
const ALL_TAGS = ["Bestseller", "Flash Sale", "New Arrival", "Best for Students", "Recommended", "Best for WFH", "Workstation"];
const INSPECTION_ROWS = ["Display", "Keyboard", "Trackpad", "Battery", "Ports", "Speakers", "Webcam", "Hinges", "Body / Chassis", "Storage", "RAM", "Cooling", "Performance", "BIOS"];

const TAG_SLUG = { Bestseller: "bestseller", "Flash Sale": "flash-sale", "New Arrival": "new-arrival", "Best for Students": "student", Recommended: "recommended", "Best for WFH": "best-for-wfh", Workstation: "workstation" };
const SLUG_TAG = Object.fromEntries(Object.entries(TAG_SLUG).map(([k, v]) => [v, k]));

const EMPTY = {
  brand: "", model: "", category: "Laptops", status: "Draft", description: "", whatsInBox: "",
  listedPrice: "", mrp: "", chassisStock: 0,
  defaultRam: { capacity: "8GB", type: "DDR4", isOnboard: false, cost: 0 },
  defaultSsd: { capacity: "256GB", cost: 0 },
  configs: [], touch: false,
  specs: {}, ports: {}, images: [], tags: [], salePrice: "", saleEnd: "", metaTitle: "", metaDesc: "",
  seoTitle: "", seoDescription: "",
  // Warranty & HSN — "" means "use store default" (GST is a flat store-wide rate)
  warrantyPeriod: "", hsnCode: "",
  // Refurbished grade (default Excellent).
  condition: "Excellent",
};

const CONDITIONS = ["Excellent", "Good", "Fair"];

// Per-category field visibility. showField() gates whole editor groups so, e.g., a
// Monitor never shows RAM/SSD/processor/OS/variants. Keys are logical groups (not raw
// spec keys). A category not listed here falls through to "show everything".
const CATEGORY_FIELDS = {
  laptops: ["processor", "ram", "storage", "os", "display", "gpu", "battery", "variants", "formFactor", "ports", "physical"],
  desktops: ["processor", "ram", "storage", "os", "gpu", "variants", "formFactor", "ports", "physical"],
  monitors: ["display", "monitor", "physical", "ports"],
  servers: ["processor", "ram", "storage", "os", "variants", "formFactor", "ports"],
  workstations: ["processor", "ram", "storage", "os", "gpu", "variants", "formFactor", "ports", "physical"],
};

// Chassis / form-factor pickers for laptops & desktops (servers & workstations
// already have their own Form Factor / Chassis dropdowns).
const LAPTOP_CHASSIS = ["Ultrabook", "Business Laptop", "Gaming Laptop", "2-in-1 Convertible", "Rugged Laptop"];
const DESKTOP_CHASSIS = ["Tower", "Small Form Factor (SFF)", "Mini PC", "All-in-One (AIO)", "Micro Desktop"];

/* Reconstruct the two-level processor selection (Family + Model) from a stored
   `attrs.processor` string of ANY shape — full names from bulk import
   ("Intel Core i5-10310U"), bare models ("i5-10310U"), or already-clean
   families ("Intel Core i5"). Partial-matches against PROCESSOR_FAMILIES /
   PROCESSOR_MODELS so a bulk-uploaded product's dropdowns aren't left blank.
   Longest model token wins (so "M2 Pro" beats "M2"). */
function deriveProcessor(proc) {
  const s = String(proc || "").trim();
  if (!s) return { family: "", procModel: "" };
  const lc = s.toLowerCase();
  let family = PROCESSOR_FAMILIES.find((fam) => fam.toLowerCase() === lc) || "";
  if (!family) {
    family = PROCESSOR_FAMILIES.find((fam) => {
      const f = fam.toLowerCase();
      if (f === "apple") return /apple/i.test(s) || /\bm[1-4]\b/i.test(s);
      if (f === "xeon") return /xeon/i.test(s);
      if (f === "intel celeron") return /celeron/i.test(s);
      if (f === "intel pentium") return /pentium/i.test(s);
      if (f.startsWith("intel core ")) {
        const tag = fam.split(" ").pop(); // i3/i5/i7/i9
        return new RegExp(`\\b${tag}\\b`, "i").test(s) || new RegExp(`core\\s*${tag}`, "i").test(s);
      }
      if (f.startsWith("amd ryzen ")) {
        const num = fam.split(" ").pop(); // 3/5/7/9
        return new RegExp(`ryzen\\s*${num}`, "i").test(s);
      }
      return false;
    }) || "";
  }
  let procModel = "";
  if (family && PROCESSOR_MODELS[family]) {
    procModel =
      [...PROCESSOR_MODELS[family]]
        .sort((a, b) => b.length - a.length)
        .find((mdl) => lc.includes(mdl.toLowerCase())) || "";
  }
  return { family, procModel };
}

/* DB document → editor form. The editor's shape diverges from the stored doc, so
   we map every field the DB actually has; the rest stay at EMPTY defaults. */
function dbToForm(p) {
  const a = p.attrs || {};
  return {
    ...EMPTY,
    brand: p.brand || "",
    model: (p.name || "").replace(new RegExp("^" + (p.brand || "") + "\\s*", "i"), "").trim() || p.name || "",
    category: p.category || "Laptops",
    status: p.stock === 0 ? "Out of Stock" : "Active",
    description: p.description || p.specs || "",
    whatsInBox: p.whatsInBox || "",
    listedPrice: p.listedPrice ?? p.price ?? "",
    mrp: p.mrp ?? "",
    chassisStock: p.chassisStock ?? p.stock ?? 0,
    defaultRam: p.defaultRam
      ? { capacity: p.defaultRam.capacity || "8GB", type: p.defaultRam.type || "DDR4", isOnboard: !!p.defaultRam.isOnboard, cost: p.defaultRam.cost ?? 0 }
      : { capacity: a.ram ? `${a.ram}GB` : "8GB", type: a.ramType || "DDR4", isOnboard: /LPDDR/i.test(a.ramType || ""), cost: 0 },
    defaultSsd: p.defaultSsd
      ? { capacity: p.defaultSsd.capacity || "256GB", cost: p.defaultSsd.cost ?? 0 }
      : { capacity: a.ssd || "256GB", cost: 0 },
    // additional (non-default) configs only — the default is the section above
    configs: (p.configs || []).filter((c) => !c.isDefault).map((c) => {
      const parts = String(c.ram || "").split(" ");
      return { ramCap: parts[0] || "", ramType: parts.slice(1).join(" "), ssd: c.ssd || "", price: c.price ?? 0, override: !!c.override, available: c.available !== false, show: c.show !== false };
    }),
    touch: !!a.touchscreen,
    specs: {
      gen: a.gen || "", ramType: a.ramType || "", os: a.os || "", warranty: a.warranty || "", size: a.screen || "",
      res: a.resolution || "", panel: a.panel || "", refresh: a.refreshRate || "",
      chassis: a.chassis || "", serverOs: p.category === "Servers" ? a.os || "" : "", gpu: a.gpu || "",
      // Finalized spec fields (workstation/laptop/monitor/server).
      formFactor: a.formFactor || a.chassis || "", ramExpandability: a.ramExpandability || "", batteryHealth: a.batteryHealth || "",
      backlit: !!a.backlitKeyboard, webcam: !!a.webcam, psu: a.psu || "", weight: a.weight || "",
      brightness: a.brightness ?? "", responseTime: a.responseTime ?? "", hdr: !!a.hdr,
      aspectRatio: a.aspectRatio || "", vesaMount: !!a.vesaMount, builtInSpeakers: !!a.builtInSpeakers,
      driveBays: a.driveBays ?? "", raid: a.raid || "", redundantPower: !!a.redundantPower,
      // Reconstruct the Family + Model dropdowns from attrs.processor (handles
      // bulk-imported full names). editorSpecs (an explicit prior admin choice)
      // is spread last so it still wins when present.
      ...deriveProcessor(a.processor),
      ...(p.editorSpecs || {}),
    },
    ports: p.ports || {},
    images: p.images || (p.image ? [p.image] : []),
    tags: (p.tags || []).map((s) => SLUG_TAG[s] || s),
    salePrice: p.salePrice ?? "",
    saleEnd: p.saleEnd || "",
    metaTitle: p.metaTitle || "",
    metaDesc: p.metaDesc || "",
    seoTitle: p.seoTitle || "",
    seoDescription: p.seoDescription || "",
    warrantyPeriod: p.warrantyPeriod || "",
    hsnCode: p.hsnCode || "",
    condition: p.condition || a.condition || a.grade || "Excellent",
  };
}

/* Editor form → DB document fields (partial $set; merges attrs over the original
   so fields the editor doesn't model aren't wiped). */
function formToDb(f, orig) {
  const a = orig?.attrs || {};
  const lp = Number(f.listedPrice) || 0;
  // default config + admin-added additional configs
  const defaultConfig = {
    ram: `${f.defaultRam.capacity} ${f.defaultRam.type}`.trim(),
    ssd: f.defaultSsd.capacity, isDefault: true, price: lp, available: true, show: true,
  };
  const extraConfigs = (f.configs || []).map((c) => ({
    ram: `${c.ramCap}${c.ramType ? ` ${c.ramType}` : ""}`.trim(),
    ssd: c.ssd, isDefault: false, price: Number(c.price) || 0, override: !!c.override, available: c.available !== false, show: c.show !== false,
  }));
  return {
    name: ((f.brand ? f.brand + " " : "") + (f.model || "")).trim(),
    brand: f.brand,
    category: f.category,
    listedPrice: lp,
    price: lp,
    mrp: f.mrp !== "" && Number(f.mrp) > 0 ? Number(f.mrp) : undefined,
    defaultRam: { capacity: f.defaultRam.capacity, type: f.defaultRam.type, isOnboard: !!f.defaultRam.isOnboard, cost: Number(f.defaultRam.cost) || 0 },
    defaultSsd: { capacity: f.defaultSsd.capacity, cost: Number(f.defaultSsd.cost) || 0 },
    description: f.description,
    whatsInBox: f.whatsInBox,
    status: f.status,
    chassisStock: Number(f.chassisStock) || 0,
    stock: Number(f.chassisStock) || 0, // mirror
    configs: [defaultConfig, ...extraConfigs],
    tags: f.tags.map((t) => TAG_SLUG[t] || t.toLowerCase().replace(/\s+/g, "-")),
    flashSale: f.tags.includes("Flash Sale"),
    salePrice: f.salePrice ? Number(f.salePrice) : undefined,
    saleEnd: f.saleEnd || undefined,
    metaTitle: f.metaTitle || undefined,
    metaDesc: f.metaDesc || undefined,
    seoTitle: f.seoTitle?.trim() || undefined,
    seoDescription: f.seoDescription?.trim() || undefined,
    // Per-product warranty + HSN overrides ("" ⇒ store default). GST is no longer
    // a per-product override — it's a flat store-wide rate.
    warrantyPeriod: f.warrantyPeriod || "",
    hsnCode: f.hsnCode?.trim() || "",
    condition: f.condition || "Excellent",
    images: f.images,
    editorSpecs: f.specs, // preserve the editor's structured spec object
    ports: normalizePorts(f.ports), // { "USB-A": 2, ... } — qty > 0 only
    attrs: {
      ...a,
      // Mirror to attrs so the PDP badge + Compare "Condition" row pick it up.
      condition: f.condition || "Excellent",
      ramType: f.specs.ramType || a.ramType,
      os: f.specs.serverOs || f.specs.os || a.os, // servers use Server OS dropdown
      warranty: f.specs.warranty || a.warranty,
      gen: f.specs.gen || a.gen,
      screen: f.specs.size || a.screen,
      touchscreen: f.touch,
      // Monitor + server + workstation specifics (undefined when blank → omitted
      // on the product page / title by the skip-if-empty rule).
      resolution: f.specs.res || a.resolution || undefined,
      panel: f.specs.panel || a.panel || undefined,
      refreshRate: f.specs.refresh || a.refreshRate || undefined,
      chassis: f.specs.chassis || a.chassis || undefined,
      gpu: f.specs.gpu || a.gpu || undefined,
      ramType: f.specs.ramType || a.ramType || undefined,
      // Form factor / chassis (desktops + workstations).
      formFactor: f.specs.formFactor || a.formFactor || undefined,
      ramExpandability: f.specs.ramExpandability || undefined,
      // Laptop-only fields.
      batteryHealth: f.category === "Laptops" ? (f.specs.batteryHealth || undefined) : undefined,
      backlitKeyboard: f.category === "Laptops" ? !!f.specs.backlit : undefined,
      webcam: f.category === "Laptops" ? !!f.specs.webcam : undefined,
      // Weight — laptops + monitors only (workstations are desktop towers).
      weight: ["Laptops", "Monitors"].includes(f.category) ? (f.specs.weight || undefined) : undefined,
      // PSU — workstations + desktops.
      psu: ["Workstations", "Desktops"].includes(f.category) ? (f.specs.psu || undefined) : undefined,
      // Monitor-only.
      brightness: f.category === "Monitors" && f.specs.brightness !== "" ? Number(f.specs.brightness) || undefined : undefined,
      responseTime: f.category === "Monitors" && f.specs.responseTime !== "" ? Number(f.specs.responseTime) || undefined : undefined,
      hdr: f.category === "Monitors" ? !!f.specs.hdr : undefined,
      aspectRatio: f.category === "Monitors" ? (f.specs.aspectRatio || undefined) : undefined,
      vesaMount: f.category === "Monitors" ? !!f.specs.vesaMount : undefined,
      builtInSpeakers: f.category === "Monitors" ? !!f.specs.builtInSpeakers : undefined,
      // Server-only.
      driveBays: f.category === "Servers" && f.specs.driveBays !== "" ? Number(f.specs.driveBays) || undefined : undefined,
      raid: f.category === "Servers" ? (f.specs.raid || undefined) : undefined,
      redundantPower: f.category === "Servers" ? !!f.specs.redundantPower : undefined,
    },
  };
}

const VALIDATORS = {
  brand: (v) => (v ? "" : "Brand is required"),
  model: (v) => (v.trim() ? "" : "Model is required"),
  category: (v) => (v ? "" : "Category is required"),
  listedPrice: (v) => (Number(v) > 0 ? "" : "Listed price must be greater than 0"),
};
const FIELD_TAB = { brand: "Basic Info", model: "Basic Info", category: "Basic Info", listedPrice: "Pricing & Variants" };

function Group({ title, children, cols = 2 }) {
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-brand">{title}</h3>
      <div className={`grid gap-4 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>{children}</div>
    </div>
  );
}

function VField({ ctx, k, label, type = "text", placeholder, textarea, rows = 5, options, min, hint }) {
  const { f, errors, touched, update, blur } = ctx;
  const err = errors[k];
  const show = touched[k];
  const ok = !err && f[k] !== "" && f[k] != null;
  const ring = show && err ? "border-red-400 focus:ring-red-200" : ok ? "border-brand/40" : "border-black/10";
  return (
    <label className="block" id={`field-${k}`}>
      <span className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-neutral-600">
        {label} {VALIDATORS[k] && <span className="text-red-500">*</span>}
        {ok && <span className="text-brand">✓</span>}
      </span>
      {options ? (
        <select value={f[k]} onChange={(e) => { update(k, e.target.value); blur(k); }} className={`${inputCls} ${ring}`}>{options.map((o) => <option key={o}>{o}</option>)}</select>
      ) : textarea ? (
        <textarea value={f[k]} onChange={(e) => update(k, e.target.value)} onBlur={() => blur(k)} rows={rows} placeholder={placeholder} className={`${inputCls} ${ring}`} />
      ) : (
        <input type={type} min={min} value={f[k]} onChange={(e) => update(k, e.target.value)} onBlur={() => blur(k)} placeholder={placeholder} className={`${inputCls} ${ring}`} />
      )}
      {show && err ? <span className="mt-1 block text-[11px] font-semibold text-red-600">{err}</span> : hint ? <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span> : null}
    </label>
  );
}

function Drop({ ctx, label, options, specKey }) {
  const { f, updateSpec } = ctx;
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{label}</span>
      <select value={f.specs[specKey] ?? ""} onChange={(e) => updateSpec(specKey, e.target.value)} className={inputCls}>
        <option value="">— Select —</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export default function ProductEditor() {
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const STORAGE_KEY = `admin_product_draft_${editId || "new"}`;

  const [tab, setTab] = useState(TABS[0]);
  const [f, setF] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [dirty, setDirty] = useState(false);
  const [restore, setRestore] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(!!editId);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [pricingCfg, setPricingCfg] = useState({ ram: {}, ssd: {} });
  const debounce = useRef(null);
  const hydrated = useRef(false);
  const origRef = useRef(null);

  const errors = Object.fromEntries(Object.keys(VALIDATORS).map((k) => [k, VALIDATORS[k](f[k] ?? "")]));
  const isValid = Object.values(errors).every((e) => !e);

  // Mount: in edit mode fetch + prefill from DB; then offer any scoped draft.
  useEffect(() => {
    let alive = true;
    (async () => {
      let base = EMPTY;
      if (editId) {
        try {
          const p = await adminGetProduct(editId);
          if (p) { origRef.current = p; base = dbToForm(p); }
          else setLoadError("Product not found — has the database been seeded?");
        } catch (e) {
          setLoadError(e?.message || "Couldn't load this product from the database.");
        }
      }
      if (!alive) return;
      setF(base);
      setLoadingProduct(false);
      try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const saved = JSON.parse(raw); setRestore({ savedAt: saved.__savedAt, data: saved }); } } catch {}
      hydrated.current = true;
    })();
    adminGetPricingConfig().then((c) => alive && setPricingCfg({ ram: c.ram || {}, ssd: c.ssd || {} })).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  useEffect(() => {
    if (!hydrated.current || !dirty) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...f, __savedAt: new Date().toISOString() })); } catch {}
    }, 500);
    return () => clearTimeout(debounce.current);
  }, [f, dirty, STORAGE_KEY]);

  useEffect(() => {
    const handler = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Live-recompute non-overridden config prices = listedPrice + upgrade cost.
  useEffect(() => {
    if (!hydrated.current) return;
    setF((s) => {
      const synthetic = { listedPrice: Number(s.listedPrice) || 0, defaultRam: s.defaultRam, defaultSsd: s.defaultSsd };
      let changed = false;
      const configs = s.configs.map((c) => {
        if (c.override) return c;
        const total = calculateUpgradePrice(synthetic, c.ramCap, c.ssd, pricingCfg);
        if (Number(c.price) !== total) { changed = true; return { ...c, price: total }; }
        return c;
      });
      return changed ? { ...s, configs } : s;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.listedPrice, f.defaultRam, f.defaultSsd, JSON.stringify(f.configs.map((c) => [c.ramCap, c.ramType, c.ssd, c.override])), pricingCfg]);

  const update = (key, value) => {
    setF((s) => {
      // Switching category clears category-specific spec fields (and RAM/SSD variant
      // configs when moving to a category that has none, e.g. Monitors) so stale
      // laptop fields never linger on a monitor. Shared top-level fields are kept.
      if (key === "category" && value !== s.category) {
        return { ...s, category: value, specs: {}, configs: value === "Monitors" ? [] : s.configs, touch: value === "Laptops" ? s.touch : false };
      }
      return { ...s, [key]: value };
    });
    setDirty(true);
  };
  const updateSpec = (key, value) => { setF((s) => ({ ...s, specs: { ...s.specs, [key]: value } })); setDirty(true); };
  // Category-driven group visibility. Blank/unknown category → show all (backward compatible).
  const showField = (field) => {
    if (!f.category) return true;
    const allowed = CATEGORY_FIELDS[f.category.toLowerCase()];
    if (!allowed) return true;
    return allowed.includes(field);
  };
  const blur = (key) => setTouched((t) => ({ ...t, [key]: true }));
  const toggleArr = (key, v) => update(key, f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v]);
  const switchTab = (t) => setTab(t);

  // Default config — auto-fill component costs from the global price tables.
  const gbOf = (s) => parseInt(s, 10) || 0;
  const setDefaultRam = (key, val) => {
    setF((s) => {
      const dr = { ...s.defaultRam, [key]: val };
      if (key !== "cost") dr.cost = dr.isOnboard ? 0 : priceForExtraCapacity(gbOf(dr.capacity), dr.type, pricingCfg);
      return { ...s, defaultRam: dr };
    });
    setDirty(true);
  };
  const setDefaultSsd = (key, val) => {
    setF((s) => {
      const ds = { ...s.defaultSsd, [key]: val };
      if (key === "capacity") ds.cost = getSsdPrice(val, pricingCfg);
      return { ...s, defaultSsd: ds };
    });
    setDirty(true);
  };

  // Additional configs CRUD
  const addConfig = () => update("configs", [...f.configs, { ramCap: f.defaultRam.capacity, ramType: f.defaultRam.type, ssd: f.defaultSsd.capacity, price: "", override: false, available: true, show: true }]);
  const updateConfig = (i, key, val) => update("configs", f.configs.map((c, idx) => (idx === i ? { ...c, [key]: val, ...(key === "price" ? { override: true } : {}) } : c)));
  const removeConfig = (i) => update("configs", f.configs.filter((_, idx) => idx !== i));

  const deviceCost = calculateDeviceCost(Number(f.listedPrice) || 0, Number(f.defaultRam.cost) || 0, Number(f.defaultSsd.cost) || 0);
  const configAdditional = (c) => (Number(c.price) || 0) - (Number(f.listedPrice) || 0);

  // Image upload → /api/admin/upload. Supports MULTIPLE files at once (multi-file
  // picker + multi-drop): upload sequentially, append each returned URL in order.
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragIdx = useRef(null);
  const [showFind, setShowFind] = useState(false);
  const uploadImages = async (fileList) => {
    const files = Array.from(fileList || []).filter((file) => file && file.type?.startsWith("image/"));
    if (!files.length) return;
    setUploading(true);
    const added = [];
    try {
      for (const file of files) {
        try { const { url } = await adminUploadImage(file); if (url) added.push(url); }
        catch (e) { toast(`${file.name}: ${e.message || "upload failed"}`, "error"); }
      }
      if (added.length) {
        setF((s) => ({ ...s, images: [...s.images, ...added] }));
        setDirty(true);
        toast(`${added.length} image${added.length > 1 ? "s" : ""} added — remember to Save`);
      }
    } finally { setUploading(false); }
  };
  // Reorder helpers — first image is the primary/cover.
  const moveImage = (from, to) => {
    if (to < 0 || to >= f.images.length || from === to) return;
    const next = [...f.images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update("images", next);
  };
  const removeImage = (i) => update("images", f.images.filter((_, idx) => idx !== i));

  // Chassis stock: immediate save in edit mode, local in new mode.
  const adjustChassis = async (action) => {
    if (editId) {
      try { const p = await adminUpdateStock(editId, { action, quantity: 1 }); setF((s) => ({ ...s, chassisStock: p.chassisStock ?? p.stock ?? 0 })); origRef.current = p; }
      catch (e) { toast(e.message || "Stock update failed", "error"); }
    } else {
      setF((s) => ({ ...s, chassisStock: Math.max(0, (Number(s.chassisStock) || 0) + (action === "decrease" ? -1 : 1)) }));
      setDirty(true);
    }
  };

  const ctx = { f, errors, touched, update, updateSpec, blur };

  const restoreDraft = () => { const { __savedAt, ...data } = restore.data; setF({ ...EMPTY, ...data }); setDirty(true); setRestore(null); toast("Draft restored"); };
  const startFresh = () => { localStorage.removeItem(STORAGE_KEY); setRestore(null); };

  const save = async (status) => {
    setTouched(Object.fromEntries(Object.keys(VALIDATORS).map((k) => [k, true])));
    if (!isValid) {
      const firstBad = Object.keys(VALIDATORS).find((k) => errors[k]);
      setTab(FIELD_TAB[firstBad]);
      setTimeout(() => {
        const el = document.getElementById(`field-${firstBad}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.classList.add("ring-2", "ring-red-400");
        setTimeout(() => el?.classList.remove("ring-2", "ring-red-400"), 1500);
      }, 60);
      toast("Fix the highlighted fields before saving", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formToDb(f, origRef.current), status };
      const saved = editId ? await adminUpdateProduct(editId, payload) : await adminCreateProduct(payload);
      localStorage.removeItem(STORAGE_KEY);
      setDirty(false);
      setLastSaved(new Date());
      origRef.current = saved || origRef.current;
      toast(`Saved as ${status}`);
      if (!editId && saved?.id) router.replace(`/admin/products/new?id=${saved.id}`); // → edit mode
    } catch (e) {
      toast(e.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const leaveEditor = () => { if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return; router.push("/admin/products"); };

  if (loadingProduct) return <div className="py-24 text-center text-sm text-neutral-400">Loading product…</div>;
  if (loadError) return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="text-sm font-semibold text-red-600">{loadError}</p>
      <p className="mt-1 text-[13px] text-neutral-500">The editor stays blank until the product loads — this is the underlying cause, not a missing pre-fill.</p>
      <div className="mt-5 flex justify-center gap-2">
        <button onClick={() => window.location.reload()} className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Retry</button>
        <button onClick={() => router.push("/admin/products")} className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold text-ink">Back to products</button>
      </div>
    </div>
  );

  return (
    <div>
      {restore && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-sm font-semibold text-amber-800">Unsaved draft from {new Date(restore.savedAt).toLocaleString("en-IN")}. Restore it?</span>
          <div className="ml-auto flex gap-2">
            <button onClick={restoreDraft} className="rounded-full bg-brand px-4 py-1.5 text-[13px] font-bold text-white">Restore Draft</button>
            <button onClick={startFresh} className="rounded-full border border-black/10 px-4 py-1.5 text-[13px] font-bold text-ink">Discard</button>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            {editId ? "Edit Product" : "Add New Product"}
            {dirty && <span className="ml-2 text-[12px] font-semibold text-amber-600">● unsaved</span>}
          </h1>
          <button onClick={leaveEditor} className="mt-1 text-[13px] font-semibold text-neutral-400 hover:text-ink">← Back to products</button>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && <span className="text-[12px] text-neutral-400">Last saved {lastSaved.toLocaleTimeString("en-IN")}</span>}
          <button onClick={() => save("Draft")} disabled={saving} className={btnGhost}>{saving ? "Saving…" : "Save as Draft"}</button>
          <button onClick={() => save("Published")} disabled={!isValid || saving} className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}>Publish</button>
        </div>
      </div>

      <div className="rounded-card border border-black/5 bg-white p-6 shadow-card">
        <Tabs tabs={TABS} active={tab} onChange={switchTab} />

        <div className="mt-6">
          {tab === "Basic Info" && (
            <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
              <VField ctx={ctx} k="brand" label="Brand" options={["", ...MASTER_TABLES.Brands]} />
              <VField ctx={ctx} k="model" label="Model" placeholder="ThinkPad T14" />
              <VField ctx={ctx} k="category" label="Category" options={Object.values(CATEGORY_SLUGS)} />
              <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">Status</span><select value={f.status} onChange={(e) => update("status", e.target.value)} className={inputCls}><option>Draft</option><option>Active</option><option>Out of Stock</option></select></label>
              <div className="sm:col-span-2"><VField ctx={ctx} k="description" label="About This Device (shown on product page)" textarea placeholder={"The Dell Latitude 3420 is a reliable laptop.\n\nKey Features:\n- Fast Performance: 11th Gen Intel i5\n- Compact Design: 14-inch slim frame"} hint="Use - for bullets, a line ending in : for a heading, and a blank line between paragraphs. Leave empty to auto-generate from specs." /></div>
              <div className="sm:col-span-2"><VField ctx={ctx} k="whatsInBox" label="What's in the Box" textarea rows={4} placeholder={"1 x Laptop\n1 x Power Adapter\n1 x Warranty Card"} hint="One item per line. Leave empty to hide the section." /></div>

              {/* ── Warranty & Tax ── per-product overrides; blank ⇒ store default ── */}
              <div className="sm:col-span-2 mt-2 rounded-lg border border-black/10 bg-neutral-50 p-4">
                <p className="text-[12px] font-bold uppercase tracking-wide text-brand">Warranty &amp; Tax</p>
                <p className="mb-3 mt-0.5 text-[12px] text-neutral-500">Leave on “store default” to inherit the values from Settings → Policies.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Condition</span>
                    <select value={f.condition} onChange={(e) => update("condition", e.target.value)} className={inputCls}>
                      {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="mt-1 block text-[11px] text-neutral-400">Refurbished grade shown on the product page &amp; in compare.</span>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Warranty Period</span>
                    <select value={f.warrantyPeriod} onChange={(e) => update("warrantyPeriod", e.target.value)} className={inputCls}>
                      <option value="">Use store default</option>
                      <option value="3 months">3 months</option>
                      <option value="6 months">6 months</option>
                      <option value="1 year">1 year</option>
                      <option value="2 years">2 years</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">HSN Code</span>
                    <input value={f.hsnCode} onChange={(e) => update("hsnCode", e.target.value)} placeholder="Default: 8471" className={inputCls} />
                    <span className="mt-1 block text-[11px] text-neutral-400">Leave empty to use store default HSN code</span>
                  </label>
                </div>
              </div>

              {/* ── SEO ── auto-filled from the generators; admin can override ── */}
              <div className="sm:col-span-2 mt-2 rounded-lg border border-black/10 bg-neutral-50 p-4">
                <p className="text-[12px] font-bold uppercase tracking-wide text-brand">Search Engine Optimization</p>
                <p className="mb-3 mt-0.5 text-[12px] text-neutral-500">Leave blank to use the auto-generated title &amp; description. Fill in to override.</p>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-neutral-600">SEO Title</span>
                  <input
                    className={inputCls}
                    value={f.seoTitle}
                    onChange={(e) => update("seoTitle", e.target.value)}
                    placeholder={generateProductTitle({ ...formAsProduct(f), seoTitle: "" }) || "Auto-generated from product details"}
                  />
                </label>

                <label className="mt-3 block">
                  <span className="mb-1 block text-[12px] font-semibold text-neutral-600">SEO Description ({(f.seoDescription || "").length}/155)</span>
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={f.seoDescription}
                    onChange={(e) => update("seoDescription", e.target.value)}
                    placeholder={generateMetaDescription({ ...formAsProduct(f), seoDescription: "" }) || "Auto-generated from product details"}
                  />
                </label>

                {/* Google SERP preview */}
                <div className="mt-4 rounded-lg border border-black/10 bg-white p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Google preview</p>
                  <p className="truncate text-[18px] leading-snug text-[#1a0dab]">
                    {f.seoTitle?.trim() || generateProductTitle({ ...formAsProduct(f), seoTitle: "" }) || "Product title"}
                  </p>
                  <p className="text-[13px] text-[#006621]">
                    refurbishedkart.com › products › {(f.category || "category").toLowerCase()} › {editId || "new"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-neutral-600">
                    {f.seoDescription?.trim() || generateMetaDescription({ ...formAsProduct(f), seoDescription: "" }) || "Meta description preview…"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === "Pricing & Variants" && (
            <div className="max-w-3xl space-y-8">
              {/* SECTION 1 — Default Configuration */}
              <section>
                {/* Default RAM/SSD config — variant categories only (hidden for Monitors). */}
                {showField("variants") && (<>
                <p className="mb-1 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-brand">
                  Default Configuration
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">Base (included)</span>
                </p>
                <p className="mb-3 text-[11px] text-neutral-400">The Listed Price already includes this RAM + SSD. Other configs add/subtract a delta from it.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-black/10 p-4">
                    <p className="mb-2 text-[12px] font-semibold text-neutral-600">Default RAM</p>
                    <div className="flex gap-2">
                      <select value={f.defaultRam.capacity} onChange={(e) => setDefaultRam("capacity", e.target.value)} className={`${inputCls} max-w-[90px]`}>{RAM_CAPS.map((o) => <option key={o}>{o}</option>)}</select>
                      <select value={f.defaultRam.type} onChange={(e) => setDefaultRam("type", e.target.value)} className={`${inputCls} max-w-[120px]`}>{RAM_TYPES.map((o) => <option key={o}>{o}</option>)}</select>
                    </div>
                    <label className="mt-3 flex items-center justify-between"><span className="text-[13px] text-neutral-600">Onboard (soldered)</span><Toggle on={f.defaultRam.isOnboard} onChange={(v) => setDefaultRam("isOnboard", v)} /></label>
                    <label className="mt-3 block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">Cost ₹ (auto · overridable)</span>
                      <input type="number" value={f.defaultRam.cost} onChange={(e) => setDefaultRam("cost", Number(e.target.value) || 0)} className={inputCls} /></label>
                  </div>
                  <div className="rounded-lg border border-black/10 p-4">
                    <p className="mb-2 text-[12px] font-semibold text-neutral-600">Default SSD</p>
                    <select value={f.defaultSsd.capacity} onChange={(e) => setDefaultSsd("capacity", e.target.value)} className={`${inputCls} max-w-[120px]`}>{SSD_CAPS.map((o) => <option key={o}>{o}</option>)}</select>
                    <label className="mt-3 block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">Cost ₹ (auto · overridable)</span>
                      <input type="number" value={f.defaultSsd.cost} onChange={(e) => setDefaultSsd("cost", Number(e.target.value) || 0)} className={inputCls} /></label>
                  </div>
                </div>
                </>)}
                <div className="mt-4 grid items-end gap-4 sm:grid-cols-2">
                  <div className="max-w-[240px]"><VField ctx={ctx} k="listedPrice" label="Listed Price ₹ (default config)" type="number" min={0} placeholder="27499" hint="Price buyers pay for the default config" /></div>
                  <div className="rounded-lg bg-brand-softer/50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Device cost (calculated)</p>
                    <p className="mt-1 text-xl font-extrabold text-brand">{"₹" + (Number(deviceCost) || 0).toLocaleString("en-IN")}</p>
                    <p className="text-[11px] text-neutral-400">Listed − RAM cost − SSD cost</p>
                  </div>
                </div>
                {/* MRP — original/market price for the strikethrough + % off. Independent
                    of the pricing engine; leave blank to show no strikethrough. */}
                <div className="mt-4 max-w-[240px]">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">MRP / Original Price ₹</span>
                    <input type="number" min={0} value={f.mrp} onChange={(e) => update("mrp", e.target.value)} placeholder="e.g. 38000" className={inputCls} />
                    <span className="mt-1 block text-[11px] text-neutral-400">
                      Shown struck-through with “% off” when above the listed price. Blank = no strikethrough.
                      {f.mrp && Number(f.mrp) > (Number(f.listedPrice) || 0) && Number(f.listedPrice) > 0 ? ` (${Math.round((1 - Number(f.listedPrice) / Number(f.mrp)) * 100)}% off)` : ""}
                    </span>
                  </label>
                </div>
              </section>

              {/* SECTION 2 — Additional Configurations — variant categories only (hidden for Monitors) */}
              {showField("variants") && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-brand">Additional Configurations</p>
                  <button onClick={addConfig} className="rounded-full border border-brand px-3 py-1 text-[12px] font-bold text-brand hover:bg-brand-softer">+ Add Config</button>
                </div>
                {f.configs.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-black/10 bg-neutral-50 px-4 py-6 text-center text-[13px] text-neutral-400">Only the default config is offered. Add upgrades (more RAM / SSD) here — the price auto-calculates.</p>
                ) : (
                  <div className="space-y-2">
                    {f.configs.map((c, i) => (
                      <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-black/10 p-3">
                        <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">RAM</span>
                          <select value={c.ramCap} onChange={(e) => updateConfig(i, "ramCap", e.target.value)} className={`${inputCls} max-w-[85px]`}>{RAM_CAPS.map((o) => <option key={o}>{o}</option>)}</select></label>
                        <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">Type</span>
                          <select value={c.ramType} onChange={(e) => updateConfig(i, "ramType", e.target.value)} className={`${inputCls} max-w-[110px]`}>{RAM_TYPES.map((o) => <option key={o}>{o}</option>)}</select></label>
                        <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">SSD</span>
                          <select value={c.ssd} onChange={(e) => updateConfig(i, "ssd", e.target.value)} className={`${inputCls} max-w-[85px]`}>{SSD_CAPS.map((o) => <option key={o}>{o}</option>)}</select></label>
                        <div className="pb-2.5"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">Delta</span>
                          {(() => {
                            const d = Math.round(configAdditional(c) || 0);
                            const cls = d > 0 ? "text-ink" : d < 0 ? "text-brand" : "text-neutral-400";
                            const label = d === 0 ? "Base (included)" : `${d > 0 ? "+" : "−"}₹${Math.abs(d).toLocaleString("en-IN")}`;
                            return <span className={`text-[13px] font-bold ${cls}`}>{label}</span>;
                          })()}
                        </div>
                        <div className="pb-1">
                          <span className="mb-1 block text-[11px] font-semibold text-neutral-500">Total Price</span>
                          {c.override ? (
                            <input type="number" value={c.price} onChange={(e) => updateConfig(i, "price", Number(e.target.value) || 0)} className={`${inputCls} max-w-[110px]`} />
                          ) : (
                            <span className="inline-block min-w-[100px] rounded-lg bg-neutral-100 px-3 py-2 text-[13px] font-bold text-ink">{"₹" + (Number(c.price) || 0).toLocaleString("en-IN")}<span className="ml-1 text-[10px] font-normal text-neutral-400">calc</span></span>
                          )}
                        </div>
                        <label className="flex items-center gap-1.5 pb-2.5 text-[12px] text-neutral-600"><input type="checkbox" checked={!!c.override} onChange={(e) => updateConfig(i, "override", e.target.checked)} className="accent-brand" />Override</label>
                        <label className="flex items-center gap-1.5 pb-2.5 text-[12px] text-neutral-600"><input type="checkbox" checked={c.available} onChange={(e) => updateConfig(i, "available", e.target.checked)} className="accent-brand" />Avail</label>
                        <label className="flex items-center gap-1.5 pb-2.5 text-[12px] text-neutral-600"><input type="checkbox" checked={c.show} onChange={(e) => updateConfig(i, "show", e.target.checked)} className="accent-brand" />Show</label>
                        <button onClick={() => removeConfig(i)} className="ml-auto pb-2.5 text-[12px] font-bold text-red-600 hover:underline">Delete</button>
                      </div>
                    ))}
                  </div>
                )}
                {f.category === "Laptops" && (
                  <div className="mt-3 flex max-w-xs items-center justify-between rounded-lg border border-black/10 px-3 py-2.5">
                    <span className="text-sm">Touchscreen</span><Toggle on={f.touch} onChange={(v) => update("touch", v)} />
                  </div>
                )}
              </section>
              )}

              {/* SECTION 3 — Chassis Stock */}
              <section>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-brand">Chassis Stock</p>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-extrabold ${f.chassisStock === 0 ? "text-red-600" : f.chassisStock <= 5 ? "text-amber-600" : "text-ink"}`}>{f.chassisStock}</span>
                  <span className="text-sm text-neutral-400">units</span>
                  <button onClick={() => adjustChassis("add")} className="rounded-full bg-brand px-4 py-1.5 text-[13px] font-bold text-white hover:bg-brand-dark">+ Add</button>
                  <button onClick={() => adjustChassis("decrease")} disabled={f.chassisStock === 0} className="rounded-full border border-red-200 px-4 py-1.5 text-[13px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-40">− Decrease</button>
                  {f.chassisStock === 0 ? <span className="text-[12px] font-bold text-red-600">Out of stock</span> : f.chassisStock <= 5 ? <span className="text-[12px] font-bold text-amber-600">Low stock</span> : null}
                </div>
                {editId && <p className="mt-1 text-[11px] text-neutral-400">Stock saves immediately. Selling any config deducts 1 chassis.</p>}
              </section>
            </div>
          )}

          {tab === "Images" && (
            <div className="max-w-3xl">
              {f.images.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-neutral-600">{f.images.length} image{f.images.length > 1 ? "s" : ""} · drag to reorder</p>
                    <p className="text-[11px] text-neutral-400">First image = primary/cover</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {f.images.map((src, i) => (
                      <div
                        key={src + i}
                        draggable
                        onDragStart={() => { dragIdx.current = i; }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); if (dragIdx.current != null) moveImage(dragIdx.current, i); dragIdx.current = null; }}
                        onDragEnd={() => { dragIdx.current = null; }}
                        className={`group relative cursor-grab rounded-lg border bg-neutral-100 active:cursor-grabbing ${i === 0 ? "border-brand ring-1 ring-brand/30" : "border-black/10"}`}
                      >
                        <div className="aspect-square overflow-hidden rounded-lg">
                          <img src={src} alt={`Product image ${i + 1}`} className="h-full w-full object-contain p-1.5" />
                        </div>
                        {i === 0 && (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white shadow">Primary</span>
                        )}
                        <button type="button" onClick={() => removeImage(i)} aria-label={`Remove image ${i + 1}`} className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-[14px] font-bold text-red-600 shadow ring-1 ring-black/5 hover:bg-red-50">×</button>
                        {/* ↑/↓ reorder fallback (drag can be flaky) */}
                        <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0} aria-label="Move left" className="flex h-6 w-6 items-center justify-center rounded-md bg-white/95 text-[13px] font-bold text-ink shadow ring-1 ring-black/5 disabled:opacity-30">↑</button>
                          <span className="rounded bg-white/90 px-1.5 text-[10px] font-bold text-neutral-500 shadow ring-1 ring-black/5">{i + 1}</span>
                          <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === f.images.length - 1} aria-label="Move right" className="flex h-6 w-6 items-center justify-center rounded-md bg-white/95 text-[13px] font-bold text-ink shadow ring-1 ring-black/5 disabled:opacity-30">↓</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadImages(e.dataTransfer?.files); }}
                className={`flex aspect-[5/1] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center text-[12px] text-neutral-500 transition-colors ${dragOver ? "border-brand bg-brand-softer/40" : "border-black/15 hover:border-brand"} ${uploading ? "opacity-60" : ""}`}
              >
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={uploading} onChange={(e) => { uploadImages(e.target.files); e.target.value = ""; }} />
                {uploading ? "Uploading…" : <><span className="text-2xl">＋</span><span>Drop images here or click to upload — select multiple · JPEG / PNG / WebP, ≤ 2MB each</span></>}
              </label>
              <p className="mt-2 text-[12px] text-neutral-400">The first image is the primary thumbnail. Drag a tile, or use ↑/↓, to reorder. Saved to /public/uploads/products/.</p>

              {/* Find Images — Google image search → fetch + normalise into the gallery */}
              <div className="mt-5">
                {!showFind ? (
                  <button onClick={() => setShowFind(true)} className="rounded-full border border-brand px-4 py-2 text-[13px] font-bold text-brand hover:bg-brand-softer">
                    🔍 Find Images Online
                  </button>
                ) : (
                  <div>
                    <p className="mb-2 text-[12px] font-semibold text-neutral-600">Find Images Online</p>
                    <ImageSearch
                      defaultQuery={`${f.brand || ""} ${f.model || ""}`.trim()}
                      onClose={() => setShowFind(false)}
                      onAdd={(urls) => update("images", [...f.images, ...urls])}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "Specs" && (
            <div className="max-w-3xl space-y-7">
              <p className="text-[12px] text-neutral-400">Structured spec fields — dropdowns only.</p>
              {showField("processor") && (
                <Group title="Processor">
                  <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">Processor Family</span><select value={f.specs.family ?? ""} onChange={(e) => { updateSpec("family", e.target.value); updateSpec("procModel", ""); }} className={inputCls}><option value="">— Select —</option>{PROCESSOR_FAMILIES.map((o) => <option key={o}>{o}</option>)}</select></label>
                  <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">Processor Model</span><select value={f.specs.procModel ?? ""} onChange={(e) => updateSpec("procModel", e.target.value)} className={inputCls}><option value="">— Select —</option>{(f.specs.family ? PROCESSOR_MODELS[f.specs.family] || [] : []).map((o) => <option key={o}>{o}</option>)}</select></label>
                  <Drop ctx={ctx} label="Processor Generation" options={GENERATIONS} specKey="gen" />
                </Group>
              )}
              {/* Display — laptops/monitors/desktops. Hidden for desktop towers
                  (Workstations/Servers): those have no screen. */}
              {!["Workstations", "Servers"].includes(f.category) && (
                <Group title="Display">
                  <Drop ctx={ctx} label="Display Size" options={DISPLAY_SIZES} specKey="size" />
                  <Drop ctx={ctx} label="Resolution" options={RESOLUTIONS} specKey="res" />
                  <Drop ctx={ctx} label="Panel Type / Display Type" options={MASTER_TABLES["Panel Type"]} specKey="panel" />
                  <Drop ctx={ctx} label="Refresh Rate" options={REFRESH_RATES} specKey="refresh" />
                </Group>
              )}
              {showField("ram") && (
                <Group title="Memory & Storage">
                  <Drop ctx={ctx} label="RAM Type" options={MASTER_TABLES["RAM Type"]} specKey="ramType" />
                  <Drop ctx={ctx} label="Storage Type" options={STORAGE_TYPES} specKey="storageType" />
                  {["Laptops", "Workstations", "Desktops"].includes(f.category) && (
                    <Drop ctx={ctx} label="RAM Expandability" options={MASTER_TABLES["RAM Expandability"]} specKey="ramExpandability" />
                  )}
                </Group>
              )}
              {showField("os") && (
                <Group title="Operating System"><Drop ctx={ctx} label="OS" options={OS_OPTIONS} specKey="os" /></Group>
              )}
              {/* Chassis / Form Factor — laptops & desktops (servers & workstations
                  have their own Form Factor pickers in their hardware groups). */}
              {["Laptops", "Desktops"].includes(f.category) && (
                <Group title="Chassis Type / Form Factor" cols={1}>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Chassis Type / Form Factor</span>
                    <select value={f.specs.formFactor ?? ""} onChange={(e) => updateSpec("formFactor", e.target.value)} className={inputCls}>
                      <option value="">— Select —</option>
                      {(f.category === "Laptops" ? LAPTOP_CHASSIS : DESKTOP_CHASSIS).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                </Group>
              )}
              {f.category === "Servers" && (
                <Group title="Server Configuration">
                  <Drop ctx={ctx} label="Form Factor" options={MASTER_TABLES["Server Form Factor"]} specKey="formFactor" />
                  <Drop ctx={ctx} label="Server OS" options={SERVER_OS} specKey="serverOs" />
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Drive Bays</span>
                    <input type="number" min={0} value={f.specs.driveBays ?? ""} onChange={(e) => updateSpec("driveBays", e.target.value)} placeholder="e.g. 8" className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">RAID Support</span>
                    <input value={f.specs.raid ?? ""} onChange={(e) => updateSpec("raid", e.target.value)} placeholder="e.g. RAID 1, RAID 5, or No" className={inputCls} />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5">
                    <span className="text-sm text-neutral-700">Redundant Power</span>
                    <Toggle on={!!f.specs.redundantPower} onChange={(v) => updateSpec("redundantPower", v)} />
                  </label>
                </Group>
              )}
              {f.category === "Workstations" && (
                <Group title="Workstation Hardware">
                  <Drop ctx={ctx} label="Chassis Type" options={WORKSTATION_CHASSIS} specKey="formFactor" />
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Power Supply (PSU)</span>
                    <input value={f.specs.psu ?? ""} onChange={(e) => updateSpec("psu", e.target.value)} placeholder="e.g. 700W" className={inputCls} />
                  </label>
                </Group>
              )}
              {f.category === "Desktops" && (
                <Group title="Desktop Hardware" cols={1}>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Power Supply (PSU)</span>
                    <input value={f.specs.psu ?? ""} onChange={(e) => updateSpec("psu", e.target.value)} placeholder="e.g. 300W, 500W" className={inputCls} />
                  </label>
                </Group>
              )}
              {["Laptops", "Workstations"].includes(f.category) && (
                <Group title="Graphics" cols={1}>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">GPU (integrated or dedicated)</span>
                    <input value={f.specs.gpu ?? ""} onChange={(e) => updateSpec("gpu", e.target.value)} placeholder="e.g. NVIDIA Quadro P2000 / Intel Iris Xe" className={inputCls} />
                  </label>
                </Group>
              )}
              {f.category === "Monitors" && (
                <Group title="Monitor Specs">
                  <Drop ctx={ctx} label="Aspect Ratio" options={MASTER_TABLES["Aspect Ratio"]} specKey="aspectRatio" />
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Brightness (nits)</span>
                    <input type="number" min={0} value={f.specs.brightness ?? ""} onChange={(e) => updateSpec("brightness", e.target.value)} placeholder="e.g. 350" className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Response Time (ms)</span>
                    <input type="number" min={0} value={f.specs.responseTime ?? ""} onChange={(e) => updateSpec("responseTime", e.target.value)} placeholder="e.g. 5" className={inputCls} />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5">
                    <span className="text-sm text-neutral-700">HDR Support</span>
                    <Toggle on={!!f.specs.hdr} onChange={(v) => updateSpec("hdr", v)} />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5">
                    <span className="text-sm text-neutral-700">VESA Mount</span>
                    <Toggle on={!!f.specs.vesaMount} onChange={(v) => updateSpec("vesaMount", v)} />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5">
                    <span className="text-sm text-neutral-700">Built-in Speakers</span>
                    <Toggle on={!!f.specs.builtInSpeakers} onChange={(v) => updateSpec("builtInSpeakers", v)} />
                  </label>
                </Group>
              )}
              {f.category === "Laptops" && (
                <Group title="Laptop Features">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Battery Health</span>
                    <input value={f.specs.batteryHealth ?? ""} onChange={(e) => updateSpec("batteryHealth", e.target.value)} placeholder='e.g. 85% or "Good"' className={inputCls} />
                  </label>
                  <div className="grid gap-2">
                    <label className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5">
                      <span className="text-sm text-neutral-700">Backlit Keyboard</span>
                      <Toggle on={!!f.specs.backlit} onChange={(v) => updateSpec("backlit", v)} />
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5">
                      <span className="text-sm text-neutral-700">Webcam</span>
                      <Toggle on={!!f.specs.webcam} onChange={(v) => updateSpec("webcam", v)} />
                    </label>
                  </div>
                </Group>
              )}
              {f.category === "Laptops" && (
                <Group title="Battery"><Drop ctx={ctx} label="Battery Capacity" options={BATTERY_CAPACITIES} specKey="batCap" /><Drop ctx={ctx} label="Battery Life" options={BATTERY_LIVES} specKey="batLife" /></Group>
              )}
              {["Laptops", "Monitors"].includes(f.category) && (
                <Group title="Physical" cols={1}>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Weight</span>
                    <input value={f.specs.weight ?? ""} onChange={(e) => updateSpec("weight", e.target.value)} placeholder="e.g. 1.4 kg" className={inputCls} />
                  </label>
                </Group>
              )}
              <Group title="Ports" cols={1}><PortsGrid value={f.ports} onChange={(v) => update("ports", v)} /></Group>
              <Group title="Warranty"><Drop ctx={ctx} label="Warranty Period" options={WARRANTY_PERIODS} specKey="warranty" /></Group>
            </div>
          )}

          {tab === "Inspection" && (
            <div className="max-w-2xl space-y-2">
              {INSPECTION_ROWS.map((r) => {
                const na = (f.specs.na || []).includes(r);
                return (
                  <div key={r} className="flex items-center gap-3 rounded-lg border border-black/10 px-3 py-2">
                    <span className="w-32 shrink-0 text-sm font-semibold text-ink">{r}</span>
                    <input disabled={na} value={f.specs[`insp_${r}`] ?? ""} onChange={(e) => updateSpec(`insp_${r}`, e.target.value)} className={`${inputCls} disabled:opacity-40`} placeholder="Condition text…" />
                    <label className="flex shrink-0 items-center gap-1.5 text-[12px] text-neutral-500"><input type="checkbox" checked={na} onChange={() => updateSpec("na", na ? (f.specs.na || []).filter((x) => x !== r) : [...(f.specs.na || []), r])} className="accent-brand" />N/A</label>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "Tags" && (
            <div className="max-w-2xl">
              <p className="mb-2 text-[12px] font-semibold text-neutral-600">Tags</p>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map((t) => <button key={t} onClick={() => toggleArr("tags", t)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${f.tags.includes(t) ? "bg-brand text-white" : "border border-black/10 text-ink hover:border-brand"}`}>{t}</button>)}
              </div>
              {f.tags.includes("Flash Sale") && (
                <div className="mt-5 grid gap-4 rounded-lg bg-[#FBEAEA] p-4 sm:grid-cols-2">
                  <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">Sale Price (₹)</span><input type="number" value={f.salePrice} onChange={(e) => update("salePrice", e.target.value)} className={inputCls} placeholder="Lower than listed price" /></label>
                  <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">Sale End Date</span><input type="datetime-local" value={f.saleEnd} onChange={(e) => update("saleEnd", e.target.value)} className={inputCls} /></label>
                </div>
              )}
            </div>
          )}

          {tab === "SEO" && (
            <div className="grid max-w-2xl gap-4">
              <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">Meta Title</span><input value={f.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} className={inputCls} /></label>
              <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">Meta Description</span><textarea value={f.metaDesc} onChange={(e) => update("metaDesc", e.target.value)} rows={3} className={inputCls} /></label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
