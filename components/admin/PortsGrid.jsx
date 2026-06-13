"use client";

import { PORT_TYPES, formatPorts } from "@/lib/ports";

/* Compact port quantity grid — one small NUMBER input per port type. 0/blank =
   the device lacks that port. Controlled, so its state is part of the form
   (captured by auto-save). Stores { "USB-A": 2, "USB-C": 1 } — qty > 0 only. */
export default function PortsGrid({ value = {}, onChange }) {
  const set = (type, raw) => {
    const n = Math.max(0, Math.round(Number(raw) || 0));
    const next = { ...value };
    if (n > 0) next[type] = n;
    else delete next[type];
    onChange?.(next);
  };
  const preview = formatPorts(value);

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {PORT_TYPES.map((t) => (
          <div key={t} className="flex items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-1.5 text-sm">
            <span className="text-ink">{t}</span>
            <input
              type="number"
              min={0}
              value={value[t] ?? ""}
              onChange={(e) => set(t, e.target.value)}
              placeholder="0"
              aria-label={`${t} quantity`}
              className="w-16 rounded border border-black/10 px-2 py-1 text-right text-[13px]"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-[13px]">
        <span className="font-semibold text-neutral-500">Display string: </span>
        <span className="text-ink">{preview || <span className="text-neutral-400">No ports entered</span>}</span>
      </div>
    </div>
  );
}
