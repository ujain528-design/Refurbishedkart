"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PageHeader, Badge, Toggle, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import {
  adminGetCollections, adminGetCollection, adminCreateCollection, adminUpdateCollection, adminDeleteCollection,
  adminGetProducts,
} from "@/lib/api";

const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const BLANK = { name: "", slug: "", description: "", active: true, products: [] };

export default function Collections() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [status, setStatus] = useState("loading");
  const [editing, setEditing] = useState(null); // null | {} (new) | {id} (existing)
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    adminGetCollections().then((c) => { setList(c); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(BLANK); setEditing({}); };
  const openEdit = async (c) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || "", active: c.active, products: [] });
    try {
      const full = await adminGetCollection(c.id);
      setForm({ name: full.name, slug: full.slug, description: full.description || "", active: full.active, products: full.products || [] });
    } catch (e) { toast(e.message || "Couldn't load collection", "error"); }
  };

  const save = async () => {
    if (!form.name.trim()) { toast("Name is required", "error"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), description: form.description, active: form.active, productIds: form.products.map((p) => String(p.id)) };
      if (editing.id) await adminUpdateCollection(editing.id, payload);
      else await adminCreateCollection(payload);
      toast("Collection saved");
      setEditing(null);
      load();
    } catch (e) { toast(e.message || "Save failed", "error"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (c) => {
    try { await adminUpdateCollection(c.id, { active: !c.active }); setList((l) => l.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x))); }
    catch (e) { toast(e.message, "error"); }
  };
  const del = async (c) => {
    if (!confirm(`Delete collection "${c.name}"?`)) return;
    try { await adminDeleteCollection(c.id); setList((l) => l.filter((x) => x.id !== c.id)); toast("Collection deleted", "error"); }
    catch (e) { toast(e.message, "error"); }
  };

  const slugPreview = editing?.id ? form.slug : slugify(form.name) || "—";

  return (
    <div>
      <PageHeader title="Collections" subtitle="Curate a hand-picked, ordered set of products (separate from homepage tags)." action={<button onClick={openNew} className={btnPrimary}>+ New Collection</button>} />

      {status === "loading" ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading collections…</p>
      ) : status === "error" ? (
        <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-neutral-600">Couldn&apos;t load collections.</p>
          <button onClick={load} className={`${btnPrimary} mt-4`}>Retry</button>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-card border border-dashed border-black/10 bg-neutral-50 p-12 text-center text-sm text-neutral-500">No collections yet. Create one to curate a product set.</div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Name</th><th className="px-3 py-3">Slug</th><th className="px-3 py-3">Products</th><th className="px-3 py-3">Active</th><th className="px-3 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {list.map((c, i) => (
                <tr key={c.id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                  <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                  <td className="px-3 py-3"><a href={`/collections/${c.slug}`} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-brand hover:underline">/collections/{c.slug}</a></td>
                  <td className="px-3 py-3"><Badge>{c.productCount} items</Badge></td>
                  <td className="px-3 py-3"><Toggle on={c.active} onChange={() => toggleActive(c)} /></td>
                  <td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => openEdit(c)} className="text-[13px] font-bold text-brand hover:underline">Edit</button><button onClick={() => del(c)} className="text-[13px] font-bold text-red-600 hover:underline">Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={editing.id ? "Edit Collection" : "New Collection"}
          onClose={() => setEditing(null)}
          footer={<><button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button><button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button></>}
        >
          <div className="space-y-4">
            <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Diwali Deals" /></Field>
            <div className="text-[12px] text-neutral-500">Slug: <span className="font-mono text-ink">/collections/{slugPreview}</span>{editing.id ? <span className="ml-1 text-neutral-400">(stays fixed on rename)</span> : null}</div>
            <Field label="Description (optional)"><textarea rows={2} className={inputCls} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Shown on the collection page header." /></Field>
            <label className="flex items-center gap-2 text-sm text-ink"><Toggle on={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} /> Active</label>

            <ProductPicker
              products={form.products}
              setProducts={(updater) => setForm((f) => ({ ...f, products: typeof updater === "function" ? updater(f.products) : updater }))}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* Search-and-pick + drag-reorder of the curated product list. */
function ProductPicker({ products, setProducts }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const dragIndex = useRef(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    let alive = true;
    setSearching(true);
    const t = setTimeout(() => {
      adminGetProducts({ q: term, limit: 20 })
        .then((rows) => { if (alive) setResults(rows.map((p) => ({ id: String(p.id), name: p.name, image: p.image || (p.images && p.images[0]) || "" }))); })
        .catch(() => { if (alive) setResults([]); })
        .finally(() => { if (alive) setSearching(false); });
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  const chosen = new Set(products.map((p) => String(p.id)));
  const add = (p) => { if (chosen.has(String(p.id))) return; setProducts((list) => [...list, p]); };
  const remove = (id) => setProducts((list) => list.filter((p) => String(p.id) !== String(id)));
  const move = (i, dir) => setProducts((list) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const onDrop = (i) => setProducts((list) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from == null || from === i) return list;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    return next;
  });

  const Thumb = ({ src }) => (
    src
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={src} alt="" className="h-9 w-9 shrink-0 rounded object-contain bg-neutral-50 ring-1 ring-black/5" />
      : <span className="h-9 w-9 shrink-0 rounded bg-neutral-100 ring-1 ring-black/5" />
  );

  return (
    <div className="rounded-lg border border-black/10 p-3">
      <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-brand">Products in this collection</p>

      {/* search */}
      <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to add…" />
      {q.trim().length >= 2 && (
        <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-black/5">
          {searching ? (
            <p className="px-3 py-3 text-[12px] text-neutral-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-[12px] text-neutral-400">No products match.</p>
          ) : results.map((p) => (
            <div key={p.id} className="flex items-center gap-2 border-b border-black/5 px-2 py-1.5 last:border-0">
              <Thumb src={p.image} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{p.name}</span>
              <button onClick={() => add(p)} disabled={chosen.has(p.id)} className="rounded-full border border-brand/30 px-3 py-1 text-[12px] font-bold text-brand hover:bg-brand-soft disabled:opacity-40">{chosen.has(p.id) ? "Added" : "Add"}</button>
            </div>
          ))}
        </div>
      )}

      {/* selected, ordered, draggable */}
      <p className="mb-1 mt-3 text-[12px] font-semibold text-neutral-600">Selected ({products.length}) — drag or use arrows to reorder</p>
      {products.length === 0 ? (
        <p className="rounded-lg bg-neutral-50 px-3 py-3 text-center text-[12px] text-neutral-400">No products yet — search above to add.</p>
      ) : (
        <div className="divide-y divide-black/5 rounded-lg border border-black/5">
          {products.map((p, i) => (
            <div
              key={p.id}
              draggable
              onDragStart={() => { dragIndex.current = i; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className="flex items-center gap-2 bg-white px-2 py-1.5"
            >
              <span className="cursor-grab select-none text-neutral-300" title="Drag to reorder">⠿</span>
              <span className="w-5 text-center text-[11px] font-bold text-neutral-400">{i + 1}</span>
              <Thumb src={p.image} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{p.name}</span>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-neutral-500 disabled:opacity-30" aria-label="Move up">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === products.length - 1} className="px-1 text-neutral-500 disabled:opacity-30" aria-label="Move down">↓</button>
              <button onClick={() => remove(p.id)} className="px-1 text-[12px] font-bold text-red-600" aria-label="Remove">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
