"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader, Tabs, Toggle, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { MASTER_TABLES, SPEC_FIELDS, CATEGORY_SPEC_SCHEMA } from "@/lib/admin-data";
import { CATEGORY_SLUGS } from "@/lib/data";
import { adminGetMasterData, adminAddMasterDataValue, adminToggleMasterDataValue } from "@/lib/api";

const CORE_FIELDS = ["brand", "model", "price", "category", "status", "description"];

function MasterTables() {
  const toast = useToast();
  const tables = Object.keys(MASTER_TABLES);
  const [active, setActive] = useState(tables[0]);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [newVal, setNewVal] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    adminGetMasterData(active).then((r) => { setRows(r); setStatus("ready"); }).catch(() => setStatus("error"));
  }, [active]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newVal.trim()) return;
    setBusy(true);
    try { setRows(await adminAddMasterDataValue(active, newVal.trim())); setNewVal(""); toast("Value added"); }
    catch (e) { toast(e.message || "Add failed", "error"); }
    finally { setBusy(false); }
  };
  const toggle = async (row) => {
    try { setRows(await adminToggleMasterDataValue(active, row.id, !row.active)); }
    catch (e) { toast(e.message || "Update failed", "error"); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="rounded-card border border-black/5 bg-white p-2 shadow-card">
        {tables.map((t) => (
          <button key={t} onClick={() => setActive(t)} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${active === t ? "bg-brand text-white" : "text-neutral-600 hover:bg-brand-softer hover:text-brand"}`}>{t}</button>
        ))}
      </div>
      <div className="rounded-card border border-black/5 bg-white shadow-card">
        <div className="border-b border-black/5 px-5 py-3.5"><h2 className="text-sm font-bold text-ink">{active}</h2></div>
        {status === "loading" ? (
          <p className="px-5 py-10 text-center text-sm text-neutral-400">Loading…</p>
        ) : status === "error" ? (
          <div className="px-5 py-10 text-center"><p className="text-sm text-neutral-500">Couldn't load values.</p><button onClick={load} className="mt-3 rounded-full bg-brand px-5 py-2 text-[13px] font-bold text-white">Retry</button></div>
        ) : (
          <div className="divide-y divide-black/5">
            {rows.map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className={`flex-1 text-sm ${v.active ? "text-ink" : "text-neutral-400 line-through"}`}>{v.value}</span>
                <Toggle on={v.active} onChange={() => toggle(v)} />
              </div>
            ))}
            {rows.length === 0 && <p className="px-5 py-8 text-center text-sm text-neutral-400">No values.</p>}
          </div>
        )}
        <div className="flex gap-2 border-t border-black/5 p-3">
          <input value={newVal} onChange={(e) => setNewVal(e.target.value)} placeholder={`New ${active} value…`} className={inputCls} />
          <button onClick={add} disabled={busy} className={btnPrimary}>{busy ? "…" : "Add"}</button>
        </div>
      </div>
    </div>
  );
}

function CategorySpecSchema() {
  const toast = useToast();
  const cats = Object.values(CATEGORY_SLUGS);
  const [cat, setCat] = useState(cats[0]);
  const [adding, setAdding] = useState(false);
  // schema[cat] = [{ key, enabled, required }]
  const [schema, setSchema] = useState(() =>
    Object.fromEntries(cats.map((c) => [c, Object.keys(SPEC_FIELDS).map((k) => ({ key: k, enabled: CATEGORY_SPEC_SCHEMA[c]?.includes(k) ?? false, required: ["processor", "warranty"].includes(k) && (CATEGORY_SPEC_SCHEMA[c]?.includes(k) ?? false) }))]))
  );
  const rows = schema[cat];
  const upd = (key, patch) => setSchema((s) => ({ ...s, [cat]: s[cat].map((r) => r.key === key ? { ...r, ...patch } : r) }));

  return (
    <div>
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800">
        <span className="font-bold">Preview only.</span> Per-category schema editing isn&apos;t saved yet — toggles here reset on reload and don&apos;t affect the live editor. Full schema management is coming soon.
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${cat === c ? "bg-brand text-white" : "border border-black/10 text-ink"}`}>{c}</button>
        ))}
        <button onClick={() => setAdding(true)} className={`${btnPrimary} ml-auto opacity-60`}>+ Add Custom Field</button>
      </div>

      <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3">⠿</th><th className="px-3 py-3">Spec Field</th><th className="px-3 py-3">Enabled</th><th className="px-3 py-3">Required</th><th className="px-3 py-3">Type</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const meta = SPEC_FIELDS[r.key] || { label: r.key, type: "dropdown" };
              const core = CORE_FIELDS.includes(r.key);
              return (
                <tr key={r.key} className={i % 2 ? "bg-neutral-50/60" : ""}>
                  <td className="px-4 py-3 cursor-grab text-neutral-300">⠿</td>
                  <td className="px-3 py-3 font-semibold text-ink">{meta.label} {core && <span className="ml-1 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">CORE</span>}</td>
                  <td className="px-3 py-3"><Toggle on={r.enabled} onChange={(v) => !core && upd(r.key, { enabled: v })} /></td>
                  <td className="px-3 py-3">{r.enabled ? <Toggle on={r.required} onChange={(v) => upd(r.key, { required: v })} /> : <span className="text-neutral-300">—</span>}</td>
                  <td className="px-3 py-3 capitalize text-neutral-400">{meta.type}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] text-neutral-400">
        Disabled fields are hidden from the product editor, bulk template, PDP spec table, and listing filters for <span className="font-semibold text-ink">{cat}</span>.
        Disabling never deletes existing data. Drag rows to set display order.
      </p>

      {adding && (
        <Modal title="Add Custom Spec Field" onClose={() => setAdding(false)}
          footer={<><button onClick={() => setAdding(false)} className={btnGhost}>Close</button><button onClick={() => { setAdding(false); toast("Custom spec fields are coming soon — not saved yet", "error"); }} className={btnPrimary}>Add Field</button></>}>
          <div className="space-y-3">
            <Field label="Field Name" hint="e.g. Rack Units, Stylus Support, ECC Support"><input className={inputCls} /></Field>
            <Field label="Field Type"><select className={inputCls}><option>Dropdown (from master data)</option><option>Yes/No toggle</option></select></Field>
            <Field label="Applies to Categories">
              <div className="flex flex-wrap gap-3 pt-1">
                {cats.map((c) => <label key={c} className="flex items-center gap-1.5 text-sm"><input type="checkbox" defaultChecked={c === cat} className="accent-brand" />{c}</label>)}
              </div>
            </Field>
            <Field label="Display Order"><input type="number" className={inputCls} defaultValue={99} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function MasterData() {
  const [tab, setTab] = useState("Master Tables");
  return (
    <div>
      <PageHeader title="Master Data" subtitle="Dropdown values & per-category spec schema." />
      <Tabs tabs={["Master Tables", "Category Spec Schema"]} active={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === "Master Tables" ? <MasterTables /> : <CategorySpecSchema />}
      </div>
    </div>
  );
}
