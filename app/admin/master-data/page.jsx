"use client";

import { useState } from "react";
import { PageHeader, Tabs, Toggle, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { MASTER_TABLES, SPEC_FIELDS, CATEGORY_SPEC_SCHEMA } from "@/lib/admin-data";
import { CATEGORY_SLUGS } from "@/lib/data";

const CORE_FIELDS = ["brand", "model", "price", "category", "status", "description"];

function MasterTables() {
  const toast = useToast();
  const tables = Object.keys(MASTER_TABLES);
  const [active, setActive] = useState(tables[0]);
  const [values, setValues] = useState(() => Object.fromEntries(tables.map((t) => [t, MASTER_TABLES[t].map((v) => ({ label: v, on: true }))])));
  const [newVal, setNewVal] = useState("");
  const add = () => { if (!newVal.trim()) return; setValues((v) => ({ ...v, [active]: [...v[active], { label: newVal.trim(), on: true }] })); setNewVal(""); toast("Value added — now in listing dropdowns"); };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="rounded-card border border-black/5 bg-white p-2 shadow-card">
        {tables.map((t) => (
          <button key={t} onClick={() => setActive(t)} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${active === t ? "bg-brand text-white" : "text-neutral-600 hover:bg-brand-softer hover:text-brand"}`}>{t}</button>
        ))}
      </div>
      <div className="rounded-card border border-black/5 bg-white shadow-card">
        <div className="border-b border-black/5 px-5 py-3.5"><h2 className="text-sm font-bold text-ink">{active}</h2></div>
        <div className="divide-y divide-black/5">
          {values[active].map((v, i) => (
            <div key={v.label} className="flex items-center gap-3 px-5 py-2.5">
              <span className="flex-1 text-sm text-ink">{v.label}</span>
              <Toggle on={v.on} onChange={() => setValues((all) => ({ ...all, [active]: all[active].map((x, j) => j === i ? { ...x, on: !x.on } : x) }))} />
              <button onClick={() => { setValues((all) => ({ ...all, [active]: all[active].filter((_, j) => j !== i) })); toast("Value deleted", "error"); }} className="text-[13px] font-bold text-red-600 hover:underline">Delete</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-black/5 p-3">
          <input value={newVal} onChange={(e) => setNewVal(e.target.value)} placeholder={`New ${active} value…`} className={inputCls} />
          <button onClick={add} className={btnPrimary}>Add</button>
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${cat === c ? "bg-brand text-white" : "border border-black/10 text-ink"}`}>{c}</button>
        ))}
        <button onClick={() => setAdding(true)} className={`${btnPrimary} ml-auto`}>+ Add Custom Field</button>
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
          footer={<><button onClick={() => setAdding(false)} className={btnGhost}>Cancel</button><button onClick={() => { setAdding(false); toast("Custom field added to selected categories"); }} className={btnPrimary}>Add Field</button></>}>
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
