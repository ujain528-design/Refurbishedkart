"use client";

import { useState } from "react";
import { Toggle, Field, inputCls } from "@/components/admin/ui";
import { blankHeroSlide } from "@/lib/heroSlides";

const GRADIENT_CSS = "linear-gradient(160deg, #1C1C1E 0%, #2D5016 60%, #1C1C1E 100%)";
const reindex = (arr) => arr.map((s, i) => ({ ...s, order: i }));

function Label({ children }) {
  return <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{children}</span>;
}

/* Background swatch/thumbnail for a slide. */
function SlideThumb({ slide }) {
  if (slide.backgroundType === "image" && slide.backgroundImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={slide.backgroundImage} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />;
  }
  const bg = slide.backgroundType === "color" ? (slide.backgroundColor || "#1C1C1E") : GRADIENT_CSS;
  return <div className="h-12 w-20 shrink-0 rounded" style={{ background: bg }} aria-hidden="true" />;
}

/* Live preview of one slide (approximates the storefront hero). */
function SlidePreview({ s }) {
  const x = Math.max(0, Math.min(100, Number(s.overlayDarkness ?? 55))) / 100;
  const base = s.backgroundType === "image" && s.backgroundImage
    ? { backgroundImage: `url(${s.backgroundImage})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundColor: "#111" }
    : { background: s.backgroundType === "color" ? (s.backgroundColor || "#1C1C1E") : GRADIENT_CSS };
  return (
    <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "16 / 5", ...base }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(28,28,30,${x}) 0%, rgba(28,28,30,${x * 0.3}) 70%)` }} />
      {s.heading && (
        <div className="absolute inset-0 flex flex-col justify-center px-4">
          <p className="text-base font-extrabold leading-tight text-white sm:text-lg">{s.heading}</p>
          {s.subheading && <p className="mt-1 max-w-[80%] text-[11px] text-white/80">{s.subheading}</p>}
          <div className="mt-2 flex gap-1.5">
            {s.ctaText && <span className="rounded bg-brand px-2 py-0.5 text-[10px] font-bold text-white">{s.ctaText}</span>}
            {s.ctaSecondaryText && <span className="rounded border border-white/50 px-2 py-0.5 text-[10px] font-bold text-white">{s.ctaSecondaryText}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeroCarouselManager({ slides = [], onChange, uploadImage }) {
  const [editIdx, setEditIdx] = useState(null); // index being edited
  const [draft, setDraft] = useState(null);     // working copy of the slide
  const [uploading, setUploading] = useState(false);

  const list = Array.isArray(slides) ? slides : [];

  const openEdit = (i) => { setDraft({ ...list[i] }); setEditIdx(i); };
  const cancelEdit = () => { setDraft(null); setEditIdx(null); };
  const saveSlide = () => {
    const next = list.map((s, i) => (i === editIdx ? draft : s));
    onChange(reindex(next));
    cancelEdit();
  };
  const setD = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const addSlide = () => {
    const next = reindex([...list, blankHeroSlide(list.length)]);
    onChange(next);
    setDraft({ ...next[next.length - 1] });
    setEditIdx(next.length - 1);
  };
  const delSlide = (i) => {
    if (!window.confirm("Delete this slide?")) return;
    onChange(reindex(list.filter((_, idx) => idx !== i)));
    if (editIdx === i) cancelEdit();
  };
  const toggleActive = (i) => onChange(list.map((s, idx) => (idx === i ? { ...s, active: !(s.active !== false) } : s)));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(reindex(next));
  };

  const doUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try { const { url } = await uploadImage(file); if (url) setD("backgroundImage", url); }
    catch { /* surfaced by the page toast on save */ }
    finally { setUploading(false); }
  };

  return (
    <div className="rounded-lg border border-black/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Hero Carousel</p>
        <span className="text-[12px] text-neutral-400">{list.length} slide{list.length === 1 ? "" : "s"}</span>
      </div>

      {/* Slide list */}
      <div className="space-y-2">
        {list.map((s, i) => (
          <div key={s.id || i} className="rounded-lg border border-black/10">
            <div className="flex items-center gap-3 p-2.5">
              <span className="w-6 shrink-0 text-center text-[12px] font-bold text-neutral-400">{i + 1}</span>
              <SlideThumb slide={s} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{s.heading || <span className="text-neutral-400">No heading</span>}</p>
                <p className="truncate text-[11px] text-neutral-400">{s.backgroundType}{s.clickEnabled ? " · clickable" : ""}</p>
              </div>
              <div className="flex shrink-0 flex-col items-center">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-neutral-400 disabled:opacity-30" aria-label="Move up">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === list.length - 1} className="px-1 text-neutral-400 disabled:opacity-30" aria-label="Move down">↓</button>
              </div>
              <Toggle on={s.active !== false} onChange={() => toggleActive(i)} label="Active" />
              <button onClick={() => (editIdx === i ? cancelEdit() : openEdit(i))} className="rounded-full border border-brand px-3 py-1 text-[12px] font-bold text-brand hover:bg-brand-softer">{editIdx === i ? "Close" : "Edit"}</button>
              <button onClick={() => delSlide(i)} className="rounded-full border border-red-200 px-3 py-1 text-[12px] font-bold text-red-600 hover:bg-red-50">Delete</button>
            </div>

            {/* Inline editor */}
            {editIdx === i && draft && (
              <div className="space-y-4 border-t border-black/10 bg-neutral-50/60 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Background Type</Label>
                    <select className={inputCls} value={draft.backgroundType} onChange={(e) => setD("backgroundType", e.target.value)}>
                      <option value="gradient">Gradient</option>
                      <option value="image">Image</option>
                      <option value="color">Solid Colour</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <Label>Overlay Darkness — {Math.round(draft.overlayDarkness ?? 55)}%</Label>
                    <input type="range" min={0} max={100} value={draft.overlayDarkness ?? 55} onChange={(e) => setD("overlayDarkness", Number(e.target.value))} className="w-full accent-brand" />
                  </div>
                </div>

                {draft.backgroundType === "image" && (
                  <div className="rounded-lg bg-white p-3">
                    <Label>Background Image <span className="font-normal text-neutral-400">(recommended 1920×600px, ≤3MB)</span></Label>
                    {draft.backgroundImage ? <img src={draft.backgroundImage} alt="slide bg" className="mb-2 h-24 w-full rounded object-contain" /> : null}
                    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(e) => doUpload(e.target.files?.[0])} className="text-[13px]" />
                    {uploading && <span className="ml-2 text-[12px] text-neutral-400">Uploading…</span>}
                    {draft.backgroundImage && !uploading && <button onClick={() => setD("backgroundImage", "")} className="ml-2 text-[12px] font-bold text-red-600">Remove</button>}
                  </div>
                )}
                {draft.backgroundType === "color" && (
                  <div><Label>Background Colour</Label><input type="color" value={draft.backgroundColor || "#1C1C1E"} onChange={(e) => setD("backgroundColor", e.target.value)} className="h-9 w-24 rounded border border-black/10" /></div>
                )}

                <Field label="Heading"><input className={inputCls} value={draft.heading} onChange={(e) => setD("heading", e.target.value)} placeholder="Leave blank for an image-only slide (no text overlay)" /></Field>
                <Field label="Subheading"><input className={inputCls} value={draft.subheading} onChange={(e) => setD("subheading", e.target.value)} /></Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="CTA Text"><input className={inputCls} value={draft.ctaText} onChange={(e) => setD("ctaText", e.target.value)} placeholder="Shop Laptops" /></Field>
                  <Field label="CTA Link"><input className={inputCls} value={draft.ctaLink} onChange={(e) => setD("ctaLink", e.target.value)} placeholder="/products/laptops" /></Field>
                  <Field label="Secondary CTA Text"><input className={inputCls} value={draft.ctaSecondaryText} onChange={(e) => setD("ctaSecondaryText", e.target.value)} /></Field>
                  <Field label="Secondary CTA Link"><input className={inputCls} value={draft.ctaSecondaryLink} onChange={(e) => setD("ctaSecondaryLink", e.target.value)} /></Field>
                </div>

                <div className="rounded-lg bg-white p-3">
                  <label className="flex items-center justify-between"><span className="text-[13px] font-semibold text-neutral-600">Whole slide clickable</span><Toggle on={!!draft.clickEnabled} onChange={(v) => setD("clickEnabled", v)} /></label>
                  {draft.clickEnabled && <div className="mt-2"><Field label="Click URL"><input className={inputCls} value={draft.clickUrl} onChange={(e) => setD("clickUrl", e.target.value)} placeholder="/flash-sale" /></Field></div>}
                </div>

                <label className="flex items-center justify-between"><span className="text-[13px] font-semibold text-neutral-600">Slide active (shown on site)</span><Toggle on={draft.active !== false} onChange={(v) => setD("active", v)} /></label>

                <div><Label>Live Preview</Label><SlidePreview s={draft} /></div>

                <div className="flex gap-2">
                  <button onClick={saveSlide} className="rounded-full bg-brand px-5 py-2 text-[13px] font-bold text-white hover:bg-brand-dark">Save Slide</button>
                  <button onClick={cancelEdit} className="rounded-full border border-black/10 px-5 py-2 text-[13px] font-bold text-ink hover:border-brand hover:text-brand">Cancel</button>
                </div>
                <p className="text-[11px] text-neutral-400">“Save Slide” applies your edits; click the page’s “Save Changes” at the bottom to persist to the database.</p>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="rounded-lg border border-dashed border-black/10 bg-neutral-50 px-4 py-6 text-center text-[13px] text-neutral-400">No slides yet. Add one below.</p>}
      </div>

      <button onClick={addSlide} className="mt-3 rounded-full bg-brand px-4 py-2 text-[13px] font-bold text-white hover:bg-brand-dark">+ Add New Slide</button>
    </div>
  );
}
