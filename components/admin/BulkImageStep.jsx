"use client";

import { useState } from "react";
import ImageSearch from "@/components/admin/ImageSearch";
import { adminUpdateProduct } from "@/lib/api";

/* Post-bulk-import "Add Images" screen. Walks the store person through every
   freshly-created product that has no images, letting them search + attach
   images inline without opening each product individually.

   products — [{ id, name }] from the bulk import result (ok rows). */
export default function BulkImageStep({ products = [] }) {
  const [openId, setOpenId] = useState(null);
  const [state, setState] = useState({}); // { [id]: "done" | "skipped" }
  const [saving, setSaving] = useState(null);

  const done = products.filter((p) => state[p.id] === "done").length;
  const handled = products.filter((p) => state[p.id]).length;

  const attach = async (id, urls) => {
    if (!urls.length) return;
    setSaving(id);
    try {
      await adminUpdateProduct(id, { images: urls });
      setState((s) => ({ ...s, [id]: "done" }));
      setOpenId(null);
    } catch {
      // leave the row open so they can retry
    } finally {
      setSaving(null);
    }
  };

  if (!products.length) return null;

  return (
    <div className="mt-5 rounded-card border border-black/5 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-ink">Add Images</p>
          <p className="text-[12px] text-neutral-500">These products imported without images. Add them now, or skip and do it later.</p>
        </div>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-[12px] font-bold text-brand">{done}/{products.length} have images</span>
      </div>

      <div className="mt-4 divide-y divide-black/5 rounded-lg border border-black/5">
        {products.map((p) => {
          const st = state[p.id];
          const isOpen = openId === p.id;
          return (
            <div key={p.id} className="px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{p.name || `#${p.id}`}</span>
                {st === "done" && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">✓ Images added</span>}
                {st === "skipped" && <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-bold text-neutral-500">Skipped</span>}
                {!st && !isOpen && (
                  <>
                    <button onClick={() => setOpenId(p.id)} className="rounded-full bg-brand px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-brand-dark">Find Images</button>
                    <button onClick={() => setState((s) => ({ ...s, [p.id]: "skipped" }))} className="rounded-full border border-black/10 px-3.5 py-1.5 text-[12px] font-bold text-neutral-500 hover:border-neutral-400">Skip</button>
                  </>
                )}
                {st && (
                  <button onClick={() => { setState((s) => { const n = { ...s }; delete n[p.id]; return n; }); setOpenId(p.id); }} className="text-[12px] font-semibold text-brand hover:underline">Redo</button>
                )}
              </div>
              {isOpen && (
                <div className="mt-3">
                  <ImageSearch
                    defaultQuery={p.name || ""}
                    onClose={() => setOpenId(null)}
                    onAdd={(urls) => attach(p.id, urls)}
                  />
                  {saving === p.id && <p className="mt-1 text-[12px] font-semibold text-brand">Saving images…</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {handled === products.length && (
        <p className="mt-3 text-[13px] font-semibold text-brand">All products handled — {done} with images, {products.length - done} skipped.</p>
      )}
    </div>
  );
}
