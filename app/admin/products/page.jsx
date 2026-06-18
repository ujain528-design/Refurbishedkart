"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge, PageHeader, Modal, useToast, inputCls, btnPrimary } from "@/components/admin/ui";
import { CATEGORY_SLUGS, formatINR } from "@/lib/data";
import { adminGetProducts, adminDeleteProduct, adminUpdateStock, adminBackfillSlugs } from "@/lib/api";

const stockTone = (s) => (s === 0 ? "text-red-600" : s <= 5 ? "text-amber-600" : "text-ink");

const stockState = (s) => (s === 0 ? "Out of Stock" : s <= 5 ? "Low Stock" : "In Stock");

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState(new Set());
  const [stockFor, setStockFor] = useState(null); // product in the quick-stock modal
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  const adjustStock = async (action) => {
    setBusy(true);
    try {
      const updated = await adminUpdateStock(stockFor.id, { type: "unit", action, quantity: qty });
      setProducts((ps) => ps.map((p) => (p.id === updated.id ? { ...p, stock: updated.stock } : p)));
      setStockFor((s) => ({ ...s, stock: updated.stock }));
    } catch (e) { toast(e.message || "Stock update failed", "error"); }
    finally { setBusy(false); }
  };

  const cats = ["All", ...Object.values(CATEGORY_SLUGS)];

  const [slugBusy, setSlugBusy] = useState(false);
  const backfillSlugs = async () => {
    setSlugBusy(true);
    try { const r = await adminBackfillSlugs(); toast(`SEO slugs: ${r.updated} added (${r.total} total)`); }
    catch (e) { toast(e.message || "Backfill failed", "error"); }
    finally { setSlugBusy(false); }
  };

  const load = useCallback(() => {
    setStatus("loading");
    adminGetProducts().then((p) => { setProducts(p); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = products.filter((p) => (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const del = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try { await adminDeleteProduct(p.id); toast(`${p.name} deleted`, "error"); setProducts((ps) => ps.filter((x) => x.id !== p.id)); }
    catch (e) { toast(e.message || "Delete failed", "error"); }
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} products?`)) return;
    const ids = [...selected];
    try {
      await Promise.all(ids.map((id) => adminDeleteProduct(id)));
      toast(`${ids.length} deleted`, "error");
      setProducts((ps) => ps.filter((x) => !selected.has(x.id)));
      setSelected(new Set());
    } catch (e) { toast(e.message || "Bulk delete failed", "error"); }
  };

  return (
    <div>
      <PageHeader title="Products" subtitle={`${products.length} listings`} action={
        <div className="flex items-center gap-2">
          <button onClick={backfillSlugs} disabled={slugBusy} className="rounded-full border border-black/10 px-4 py-2 text-sm font-bold text-ink hover:border-brand disabled:opacity-50">{slugBusy ? "Generating…" : "Backfill SEO slugs"}</button>
          <Link href="/admin/products/new" className={btnPrimary}>+ Add New Product</Link>
        </div>
      } />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className={`${inputCls} max-w-xs`} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} max-w-[180px]`}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-[13px] font-semibold text-brand">
            {selected.size} selected
            <button onClick={bulkDelete} className="rounded-full bg-red-600 px-2.5 py-1 text-[12px] text-white">Delete</button>
          </div>
        )}
      </div>

      {status === "loading" ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading products…</p>
      ) : status === "error" ? (
        <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-neutral-600">Couldn't load products.</p>
          <button onClick={load} className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Retry</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3"><input type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} /></th>
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
                        {(p.image || p.images?.[0]) ? <img src={p.image || p.images?.[0]} alt="" className="h-full w-full object-contain p-0.5" /> : <span className="text-[9px] text-neutral-300">IMG</span>}
                      </div>
                      <span className="font-semibold text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-neutral-500">{p.category}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{formatINR(p.price)}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => { setStockFor(p); setQty(1); }} className="flex items-center gap-1.5" title="Quick stock update">
                      <span className={`text-[13px] font-bold ${stockTone(p.stock)}`}>{p.stock}</span>
                      <Badge>{stockState(p.stock)}</Badge>
                    </button>
                  </td>
                  <td className="px-3 py-3"><span className="text-[12px] text-neutral-400">{(p.tags || []).join(", ") || "—"}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/products/new?id=${p.id}`} className="text-[13px] font-bold text-brand hover:underline">Edit</Link>
                      <button onClick={() => del(p)} className="text-[13px] font-bold text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-neutral-400">No products match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {stockFor && (
        <Modal title={`Stock · ${stockFor.name}`} onClose={() => setStockFor(null)}>
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
              <span className="font-semibold text-neutral-600">Unit stock</span>
              <span className={`text-2xl font-extrabold ${stockTone(stockFor.stock)}`}>{stockFor.stock}</span>
            </div>
            {stockFor.stock === 0 ? (
              <p className="text-[13px] font-bold text-red-600">Out of stock</p>
            ) : stockFor.stock <= 5 ? (
              <p className="text-[13px] font-bold text-amber-600">Low stock</p>
            ) : null}
            <label className="flex items-center gap-3">
              <span className="text-[12px] font-semibold text-neutral-600">Quantity</span>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className={`${inputCls} max-w-[100px]`} />
            </label>
            <div className="flex gap-2">
              <button onClick={() => adjustStock("add")} disabled={busy} className="flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50">+ Add</button>
              <button onClick={() => adjustStock("decrease")} disabled={busy || stockFor.stock === 0} className="flex-1 rounded-full border border-red-200 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">− Decrease</button>
            </div>
            <p className="text-[12px] text-neutral-400">Changes save immediately. For per-component (RAM/SSD) stock, use the Stock tab in the full editor.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
