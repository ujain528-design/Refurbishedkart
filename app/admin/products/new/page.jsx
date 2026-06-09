"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, Toggle, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import {
  MASTER_TABLES, PROCESSOR_FAMILIES, PROCESSOR_MODELS, GENERATIONS, DISPLAY_SIZES, RESOLUTIONS,
  PANEL_TYPES, REFRESH_RATES, STORAGE_TYPES, OS_OPTIONS, BATTERY_CAPACITIES, BATTERY_LIVES,
  WEIGHTS, WARRANTY_PERIODS, DATA_WIPE_STANDARDS,
} from "@/lib/admin-data";
import { CATEGORY_SLUGS } from "@/lib/data";
import PortBuilder from "@/components/admin/PortBuilder";
import { adminGetProduct, adminCreateProduct, adminUpdateProduct, adminUpdateStock, adminGetPricingConfig } from "@/lib/api";
import { calculateDeviceCost, calculateUpgradePrice, priceForExtraCapacity, getSsdPrice } from "@/lib/server/pricing-core";

const TABS = ["Basic Info", "Pricing & Variants", "Images", "Specs", "Inspection", "Tags", "SEO"];
const RAM_CAPS = ["4GB", "8GB", "16GB", "32GB", "64GB"];
const RAM_TYPES = MASTER_TABLES["RAM Type"];
const SSD_CAPS = ["256GB", "512GB", "1TB", "2TB"];
const ALL_TAGS = ["Bestseller", "Flash Sale", "New Arrival", "Best for Students", "Recommended", "Best for WFH"];
const INSPECTION_ROWS = ["Display", "Keyboard", "Trackpad", "Battery", "Ports", "Speakers", "Webcam", "Hinges", "Body / Chassis", "Storage", "RAM", "Cooling", "Data Wipe", "BIOS"];

const TAG_SLUG = { Bestseller: "bestseller", "Flash Sale": "flash-sale", "New Arrival": "new-arrival", "Best for Students": "student", Recommended: "recommended", "Best for WFH": "best-for-wfh" };
const SLUG_TAG = Object.fromEntries(Object.entries(TAG_SLUG).map(([k, v]) => [v, k]));

const EMPTY = {
  brand: "", model: "", category: "Laptops", status: "Draft", description: "",
  listedPrice: "", chassisStock: 0,
  defaultRam: { capacity: "8GB", type: "DDR4", isOnboard: false, cost: 0 },
  defaultSsd: { capacity: "256GB", cost: 0 },
  configs: [], touch: false,
  specs: {}, ports: {}, images: [], tags: [], salePrice: "", saleEnd: "", metaTitle: "", metaDesc: "",
};

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
    listedPrice: p.listedPrice ?? p.price ?? "",
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
    specs: { gen: a.gen || "", ramType: a.ramType || "", os: a.os || "", warranty: a.warranty || "", size: a.screen || "", ...(p.editorSpecs || {}) },
    ports: p.ports || {},
    images: p.images || (p.image ? [p.image] : []),
    tags: (p.tags || []).map((s) => SLUG_TAG[s] || s),
    salePrice: p.salePrice ?? "",
    saleEnd: p.saleEnd || "",
    metaTitle: p.metaTitle || "",
    metaDesc: p.metaDesc || "",
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
    defaultRam: { capacity: f.defaultRam.capacity, type: f.defaultRam.type, isOnboard: !!f.defaultRam.isOnboard, cost: Number(f.defaultRam.cost) || 0 },
    defaultSsd: { capacity: f.defaultSsd.capacity, cost: Number(f.defaultSsd.cost) || 0 },
    description: f.description,
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
    images: f.images,
    editorSpecs: f.specs, // preserve the editor's structured spec object
    ports: f.ports,
    attrs: {
      ...a,
      ramType: f.specs.ramType || a.ramType,
      os: f.specs.os || a.os,
      warranty: f.specs.warranty || a.warranty,
      gen: f.specs.gen || a.gen,
      screen: f.specs.size || a.screen,
      touchscreen: f.touch,
    },
  };
}

const VALIDATORS = {
  brand: (v) => (v ? "" : "Brand is required"),
  model: (v) => (v.trim() ? "" : "Model is required"),
  category: (v) => (v ? "" : "Category is required"),
  description: (v) => (v.trim().length >= 100 ? "" : `Description needs ${100 - v.trim().length} more characters`),
  listedPrice: (v) => (Number(v) > 0 ? "" : "Listed price must be greater than 0"),
};
const FIELD_TAB = { brand: "Basic Info", model: "Basic Info", category: "Basic Info", description: "Basic Info", listedPrice: "Pricing & Variants" };

function Group({ title, children, cols = 2 }) {
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-brand">{title}</h3>
      <div className={`grid gap-4 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>{children}</div>
    </div>
  );
}

function VField({ ctx, k, label, type = "text", placeholder, textarea, options, min, hint }) {
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
        <textarea value={f[k]} onChange={(e) => update(k, e.target.value)} onBlur={() => blur(k)} rows={5} placeholder={placeholder} className={`${inputCls} ${ring}`} />
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
        try { const p = await adminGetProduct(editId); if (p) { origRef.current = p; base = dbToForm(p); } }
        catch { toast("Couldn't load product", "error"); }
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

  const update = (key, value) => { setF((s) => ({ ...s, [key]: value })); setDirty(true); };
  const updateSpec = (key, value) => { setF((s) => ({ ...s, specs: { ...s.specs, [key]: value } })); setDirty(true); };
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
              <div className="sm:col-span-2"><VField ctx={ctx} k="description" label={`Description (${f.description.trim().length}/100 min)`} textarea placeholder="Describe the device, condition, and what's included…" /></div>
            </div>
          )}

          {tab === "Pricing & Variants" && (
            <div className="max-w-3xl space-y-8">
              {/* SECTION 1 — Default Configuration */}
              <section>
                <p className="mb-3 text-[12px] font-bold uppercase tracking-wide text-brand">Default Configuration</p>
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
                <div className="mt-4 grid items-end gap-4 sm:grid-cols-2">
                  <div className="max-w-[240px]"><VField ctx={ctx} k="listedPrice" label="Listed Price ₹ (default config)" type="number" min={0} placeholder="27499" hint="Price buyers pay for the default config" /></div>
                  <div className="rounded-lg bg-brand-softer/50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Device cost (calculated)</p>
                    <p className="mt-1 text-xl font-extrabold text-brand">{"₹" + (Number(deviceCost) || 0).toLocaleString("en-IN")}</p>
                    <p className="text-[11px] text-neutral-400">Listed − RAM cost − SSD cost</p>
                  </div>
                </div>
              </section>

              {/* SECTION 2 — Additional Configurations */}
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
                        <div className="pb-2.5"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">+ Cost</span><span className="text-[13px] font-semibold text-neutral-600">{"₹" + (configAdditional(c) || 0).toLocaleString("en-IN")}</span></div>
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
                <div className="mt-3 flex max-w-xs items-center justify-between rounded-lg border border-black/10 px-3 py-2.5">
                  <span className="text-sm">Touchscreen</span><Toggle on={f.touch} onChange={(v) => update("touch", v)} />
                </div>
              </section>

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
            <div className="max-w-2xl">
              {f.images.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-[12px] font-semibold text-neutral-600">Current images</p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {f.images.map((src, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-black/10 bg-neutral-100">
                        <img src={src} alt="" className="h-full w-full object-contain p-1" />
                        <button onClick={() => update("images", f.images.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-[11px] font-bold text-red-600 shadow">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/15 text-center text-[11px] text-neutral-400 hover:border-brand">
                    <span className="text-xl">＋</span>{i === 0 && <span>Primary</span>}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-neutral-400">Upload wiring (POST /api/admin/upload) is pending — current images above are editable now.</p>
            </div>
          )}

          {tab === "Specs" && (
            <div className="max-w-3xl space-y-7">
              <p className="text-[12px] text-neutral-400">Structured spec fields — dropdowns only.</p>
              <Group title="Processor">
                <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">Processor Family</span><select value={f.specs.family ?? ""} onChange={(e) => { updateSpec("family", e.target.value); updateSpec("procModel", ""); }} className={inputCls}><option value="">— Select —</option>{PROCESSOR_FAMILIES.map((o) => <option key={o}>{o}</option>)}</select></label>
                <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">Processor Model</span><select value={f.specs.procModel ?? ""} onChange={(e) => updateSpec("procModel", e.target.value)} className={inputCls}><option value="">— Select —</option>{(f.specs.family ? PROCESSOR_MODELS[f.specs.family] || [] : []).map((o) => <option key={o}>{o}</option>)}</select></label>
                <Drop ctx={ctx} label="Processor Generation" options={GENERATIONS} specKey="gen" />
              </Group>
              <Group title="Display">
                <Drop ctx={ctx} label="Display Size" options={DISPLAY_SIZES} specKey="size" />
                <Drop ctx={ctx} label="Resolution" options={RESOLUTIONS} specKey="res" />
                <Drop ctx={ctx} label="Panel Type" options={PANEL_TYPES} specKey="panel" />
                <Drop ctx={ctx} label="Refresh Rate" options={REFRESH_RATES} specKey="refresh" />
              </Group>
              <Group title="Memory & Storage"><Drop ctx={ctx} label="RAM Type" options={MASTER_TABLES["RAM Type"]} specKey="ramType" /><Drop ctx={ctx} label="Storage Type" options={STORAGE_TYPES} specKey="storageType" /></Group>
              <Group title="Operating System"><Drop ctx={ctx} label="OS" options={OS_OPTIONS} specKey="os" /></Group>
              <Group title="Battery"><Drop ctx={ctx} label="Battery Capacity" options={BATTERY_CAPACITIES} specKey="batCap" /><Drop ctx={ctx} label="Battery Life" options={BATTERY_LIVES} specKey="batLife" /></Group>
              <Group title="Physical"><Drop ctx={ctx} label="Weight" options={WEIGHTS} specKey="weight" /></Group>
              <Group title="Ports" cols={1}><PortBuilder value={f.ports} onChange={(v) => update("ports", v)} /></Group>
              <Group title="Warranty"><Drop ctx={ctx} label="Warranty Period" options={WARRANTY_PERIODS} specKey="warranty" /><Drop ctx={ctx} label="Data Wipe Standard" options={DATA_WIPE_STANDARDS} specKey="dataWipe" /></Group>
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
