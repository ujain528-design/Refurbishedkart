"use client";

import { useState } from "react";
import { PageHeader, Badge, Toggle, useToast } from "@/components/admin/ui";
import { ADMIN_REVIEWS } from "@/lib/admin-data";

const Stars = ({ n }) => <span className="text-amber-400">{"★".repeat(n)}<span className="text-neutral-300">{"★".repeat(5 - n)}</span></span>;

export default function Reviews() {
  const toast = useToast();
  const [list, setList] = useState(ADMIN_REVIEWS);
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState(new Set());

  const rows = [...list].filter((r) => filter === "all" || r.status === filter).sort((a, b) => (a.status === "pending" ? -1 : 1));
  const setStatus = (id, status) => setList((l) => l.map((r) => r.id === id ? { ...r, status } : r));
  const toggleSel = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate customer reviews — pending first." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-[13px] font-semibold capitalize ${filter === f ? "bg-brand text-white" : "border border-black/10 text-ink"}`}>{f}</button>
        ))}
        {sel.size > 0 && (
          <div className="ml-auto flex gap-2">
            <button onClick={() => { sel.forEach((id) => setStatus(id, "approved")); toast(`${sel.size} approved`); setSel(new Set()); }} className="rounded-full bg-brand px-3 py-1.5 text-[12px] font-bold text-white">Approve {sel.size}</button>
            <button onClick={() => { sel.forEach((id) => setStatus(id, "rejected")); toast(`${sel.size} rejected`, "error"); setSel(new Set()); }} className="rounded-full bg-red-600 px-3 py-1.5 text-[12px] font-bold text-white">Reject {sel.size}</button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3"></th><th className="px-3 py-3">Product</th><th className="px-3 py-3">Reviewer</th><th className="px-3 py-3">Rating</th><th className="px-3 py-3">Review</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Featured</th><th className="px-3 py-3">Actions</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                <td className="px-4 py-3"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggleSel(r.id)} /></td>
                <td className="px-3 py-3 font-semibold text-ink">{r.product}</td>
                <td className="px-3 py-3 text-neutral-600">{r.reviewer}</td>
                <td className="px-3 py-3"><Stars n={r.rating} /></td>
                <td className="px-3 py-3 max-w-[220px] truncate text-[12px] text-neutral-500" title={r.text}>{r.text}</td>
                <td className="px-3 py-3"><Badge>{r.status}</Badge></td>
                <td className="px-3 py-3">{r.status === "approved" ? <Toggle on={!!r.featured} onChange={(v) => setList((l) => l.map((x) => x.id === r.id ? { ...x, featured: v } : x))} /> : <span className="text-neutral-300">—</span>}</td>
                <td className="px-3 py-3">
                  {r.status === "pending" ? (
                    <div className="flex gap-2">
                      <button onClick={() => { setStatus(r.id, "approved"); toast("Approved"); }} className="text-[13px] font-bold text-brand hover:underline">Approve</button>
                      <button onClick={() => { setStatus(r.id, "rejected"); toast("Rejected", "error"); }} className="text-[13px] font-bold text-red-600 hover:underline">Reject</button>
                    </div>
                  ) : <span className="text-[12px] text-neutral-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
