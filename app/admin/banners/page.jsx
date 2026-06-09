"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, Badge, Toggle, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { adminGetBanners, adminCreateBanner, adminUpdateBanner, adminDeleteBanner } from "@/lib/api";

const BLANK = { headline: "", sub: "", ctaText: "", ctaLink: "", order: 0, clickable: true, active: true };

export default function Banners() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [status, setStatus] = useState("loading");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    adminGetBanners().then((b) => { setList(b); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setForm(BLANK); setEditing({}); };
  const openEdit = (b) => { setForm({ headline: b.headline || "", sub: b.sub || "", ctaText: b.cta?.label || "", ctaLink: b.cta?.href || "", order: b.order ?? 0, clickable: b.clickable !== false, active: b.active !== false }); setEditing(b); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { headline: form.headline, sub: form.sub, cta: { label: form.ctaText, href: form.ctaLink }, order: Number(form.order) || 0, clickable: form.clickable, active: form.active };
      if (editing.id) await adminUpdateBanner(editing.id, payload);
      else await adminCreateBanner(payload);
      toast("Banner saved");
      setEditing(null);
      load();
    } catch (e) { toast(e.message || "Save failed", "error"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (b) => {
    const activeCount = list.filter((x) => x.active).length;
    if (b.active && activeCount <= 1) { toast("Keep at least one active banner", "error"); return; }
    try { await adminUpdateBanner(b.id, { active: !b.active }); setList((l) => l.map((x) => (x.id === b.id ? { ...x, active: !b.active } : x))); }
    catch (e) { toast(e.message, "error"); }
  };
  const del = async (b) => {
    if (!confirm("Delete this banner?")) return;
    try { await adminDeleteBanner(b.id); setList((l) => l.filter((x) => x.id !== b.id)); toast("Banner deleted", "error"); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <PageHeader title="Hero Banners" subtitle="Manage homepage carousel slides." action={<button onClick={openNew} className={btnPrimary}>+ Add Banner</button>} />

      {status === "loading" ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading banners…</p>
      ) : status === "error" ? (
        <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-neutral-600">Couldn't load banners.</p>
          <button onClick={load} className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Retry</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Order</th><th className="px-3 py-3">Headline</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Active</th><th className="px-3 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-neutral-400">No banners yet.</td></tr>}
              {list.map((b, i) => (
                <tr key={b.id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                  <td className="px-4 py-3 text-neutral-400">{b.order}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{b.headline}</td>
                  <td className="px-3 py-3"><Badge>{b.active ? "active" : "inactive"}</Badge></td>
                  <td className="px-3 py-3"><Toggle on={b.active} onChange={() => toggleActive(b)} /></td>
                  <td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => openEdit(b)} className="text-[13px] font-bold text-brand hover:underline">Edit</button><button onClick={() => del(b)} className="text-[13px] font-bold text-red-600 hover:underline">Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? "Edit Banner" : "Add Banner"} onClose={() => setEditing(null)}
          footer={<><button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button><button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button></>}>
          <div className="space-y-4">
            <Field label="Headline"><input className={inputCls} value={form.headline} onChange={(e) => set("headline", e.target.value)} /></Field>
            <Field label="Subtext"><input className={inputCls} value={form.sub} onChange={(e) => set("sub", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA Text"><input className={inputCls} placeholder="Shop Now" value={form.ctaText} onChange={(e) => set("ctaText", e.target.value)} /></Field>
              <Field label="CTA Link"><input className={inputCls} placeholder="/products/laptops" value={form.ctaLink} onChange={(e) => set("ctaLink", e.target.value)} /></Field>
              <Field label="Display Order"><input type="number" className={inputCls} value={form.order} onChange={(e) => set("order", e.target.value)} /></Field>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.clickable} onChange={(e) => set("clickable", e.target.checked)} className="accent-brand" /> Clickable</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="accent-brand" /> Active</label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
