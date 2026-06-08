"use client";

import { useState } from "react";
import { PageHeader, Toggle, useToast, inputCls, btnPrimary } from "@/components/admin/ui";
import { MASTER_TABLES } from "@/lib/admin-data";

export default function MasterData() {
  const toast = useToast();
  const tables = Object.keys(MASTER_TABLES);
  const [active, setActive] = useState(tables[0]);
  const [values, setValues] = useState(() => Object.fromEntries(tables.map((t) => [t, MASTER_TABLES[t].map((v) => ({ label: v, on: true }))])));
  const [newVal, setNewVal] = useState("");

  const add = () => {
    if (!newVal.trim()) return;
    setValues((v) => ({ ...v, [active]: [...v[active], { label: newVal.trim(), on: true }] }));
    setNewVal(""); toast("Value added — now available in listing dropdowns");
  };

  return (
    <div>
      <PageHeader title="Master Data" subtitle="Single source of truth for all listing dropdown values." />
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* table list */}
        <div className="rounded-card border border-black/5 bg-white p-2 shadow-card">
          {tables.map((t) => (
            <button key={t} onClick={() => setActive(t)} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${active === t ? "bg-brand text-white" : "text-neutral-600 hover:bg-brand-softer hover:text-brand"}`}>{t}</button>
          ))}
        </div>

        {/* values */}
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
    </div>
  );
}
