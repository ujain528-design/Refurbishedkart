"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, Toggle, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import {
  MASTER_TABLES, PROCESSOR_FAMILIES, PROCESSOR_MODELS, GENERATIONS, DISPLAY_SIZES, RESOLUTIONS,
  PANEL_TYPES, REFRESH_RATES, STORAGE_TYPES, OS_OPTIONS, BATTERY_CAPACITIES, BATTERY_LIVES,
  WEIGHTS, WARRANTY_PERIODS, DATA_WIPE_STANDARDS,
} from "@/lib/admin-data";
import { CATEGORY_SLUGS } from "@/lib/data";
import PortBuilder from "@/components/admin/PortBuilder";

const TABS = ["Basic Info", "Pricing & Variants", "Images", "Specs", "Inspection", "Tags", "SEO"];
const RAM_TIERS = [4, 8, 16, 32, 64];
const SSD_TIERS = ["256GB", "512GB", "1TB", "2TB"];
const ALL_TAGS = ["Bestseller", "Flash Sale", "New Arrival", "Best for Students", "Recommended", "Best for WFH"];
const INSPECTION_ROWS = ["Display", "Keyboard", "Trackpad", "Battery", "Ports", "Speakers", "Webcam", "Hinges", "Body / Chassis", "Storage", "RAM", "Cooling", "Data Wipe", "BIOS"];
const STORAGE_KEY = "admin_product_draft";

const EMPTY = {
  brand: "", model: "", category: "Laptops", status: "Draft", description: "",
  listedPrice: "", ram: [8], ssd: ["256GB"], onboardRam: false, ramExpandable: true, touch: false,
  specs: {}, ports: {}, tags: [], salePrice: "", saleEnd: "", metaTitle: "", metaDesc: "",
};

const VALIDATORS = {
  brand: (v) => (v ? "" : "Brand is required"),
  model: (v) => (v.trim() ? "" : "Model is required"),
  category: (v) => (v ? "" : "Category is required"),
  description: (v) => (v.trim().length >= 100 ? "" : `Description needs ${100 - v.trim().length} more characters`),
  listedPrice: (v) => (Number(v) > 0 ? "" : "Listed price must be greater than 0"),
};
const FIELD_TAB = { brand: "Basic Info", model: "Basic Info", category: "Basic Info", description: "Basic Info", listedPrice: "Pricing & Variants" };

/* ── Module-scope components (stable identity → inputs keep focus) ── */
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
  const [tab, setTab] = useState(TABS[0]);
  const [f, setF] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [dirty, setDirty] = useState(false);
  const [restore, setRestore] = useState(null);
  const debounce = useRef(null);
  const hydrated = useRef(false);

  const errors = Object.fromEntries(Object.keys(VALIDATORS).map((k) => [k, VALIDATORS[k](f[k] ?? "")]));
  const isValid = Object.values(errors).every((e) => !e);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const saved = JSON.parse(raw); setRestore({ savedAt: saved.__savedAt, data: saved }); }
    } catch {}
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current || !dirty) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...f, __savedAt: new Date().toISOString() })); } catch {}
    }, 500);
    return () => clearTimeout(debounce.current);
  }, [f, dirty]);

  useEffect(() => {
    const handler = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const flushSave = () => { if (dirty) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...f, __savedAt: new Date().toISOString() })); } catch {} } };
  const update = (key, value) => { setF((s) => ({ ...s, [key]: value })); setDirty(true); };
  const updateSpec = (key, value) => { setF((s) => ({ ...s, specs: { ...s.specs, [key]: value } })); setDirty(true); };
  const blur = (key) => setTouched((t) => ({ ...t, [key]: true }));
  const toggleArr = (key, v) => update(key, f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v]);
  const switchTab = (t) => { flushSave(); setTab(t); };

  const ctx = { f, errors, touched, update, updateSpec, blur };

  const restoreDraft = () => { const { __savedAt, ...data } = restore.data; setF({ ...EMPTY, ...data }); setDirty(true); setRestore(null); toast("Draft restored"); };
  const startFresh = () => { localStorage.removeItem(STORAGE_KEY); setRestore(null); };
  const clearAndLeave = (status) => { localStorage.removeItem(STORAGE_KEY); setDirty(false); toast(`Product saved as ${status}`); setTimeout(() => router.push("/admin/products"), 50); };

  const save = (status) => {
    flushSave();
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
      toast("Fix the highlighted fields before publishing", "error");
      return;
    }
    clearAndLeave(status);
  };

  const leaveEditor = () => { if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return; router.push("/admin/products"); };

  return (
    <div>
      {restore && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-sm font-semibold text-amber-800">You have an unsaved draft from {new Date(restore.savedAt).toLocaleString("en-IN")}. Restore it?</span>
          <div className="ml-auto flex gap-2">
            <button onClick={restoreDraft} className="rounded-full bg-brand px-4 py-1.5 text-[13px] font-bold text-white">Restore Draft</button>
            <button onClick={startFresh} className="rounded-full border border-black/10 px-4 py-1.5 text-[13px] font-bold text-ink">Start Fresh</button>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Add New Product{dirty && <span className="ml-2 text-[12px] font-semibold text-amber-600">● unsaved</span>}</h1>
          <button onClick={leaveEditor} className="mt-1 text-[13px] font-semibold text-neutral-400 hover:text-ink">← Back to products</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast("Opening storefront preview…")} className={btnGhost}>Preview</button>
          <button onClick={() => save("Draft")} className={btnGhost}>Save as Draft</button>
          <button onClick={() => save("Published")} disabled={!isValid} className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-40`} title={!isValid ? "Fill all required fields" : ""}>Publish</button>
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
            <div className="max-w-2xl space-y-6">
              <div className="max-w-[220px]"><VField ctx={ctx} k="listedPrice" label="Listed Price (₹)" type="number" min={0} placeholder="27499" hint="Price of the default configuration" /></div>
              <div>
                <p className="mb-2 text-[12px] font-semibold text-neutral-600">Available RAM (with stock per tier)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {RAM_TIERS.map((r) => (
                    <label key={r} className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm">
                      <input type="checkbox" checked={f.ram.includes(r)} onChange={() => toggleArr("ram", r)} className="accent-brand" />{r}GB
                      {f.ram.includes(r) && <input type="number" placeholder="stock" className="ml-auto w-16 rounded border border-black/10 px-1.5 py-0.5 text-[12px]" />}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[12px] font-semibold text-neutral-600">Available SSD</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SSD_TIERS.map((s) => <label key={s} className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm"><input type="checkbox" checked={f.ssd.includes(s)} onChange={() => toggleArr("ssd", s)} className="accent-brand" />{s}</label>)}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5"><span className="text-sm">Onboard RAM</span><Toggle on={f.onboardRam} onChange={(v) => update("onboardRam", v)} /></div>
                <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5"><span className="text-sm">RAM Expandable</span><Toggle on={f.ramExpandable} onChange={(v) => update("ramExpandable", v)} /></div>
                <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5"><span className="text-sm">Touchscreen</span><Toggle on={f.touch} onChange={(v) => update("touch", v)} /></div>
              </div>
            </div>
          )}

          {tab === "Images" && (
            <div className="max-w-2xl">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/15 text-center text-[11px] text-neutral-400 hover:border-brand">
                    {i === 0 ? <><span className="text-xl">＋</span><span>Primary</span></> : <span className="text-xl">＋</span>}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-neutral-400">Upload up to 6 images · drag to reorder · click to set primary or delete.</p>
            </div>
          )}

          {tab === "Specs" && (
            <div className="max-w-3xl space-y-7">
              <p className="text-[12px] text-neutral-400">All spec fields are structured — dropdowns or toggles only, no free text.</p>
              <Group title="Processor">
                <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">Processor Family</span><select value={f.specs.family ?? ""} onChange={(e) => { updateSpec("family", e.target.value); updateSpec("model", ""); }} className={inputCls}><option value="">— Select —</option>{PROCESSOR_FAMILIES.map((o) => <option key={o}>{o}</option>)}</select></label>
                <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">Processor Model</span><select value={f.specs.model ?? ""} onChange={(e) => updateSpec("model", e.target.value)} className={inputCls}><option value="">— Select —</option>{(f.specs.family ? PROCESSOR_MODELS[f.specs.family] || [] : []).map((o) => <option key={o}>{o}</option>)}</select></label>
                <Drop ctx={ctx} label="Processor Generation" options={GENERATIONS} specKey="gen" />
              </Group>
              <Group title="Display">
                <Drop ctx={ctx} label="Display Size" options={DISPLAY_SIZES} specKey="size" />
                <Drop ctx={ctx} label="Resolution" options={RESOLUTIONS} specKey="res" />
                <Drop ctx={ctx} label="Panel Type" options={PANEL_TYPES} specKey="panel" />
                <Drop ctx={ctx} label="Refresh Rate" options={REFRESH_RATES} specKey="refresh" />
                <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5"><span className="text-sm">Touchscreen</span><Toggle on={!!f.specs.touch} onChange={(v) => updateSpec("touch", v)} /></div>
              </Group>
              <Group title="Memory"><Drop ctx={ctx} label="RAM Type" options={MASTER_TABLES["RAM Type"]} specKey="ramType" /></Group>
              <Group title="Storage"><Drop ctx={ctx} label="Storage Type" options={STORAGE_TYPES} specKey="storageType" /></Group>
              <Group title="Operating System"><Drop ctx={ctx} label="OS" options={OS_OPTIONS} specKey="os" /></Group>
              <Group title="Battery"><Drop ctx={ctx} label="Battery Capacity" options={BATTERY_CAPACITIES} specKey="batCap" /><Drop ctx={ctx} label="Battery Life (approx)" options={BATTERY_LIVES} specKey="batLife" /></Group>
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
