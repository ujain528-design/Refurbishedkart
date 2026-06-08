"use client";

import { useState } from "react";
import { PageHeader, Badge, Toggle, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { ADMIN_BANNERS } from "@/lib/admin-data";

export default function Banners() {
  const toast = useToast();
  const [list, setList] = useState(ADMIN_BANNERS);
  const [editing, setEditing] = useState(null);

  const toggleStatus = (id) => {
    const activeCount = list.filter((b) => b.status === "active").length;
    const target = list.find((b) => b.id === id);
    if (target.status === "active" && activeCount <= 1) { toast("At least one active banner required", "error"); return; }
    setList((l) => l.map((b) => (b.id === id ? { ...b, status: b.status === "active" ? "inactive" : "active" } : b)));
  };

  return (
    <div>
      <PageHeader title="Hero Banners" subtitle="Manage homepage carousel slides." action={<button onClick={() => setEditing({})} className={btnPrimary}>+ Add Banner</button>} />

      <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3">⠿</th><th className="px-3 py-3">Banner</th><th className="px-3 py-3">Headline</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Dates</th><th className="px-3 py-3">Active</th><th className="px-3 py-3">Actions</th>
          </tr></thead>
          <tbody>
            {list.map((b, i) => (
              <tr key={b.id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                <td className="px-4 py-3 cursor-grab text-neutral-300">⠿</td>
                <td className="px-3 py-3"><div className="h-8 w-14 rounded bg-gradient-to-br from-brand to-brand-mid" /></td>
                <td className="px-3 py-3 font-semibold text-ink">{b.headline}</td>
                <td className="px-3 py-3"><Badge>{b.status}</Badge></td>
                <td className="px-3 py-3 text-[12px] text-neutral-400">{b.start} → {b.end}</td>
                <td className="px-3 py-3"><Toggle on={b.status === "active"} onChange={() => toggleStatus(b.id)} /></td>
                <td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => setEditing(b)} className="text-[13px] font-bold text-brand hover:underline">Edit</button><button onClick={() => { setList((l) => l.filter((x) => x.id !== b.id)); toast("Banner deleted", "error"); }} className="text-[13px] font-bold text-red-600 hover:underline">Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? "Edit Banner" : "Add Banner"} onClose={() => setEditing(null)}
          footer={<><button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button><button onClick={() => { setEditing(null); toast("Banner saved"); }} className={btnPrimary}>Save</button></>}>
          <div className="space-y-4">
            <div className="flex aspect-[3/1] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-black/15 text-sm text-neutral-400 hover:border-brand">＋ Upload poster image</div>
            <Field label="Headline"><input className={inputCls} defaultValue={editing.headline} /></Field>
            <Field label="Subtext"><input className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA Text"><input className={inputCls} placeholder="Shop Now" /></Field>
              <Field label="CTA Link"><input className={inputCls} placeholder="/products/laptops" /></Field>
              <Field label="Start Date"><input type="date" className={inputCls} /></Field>
              <Field label="End Date (optional)"><input type="date" className={inputCls} /></Field>
              <Field label="Display Order"><input type="number" className={inputCls} defaultValue={editing.order} /></Field>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked={editing.clickable} className="accent-brand" /> Clickable</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked={editing.status === "active"} className="accent-brand" /> Active</label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
