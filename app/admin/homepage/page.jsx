"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, Modal, Field, Toggle, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { adminGetHomepage, adminPublishHomepage, adminUploadImage } from "@/lib/api";

const TYPES = [
  { value: "product_row", label: "Product Row" },
  { value: "banner", label: "Banner/Poster" },
  { value: "category_grid", label: "Category Grid" },
  { value: "announcement", label: "Announcement" },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));
const CATEGORIES = ["Laptops", "Desktops", "Monitors", "Servers", "Workstations"];

const tmpId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const blank = (type) => {
  const base = { id: tmpId(), type, title: "", active: true, order: 0 };
  if (type === "product_row") return { ...base, title: "New Product Row", tag: "", category: "", maxProducts: 8 };
  if (type === "banner") return { ...base, title: "New Banner", heading: "", subheading: "", ctaText: "", ctaLink: "", bgColor: "#1C1C1E", imageUrl: "" };
  if (type === "category_grid") return { ...base, title: "Shop by Category", categories: [] };
  return { ...base, title: "Announcement", text: "", bgColor: "#2D5016", textColor: "#FFFFFF" };
};

const summary = (s) => {
  if (s.type === "product_row") return `Tag: ${s.tag || "—"}${s.category ? ` · ${s.category}` : ""} · max ${s.maxProducts || 8}`;
  if (s.type === "banner") return s.heading || "Banner";
  if (s.type === "category_grid") return (s.categories && s.categories.length ? s.categories.join(", ") : "All categories");
  return s.text || "Announcement";
};

export default function HomepageBuilder() {
  const toast = useToast();
  const [draft, setDraft] = useState([]);
  const [status, setStatus] = useState("loading");
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    adminGetHomepage().then((s) => { setDraft(s); setDirty(false); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  // Warn before leaving with unsaved (unpublished) changes.
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const mutate = (fn) => { setDraft((d) => fn(d)); setDirty(true); };
  const move = (i, dir) => mutate((d) => { const j = i + dir; if (j < 0 || j >= d.length) return d; const c = [...d]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const toggleActive = (id) => mutate((d) => d.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  const del = (id) => { if (window.confirm("Delete this section? It's removed when you publish.")) mutate((d) => d.filter((s) => s.id !== id)); };
  const addSection = (type) => { setAddOpen(false); setEditing(blank(type)); };
  const set = (k, v) => setEditing((e) => ({ ...e, [k]: v }));
  const toggleCat = (c) => setEditing((e) => { const cur = e.categories || []; return { ...e, categories: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] }; });
  const saveEdit = () => {
    mutate((d) => (d.some((s) => s.id === editing.id) ? d.map((s) => (s.id === editing.id ? editing : s)) : [...d, editing]));
    setEditing(null);
  };

  const uploadBanner = async (file) => {
    if (!file) return;
    setUploading(true);
    try { const { url } = await adminUploadImage(file); set("imageUrl", url); }
    catch (e) { toast(e.message || "Upload failed", "error"); }
    finally { setUploading(false); }
  };

  const publish = async () => {
    setPublishing(true);
    try { const saved = await adminPublishHomepage(draft); setDraft(saved); setDirty(false); toast("Homepage published — changes are now live"); }
    catch (e) { toast(e.message || "Publish failed", "error"); }
    finally { setPublishing(false); }
  };

  return (
    <div>
      <PageHeader
        title="Homepage Builder"
        subtitle="Manage the homepage sections zone. Changes go live only when you Publish."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => window.open("/", "_blank", "noopener")} className={btnGhost}>Preview Homepage ↗</button>
            <button onClick={publish} disabled={publishing || !dirty} className={`${btnPrimary} disabled:opacity-40`}>
              {publishing ? "Publishing…" : dirty ? "Publish Changes" : "Published"}
            </button>
          </div>
        }
      />

      {dirty && <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[13px] font-semibold text-amber-700">You have unsaved changes — click Publish to make them live.</p>}

      {/* Add Section dropdown */}
      <div className="relative mb-4 inline-block">
        <button onClick={() => setAddOpen((o) => !o)} className="rounded-full border border-brand px-4 py-2 text-[13px] font-bold text-brand hover:bg-brand-softer">+ Add Section ▾</button>
        {addOpen && (
          <div className="absolute z-20 mt-2 w-52 overflow-hidden rounded-xl border border-black/10 bg-white shadow-card-hover">
            {TYPES.map((t) => (
              <button key={t.value} onClick={() => addSection(t.value)} className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-ink hover:bg-neutral-50">{t.label}</button>
            ))}
          </div>
        )}
      </div>

      {status === "loading" ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading sections…</p>
      ) : status === "error" ? (
        <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-neutral-600">Couldn&apos;t load homepage sections.</p>
          <button onClick={load} className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Retry</button>
        </div>
      ) : draft.length === 0 ? (
        <div className="rounded-card border border-dashed border-black/10 bg-neutral-50 p-12 text-center text-sm text-neutral-500">No sections yet. Use “Add Section” to build your homepage zone.</div>
      ) : (
        <div className="space-y-2.5">
          {draft.map((s, i) => (
            <div key={s.id} className={`flex flex-wrap items-center gap-3 rounded-card border border-black/5 bg-white p-3 shadow-card ${s.active ? "" : "opacity-60"}`}>
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="text-neutral-400 hover:text-ink disabled:opacity-30">⬆</button>
                <button onClick={() => move(i, 1)} disabled={i === draft.length - 1} aria-label="Move down" className="text-neutral-400 hover:text-ink disabled:opacity-30">⬇</button>
              </div>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand">{TYPE_LABEL[s.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{s.title || TYPE_LABEL[s.type]}</p>
                <p className="truncate text-[12px] text-neutral-500">{summary(s)}</p>
              </div>
              <Toggle on={s.active} onChange={() => toggleActive(s.id)} />
              <button onClick={() => setEditing({ ...s })} className="text-[13px] font-bold text-brand hover:underline">Edit</button>
              <button onClick={() => del(s.id)} className="text-[13px] font-bold text-red-600 hover:underline">Delete</button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          title={`${TYPE_LABEL[editing.type]} Section`}
          onClose={() => setEditing(null)}
          footer={<><button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button><button onClick={saveEdit} className={btnPrimary}>Done</button></>}
        >
          <div className="space-y-3">
            <Field label="Section Title (admin label)"><input className={inputCls} value={editing.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>

            {editing.type === "product_row" && (
              <>
                <Field label="Tag" hint="Products with this tag show in the row (e.g. bestseller, student, new-arrival)"><input className={inputCls} value={editing.tag || ""} onChange={(e) => set("tag", e.target.value)} /></Field>
                <Field label="Category filter (optional)">
                  <select className={inputCls} value={editing.category || ""} onChange={(e) => set("category", e.target.value)}>
                    <option value="">All categories</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Max products"><input type="number" min={1} className={inputCls} value={editing.maxProducts ?? 8} onChange={(e) => set("maxProducts", Number(e.target.value) || 8)} /></Field>
              </>
            )}

            {editing.type === "banner" && (
              <>
                <Field label="Heading"><input className={inputCls} value={editing.heading || ""} onChange={(e) => set("heading", e.target.value)} /></Field>
                <Field label="Subheading"><input className={inputCls} value={editing.subheading || ""} onChange={(e) => set("subheading", e.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CTA Button Text"><input className={inputCls} value={editing.ctaText || ""} onChange={(e) => set("ctaText", e.target.value)} /></Field>
                  <Field label="CTA Button Link"><input className={inputCls} placeholder="/products/laptops" value={editing.ctaLink || ""} onChange={(e) => set("ctaLink", e.target.value)} /></Field>
                </div>
                <div className="flex items-center gap-3">
                  <Field label="Background Colour"><input type="color" value={editing.bgColor || "#1C1C1E"} onChange={(e) => set("bgColor", e.target.value)} className="h-9 w-16 rounded border border-black/10" /></Field>
                  <label className="text-[13px] font-semibold text-brand">
                    {uploading ? "Uploading…" : "Upload Image"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { uploadBanner(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                </div>
                {/* live preview */}
                <div className="relative overflow-hidden rounded-lg" style={{ background: editing.bgColor || "#1C1C1E" }}>
                  {editing.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editing.imageUrl} alt="Banner preview" className="absolute inset-0 h-full w-full object-cover opacity-90" />
                  )}
                  <div className="relative px-5 py-8">
                    {editing.heading && <p className="text-lg font-extrabold text-white">{editing.heading}</p>}
                    {editing.subheading && <p className="mt-1 text-sm text-white/85">{editing.subheading}</p>}
                    {editing.ctaText && <span className="mt-3 inline-block rounded-full bg-white px-4 py-1.5 text-[13px] font-bold text-ink">{editing.ctaText}</span>}
                  </div>
                </div>
              </>
            )}

            {editing.type === "category_grid" && (
              <div>
                <p className="mb-1.5 text-[12px] font-semibold text-neutral-600">Categories to show <span className="font-normal text-neutral-400">(none = all)</span></p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const on = (editing.categories || []).includes(c);
                    return (
                      <label key={c} className={`cursor-pointer rounded-full border px-3 py-1 text-[13px] ${on ? "border-brand bg-brand/10 text-brand" : "border-black/10 text-neutral-500"}`}>
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleCat(c)} />{c}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {editing.type === "announcement" && (
              <>
                <Field label="Text"><input className={inputCls} value={editing.text || ""} onChange={(e) => set("text", e.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Background Colour"><input type="color" value={editing.bgColor || "#2D5016"} onChange={(e) => set("bgColor", e.target.value)} className="h-9 w-full rounded border border-black/10" /></Field>
                  <Field label="Text Colour"><input type="color" value={editing.textColor || "#FFFFFF"} onChange={(e) => set("textColor", e.target.value)} className="h-9 w-full rounded border border-black/10" /></Field>
                </div>
                <div className="rounded-lg px-4 py-3 text-center text-sm font-semibold" style={{ background: editing.bgColor || "#2D5016", color: editing.textColor || "#FFFFFF" }}>
                  {editing.text || "Announcement preview"}
                </div>
              </>
            )}

            <label className="flex items-center gap-2 pt-1 text-sm"><input type="checkbox" checked={editing.active !== false} onChange={(e) => set("active", e.target.checked)} className="accent-brand" /> Active</label>
          </div>
        </Modal>
      )}
    </div>
  );
}
