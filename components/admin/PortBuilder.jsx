"use client";

import { PORT_DEFS, portsToString } from "@/lib/admin-data";

/* Structured port selector — controlled so its state is part of the form
   (captured by auto-save). Auto-generates the buyer-facing display string. */
export default function PortBuilder({ value = {}, onChange }) {
  const set = (key, val) => onChange?.({ ...value, [key]: val });
  const preview = portsToString(value);

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {PORT_DEFS.map((d) => (
          <div key={d.key} className="flex items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-1.5 text-sm">
            <span className="text-ink">{d.label}</span>
            {d.type === "count" && (
              <select value={value[d.key] ?? 0} onChange={(e) => set(d.key, +e.target.value)} className="rounded border border-black/10 px-2 py-1 text-[13px]">
                {Array.from({ length: d.max + 1 }).map((_, n) => <option key={n} value={n}>{n}</option>)}
              </select>
            )}
            {d.type === "toggle" && (
              <select value={value[d.key] ? "Yes" : "No"} onChange={(e) => set(d.key, e.target.value === "Yes")} className="rounded border border-black/10 px-2 py-1 text-[13px]">
                <option>No</option><option>Yes</option>
              </select>
            )}
            {d.type === "select" && (
              <select value={value[d.key] ?? "None"} onChange={(e) => set(d.key, e.target.value)} className="rounded border border-black/10 px-2 py-1 text-[13px]">
                {d.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-[13px]">
        <span className="font-semibold text-neutral-500">Display string: </span>
        <span className="text-ink">{preview || <span className="text-neutral-400">N/A (no ports selected)</span>}</span>
      </div>
    </div>
  );
}
