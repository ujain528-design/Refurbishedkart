"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, Field, Toggle, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import {
  MASTER_TABLES, PROCESSOR_FAMILIES, PROCESSOR_MODELS, GENERATIONS, DISPLAY_SIZES, RESOLUTIONS,
  PANEL_TYPES, REFRESH_RATES, STORAGE_TYPES, OS_OPTIONS, BATTERY_CAPACITIES, BATTERY_LIVES,
  WEIGHTS, WARRANTY_PERIODS, DATA_WIPE_STANDARDS,
} from "@/lib/admin-data";
import { CATEGORY_SLUGS } from "@/lib/data";
import PortBuilder from "@/components/admin/PortBuilder";

const Drop = ({ label, options, value, onChange }) => (
  <Field label={label}>
    <select value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} className={inputCls}>
      <option value="">— Select —</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </Field>
);
const Group = ({ title, children, cols = 2 }) => (
  <div>
    <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-brand">{title}</h3>
    <div className={`grid gap-4 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>{children}</div>
  </div>
);

const TABS = ["Basic Info", "Pricing & Variants", "Images", "Specs", "Inspection", "Tags", "SEO"];
const RAM_TIERS = [4, 8, 16, 32, 64];
const SSD_TIERS = ["256GB", "512GB", "1TB", "2TB"];
const ALL_TAGS = ["Bestseller", "Flash Sale", "New Arrival", "Best for Students", "Recommended", "Best for WFH"];
const INSPECTION_ROWS = ["Display", "Keyboard", "Trackpad", "Battery", "Ports", "Speakers", "Webcam", "Hinges", "Body / Chassis", "Storage", "RAM", "Cooling", "Data Wipe", "BIOS"];

export default function ProductEditor() {
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState(TABS[0]);
  const [desc, setDesc] = useState("");
  const [ram, setRam] = useState(new Set([8]));
  const [ssd, setSsd] = useState(new Set(["256GB"]));
  const [tags, setTags] = useState(new Set());
  const [naRows, setNaRows] = useState(new Set());
  const [onboardRam, setOnboardRam] = useState(false);
  const [ramExpandable, setRamExpandable] = useState(true);
  const [touch, setTouch] = useState(false);
  // specs tab structured state
  const [family, setFamily] = useState("");
  const [model, setModel] = useState("");
  const [touchSpec, setTouchSpec] = useState(false);

  const toggleSet = (setter) => (v) => setter((s) => { const n = new Set(s); n.has(v) ? n.delete(v) : n.add(v); return n; });

  const save = (status) => {
    if (desc.length < 100) { toast("Description must be at least 100 characters", "error"); setTab("Basic Info"); return; }
    toast(`Product saved as ${status}`);
    router.push("/admin/products");
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Add New Product</h1>
          <button onClick={() => router.push("/admin/products")} className="mt-1 text-[13px] font-semibold text-neutral-400 hover:text-ink">← Back to products</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast("Opening storefront preview…")} className={btnGhost}>Preview</button>
          <button onClick={() => save("Draft")} className={btnGhost}>Save as Draft</button>
          <button onClick={() => save("Published")} className={btnPrimary}>Publish</button>
        </div>
      </div>

      <div className="rounded-card border border-black/5 bg-white p-6 shadow-card">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        <div className="mt-6">
          {tab === "Basic Info" && (
            <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
              <Field label="Brand"><select className={inputCls}>{MASTER_TABLES.Brands.map((b) => <option key={b}>{b}</option>)}</select></Field>
              <Field label="Model"><input className={inputCls} placeholder="ThinkPad T14" /></Field>
              <Field label="Category"><select className={inputCls}>{Object.values(CATEGORY_SLUGS).map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Status"><select className={inputCls}><option>Draft</option><option>Active</option><option>Out of Stock</option></select></Field>
              <div className="sm:col-span-2">
                <Field label={`Description (${desc.length}/100 min)`} hint="Rich text · minimum 100 characters enforced">
                  <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} className={`${inputCls} ${desc.length > 0 && desc.length < 100 ? "border-red-400" : ""}`} placeholder="Describe the device, condition, and what's included…" />
                </Field>
              </div>
            </div>
          )}

          {tab === "Pricing & Variants" && (
            <div className="max-w-2xl space-y-6">
              <Field label="Listed Price (₹)" hint="Price of the default configuration"><input type="number" className={`${inputCls} max-w-[200px]`} placeholder="27499" /></Field>
              <div>
                <p className="mb-2 text-[12px] font-semibold text-neutral-600">Available RAM (with stock per tier)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {RAM_TIERS.map((r) => (
                    <label key={r} className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm">
                      <input type="checkbox" checked={ram.has(r)} onChange={() => toggleSet(setRam)(r)} className="accent-brand" />
                      {r}GB
                      {ram.has(r) && <input type="number" placeholder="stock" className="ml-auto w-16 rounded border border-black/10 px-1.5 py-0.5 text-[12px]" />}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[12px] font-semibold text-neutral-600">Available SSD (with stock per tier)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SSD_TIERS.map((s) => (
                    <label key={s} className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm">
                      <input type="checkbox" checked={ssd.has(s)} onChange={() => toggleSet(setSsd)(s)} className="accent-brand" />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5"><span className="text-sm">Onboard RAM</span><Toggle on={onboardRam} onChange={setOnboardRam} /></div>
                <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5"><span className="text-sm">RAM Expandable</span><Toggle on={ramExpandable} onChange={setRamExpandable} /></div>
                <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5"><span className="text-sm">Touchscreen</span><Toggle on={touch} onChange={setTouch} /></div>
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
              <p className="text-[12px] text-neutral-400">All spec fields are structured — dropdowns or toggles only, no free text. Values come from Master Data.</p>

              <Group title="Processor">
                <Drop label="Processor Family" options={PROCESSOR_FAMILIES} value={family} onChange={(v) => { setFamily(v); setModel(""); }} />
                <Drop label="Processor Model" options={family ? (PROCESSOR_MODELS[family] || []) : []} value={model} onChange={setModel} />
                <Drop label="Processor Generation" options={GENERATIONS} />
              </Group>

              <Group title="Display">
                <Drop label="Display Size" options={DISPLAY_SIZES} />
                <Drop label="Resolution" options={RESOLUTIONS} />
                <Drop label="Panel Type" options={PANEL_TYPES} />
                <Drop label="Refresh Rate" options={REFRESH_RATES} />
                <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5"><span className="text-sm">Touchscreen</span><Toggle on={touchSpec} onChange={setTouchSpec} /></div>
              </Group>

              <Group title="Memory">
                <Drop label="RAM Type" options={MASTER_TABLES["RAM Type"]} />
              </Group>

              <Group title="Storage">
                <Drop label="Storage Type" options={STORAGE_TYPES} />
              </Group>

              <Group title="Operating System">
                <Drop label="OS" options={OS_OPTIONS} />
              </Group>

              <Group title="Battery">
                <Drop label="Battery Capacity" options={BATTERY_CAPACITIES} />
                <Drop label="Battery Life (approx)" options={BATTERY_LIVES} />
              </Group>

              <Group title="Physical">
                <Drop label="Weight" options={WEIGHTS} />
              </Group>

              <Group title="Ports" cols={1}>
                <PortBuilder />
              </Group>

              <Group title="Warranty">
                <Drop label="Warranty Period" options={WARRANTY_PERIODS} />
                <Drop label="Data Wipe Standard" options={DATA_WIPE_STANDARDS} />
              </Group>
            </div>
          )}

          {tab === "Inspection" && (
            <div className="max-w-2xl space-y-2">
              {INSPECTION_ROWS.map((r) => (
                <div key={r} className="flex items-center gap-3 rounded-lg border border-black/10 px-3 py-2">
                  <span className="w-32 shrink-0 text-sm font-semibold text-ink">{r}</span>
                  <input disabled={naRows.has(r)} className={`${inputCls} disabled:opacity-40`} placeholder="Condition text…" />
                  <label className="flex shrink-0 items-center gap-1.5 text-[12px] text-neutral-500"><input type="checkbox" checked={naRows.has(r)} onChange={() => toggleSet(setNaRows)(r)} className="accent-brand" />N/A</label>
                </div>
              ))}
            </div>
          )}

          {tab === "Tags" && (
            <div className="max-w-2xl">
              <p className="mb-2 text-[12px] font-semibold text-neutral-600">Tags</p>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map((t) => (
                  <button key={t} onClick={() => toggleSet(setTags)(t)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${tags.has(t) ? "bg-brand text-white" : "border border-black/10 text-ink hover:border-brand"}`}>{t}</button>
                ))}
              </div>
              {tags.has("Flash Sale") && (
                <div className="mt-5 grid gap-4 rounded-lg bg-[#FBEAEA] p-4 sm:grid-cols-2">
                  <Field label="Sale Price (₹)"><input type="number" className={inputCls} placeholder="Lower than listed price" /></Field>
                  <Field label="Sale End Date"><input type="datetime-local" className={inputCls} /></Field>
                </div>
              )}
            </div>
          )}

          {tab === "SEO" && (
            <div className="grid max-w-2xl gap-4">
              <Field label="Meta Title"><input className={inputCls} /></Field>
              <Field label="Meta Description"><textarea rows={3} className={inputCls} /></Field>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
