"use client";

import { useState } from "react";
import { submitReview } from "@/lib/api";

/* Verified-purchase review form (stars + optional title + text). Reused on the PDP
   and in the account order modal. Submits to /api/reviews (pending → admin approval). */
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

export default function ReviewForm({ productId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr("");
    if (!rating) { setErr("Please select a star rating"); return; }
    if (body.trim().length < 20) { setErr("Review must be at least 20 characters"); return; }
    setSubmitting(true);
    try {
      await submitReview({ productId, rating, title: title.trim(), body: body.trim() });
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
      {err && <p className="text-[13px] font-semibold text-red-600">{err}</p>}
      <button onClick={submit} disabled={submitting} className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}
