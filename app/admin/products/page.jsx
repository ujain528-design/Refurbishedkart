"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, PageHeader, useToast, inputCls, btnPrimary } from "@/components/admin/ui";
import { ALL_PRODUCTS, CATEGORY_SLUGS, formatINR } from "@/lib/data";

const stockState = (s) => (s === 0 ? "Out of Stock" : s <= 5 ? "Low Stock" : "In Stock");

export default function AdminProducts() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState(new Set());

  const cats = ["All", ...Object.values(CATEGORY_SLUGS)];
  const rows = ALL_PRODUCTS.filter(
    (p) => (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase())
  );

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${ALL_PRODUCTS.length} listings`}
        action={<Link href="/admin/products/new" className={btnPrimary}>+ Add New Product</Link>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className={`${inputCls} max-w-xs`} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} max-w-[180px]`}>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-[13px] font-semibold text-brand">
            {selected.size} selected
            <button onClick={() => toast(`Tag applied to ${selected.size} products`)} className="rounded-full bg-brand px-2.5 py-1 text-[12px] text-white">Apply Tag</button>
            <button onClick={() => toast(`Status changed for ${selected.size}`)} className="rounded-full bg-brand px-2.5 py-1 text-[12px] text-white">Set Status</button>
            <button onClick={() => { toast(`${selected.size} deleted`, "error"); setSelected(new Set()); }} className="rounded-full bg-red-600 px-2.5 py-1 text-[12px] text-white">Delete</button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3"><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} /></th>
              <th className="px-3 py-3">Product</th><th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Price</th><th className="px-3 py-3">Stock</th>
              <th className="px-3 py-3">Tags</th><th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-100">
                      {p.image ? <img src={p.image} alt="" className="h-full w-full object-contain p-0.5" /> : <span className="text-[9px] text-neutral-300">IMG</span>}
                    </div>
                    <span className="font-semibold text-ink">{p.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-neutral-500">{p.category}</td>
                <td className="px-3 py-3 font-semibold text-ink">{formatINR(p.price)}</td>
                <td className="px-3 py-3"><Badge>{stockState(p.stock)}</Badge></td>
                <td className="px-3 py-3"><span className="text-[12px] text-neutral-400">{p.tags.join(", ") || "—"}</span></td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <Link href="/admin/products/new" className="text-[13px] font-bold text-brand hover:underline">Edit</Link>
                    <button onClick={() => toast(`${p.name} deleted`, "error")} className="text-[13px] font-bold text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
