"use client";

import { useState } from "react";
import { submitReview } from "@/lib/api";

/* Verified-purchase review form: stars + optional title + text + up to 3 photos
   (uploaded and/or picked from the product's own images). Submits multipart to
   /api/reviews (pending → admin approval). Reused on the PDP and account modal. */

const MAX_IMAGES = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`text-2xl leading-none transition-colors ${n <= value ? "text-amber-400" : "text-neutral-300 hover:text-amber-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm({ productId, productImages = [], onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Images: uploaded files (with preview URLs) + selected product-image URLs.
  const [tab, setTab] = useState("upload"); // "upload" | "product"
  const [uploads, setUploads] = useState([]); // [{ file, preview }]
  const [selected, setSelected] = useState([]); // product image URLs
  const [dragOver, setDragOver] = useState(false);

  const total = uploads.length + selected.length;
  const remaining = MAX_IMAGES - total;

  const addFiles = (fileList) => {
    setErr("");
    const files = Array.from(fileList || []);
    const next = [];
    for (const file of files) {
      if (next.length + uploads.length + selected.length >= MAX_IMAGES) { setErr(`You can add up to ${MAX_IMAGES} photos.`); break; }
      if (!ACCEPT.includes(file.type)) { setErr("Only JPEG, PNG or WebP images are allowed."); continue; }
      if (file.size > MAX_BYTES) { setErr("Each image must be 5MB or less."); continue; }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    if (next.length) setUploads((u) => [...u, ...next]);
  };

  const removeUpload = (i) => setUploads((u) => { const c = u[i]; if (c) URL.revokeObjectURL(c.preview); return u.filter((_, idx) => idx !== i); });
  const toggleProductImage = (url) => {
    setErr("");
    setSelected((s) => {
      if (s.includes(url)) return s.filter((x) => x !== url);
      if (uploads.length + s.length >= MAX_IMAGES) { setErr(`You can add up to ${MAX_IMAGES} photos.`); return s; }
      return [...s, url];
    });
  };

  const submit = async () => {
    setErr("");
    if (!rating) { setErr("Please select a star rating"); return; }
    if (body.trim().length < 20) { setErr("Review must be at least 20 characters"); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("productId", String(productId));
      fd.append("rating", String(rating));
      fd.append("title", title.trim());
      fd.append("body", body.trim());
      fd.append("productImages", JSON.stringify(selected));
      uploads.forEach(({ file }) => fd.append("photos", file));
      await submitReview(fd);
      uploads.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setDone(true);
      onSubmitted?.();
    } catch (e) {
      setErr(e.message || "Couldn't submit your review");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return <p className="rounded-lg bg-brand-soft/60 px-4 py-3 text-sm font-semibold text-brand">Review submitted! It will appear after approval.</p>;
  }

  const inp = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";
  const tabCls = (t) => `rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors ${tab === t ? "bg-brand text-white" : "border border-black/10 text-neutral-600 hover:border-brand"}`;

  return (
    <div className="space-y-3">
      <div>
        <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Your rating</span>
        <Stars value={rating} onChange={setRating} />
      </div>
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Title <span className="font-normal text-neutral-400">(optional)</span></span>
        <input maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a line" className={inp} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Your review</span>
        <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What did you like or dislike? (minimum 20 characters)" className={inp} />
        <span className="mt-1 block text-[11px] text-neutral-400">{body.trim().length} / 20 minimum</span>
      </label>

      {/* ── Photos ── */}
      <div>
        <span className="block text-[12px] font-semibold text-neutral-600">Add Photos <span className="font-normal text-neutral-400">(optional)</span></span>
        <span className="mb-2 block text-[11px] text-neutral-400">Upload your own photo or select from product images · {total}/{MAX_IMAGES}</span>

        <div className="mb-2 flex gap-2">
          <button type="button" onClick={() => setTab("upload")} className={tabCls("upload")}>Upload Photo</button>
          {productImages.length > 0 && <button type="button" onClick={() => setTab("product")} className={tabCls("product")}>Use Product Images</button>}
        </div>

        {tab === "upload" ? (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (remaining > 0) addFiles(e.dataTransfer?.files); }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 text-center text-[12px] text-neutral-500 transition-colors ${dragOver ? "border-brand bg-brand-softer/40" : "border-black/15 hover:border-brand"} ${remaining <= 0 ? "pointer-events-none opacity-50" : ""}`}
          >
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={remaining <= 0} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            <span className="text-xl">＋</span>
            <span>{remaining > 0 ? "Click or drop images — JPEG / PNG / WebP, ≤ 5MB each" : "Maximum photos reached"}</span>
          </label>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {productImages.map((url) => {
              const on = selected.includes(url);
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => toggleProductImage(url)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 ${on ? "border-brand" : "border-black/10 hover:border-brand/50"}`}
                  aria-pressed={on}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Product" className="h-full w-full object-contain p-1" />
                  {on && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* combined preview strip */}
        {(uploads.length > 0 || selected.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {uploads.map((u, i) => (
              <div key={`u${i}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.preview} alt="Upload preview" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeUpload(i)} aria-label="Remove photo" className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[11px] font-bold text-red-600 shadow">×</button>
              </div>
            ))}
            {selected.map((url) => (
              <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-brand/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Selected product" className="h-full w-full object-contain p-0.5" />
                <button type="button" onClick={() => toggleProductImage(url)} aria-label="Remove photo" className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[11px] font-bold text-red-600 shadow">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {err && <p className="text-[13px] font-semibold text-red-600">{err}</p>}
      <button onClick={submit} disabled={submitting} className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}
