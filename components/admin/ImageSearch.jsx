"use client";

import { useEffect, useState } from "react";
import { searchProductImages, fetchProductImage } from "@/lib/api";

/* Reusable product-image search + select + process panel.

   Props:
     defaultQuery  — pre-filled search text (e.g. the product name)
     onAdd(urls)   — called with the processed /uploads/... URLs to append
     onClose()     — optional; renders a Cancel control when provided
     max           — max images selectable at once (default 5)

   Flow: search (Google CSE) → pick up to `max` thumbnails → "Use Selected"
   fetches + normalises each one server-side and hands back the saved URLs. */
export default function ImageSearch({ defaultQuery = "", onAdd, onClose, max = 5 }) {
  const [query, setQuery] = useState(defaultQuery);
  const [status, setStatus] = useState("idle"); // idle | searching | error
  const [errMsg, setErrMsg] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]); // array of urls (ordered)
  const [progress, setProgress] = useState(null); // "1/3" while processing
  const [busy, setBusy] = useState(false);

  useEffect(() => { setQuery(defaultQuery); }, [defaultQuery]);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setStatus("searching");
    setErrMsg("");
    setSelected([]);
    try {
      const { images } = await searchProductImages(q);
      setResults(images || []);
      setStatus("idle");
    } catch (e) {
      setErrMsg(e.message || "Search failed");
      setStatus("error");
    }
  };

  const toggle = (url) => {
    setSelected((s) => {
      if (s.includes(url)) return s.filter((u) => u !== url);
      if (s.length >= max) return s; // cap reached
      return [...s, url];
    });
  };

  const useSelected = async () => {
    if (!selected.length || busy) return;
    setBusy(true);
    const added = [];
    try {
      for (let i = 0; i < selected.length; i++) {
        setProgress(`${i + 1}/${selected.length}`);
        try {
          const { url } = await fetchProductImage(selected[i]);
          if (url) added.push(url);
        } catch { /* skip the one that failed, keep going */ }
      }
      if (added.length) onAdd?.(added);
    } finally {
      setProgress(null);
      setBusy(false);
      setSelected([]);
    }
  };

  return (
    <div className="rounded-lg border border-black/10 bg-neutral-50/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search images (e.g. Dell Latitude 7420)"
          className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
        />
        <button onClick={search} disabled={status === "searching" || !query.trim()} className="rounded-full bg-brand px-4 py-2 text-[13px] font-bold text-white hover:bg-brand-dark disabled:opacity-50">
          {status === "searching" ? "Searching…" : "Search"}
        </button>
        {onClose && <button onClick={onClose} className="rounded-full border border-black/10 px-4 py-2 text-[13px] font-bold text-ink hover:border-brand hover:text-brand">Cancel</button>}
      </div>

      {status === "error" && <p className="mt-2 text-[12px] font-semibold text-red-600">{errMsg}</p>}

      {status === "searching" && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-lg bg-neutral-200" />)}
        </div>
      )}

      {status !== "searching" && results.length > 0 && (
        <>
          <p className="mt-3 text-[12px] text-neutral-500">{selected.length}/{max} selected · click thumbnails to choose.</p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {results.map((img, i) => {
              const isSel = selected.includes(img.url);
              const order = selected.indexOf(img.url) + 1;
              return (
                <button
                  key={img.url + i}
                  type="button"
                  onClick={() => toggle(img.url)}
                  title={img.source}
                  className={`group relative aspect-square overflow-hidden rounded-lg border bg-white ${isSel ? "border-brand ring-2 ring-brand/40" : "border-black/10 hover:border-brand/50"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumbnail} alt={img.title || "result"} className="h-full w-full object-contain p-1" loading="lazy" />
                  {/* source domain on hover */}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">{img.source}</span>
                  {isSel && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white shadow">{order}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={useSelected} disabled={!selected.length || busy} className="rounded-full bg-dark px-5 py-2 text-[13px] font-bold text-white hover:bg-[#2c2c2e] disabled:opacity-40">
              {busy ? `Processing ${progress}…` : `Use Selected Image${selected.length === 1 ? "" : "s"}${selected.length ? ` (${selected.length})` : ""}`}
            </button>
            {selected.length > 0 && !busy && <button onClick={() => setSelected([])} className="text-[12px] font-semibold text-neutral-400 underline hover:text-ink">Clear</button>}
          </div>
        </>
      )}

      {status === "idle" && results.length === 0 && query.trim() && (
        <p className="mt-3 text-[12px] text-neutral-400">No results yet — press Search.</p>
      )}
    </div>
  );
}
