"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/data";
import { generateProductTitle } from "@/lib/generateTitle";
import { categoryColor } from "@/lib/categoryColors";
import { formatPorts } from "@/lib/ports";
import { getProducts } from "@/lib/api";
import { CloseIcon, BrokenDeviceIcon } from "@/components/Icons";
import AddToCartButton from "@/components/AddToCartButton";

const priceOf = (p) => Number(p.price ?? p.listedPrice ?? 0) || 0;
const titleOf = (p) => p.generatedTitle || generateProductTitle(p) || p.name;
const hrefOf = (p) => `/products/${(p.category || "laptops").toLowerCase()}/${p.slug || p.id}`;
const stockLabel = (p) => {
  const s = p.chassisStock ?? p.stock ?? 0;
  return s === 0 ? "Out of stock" : s <= 5 ? `Only ${s} left` : "In stock";
};
const ramText = (p) => (p.defaultRam?.capacity ? `${p.defaultRam.capacity}${p.defaultRam.type ? ` ${p.defaultRam.type}` : ""}` : null);
const ssdText = (p) => (p.defaultSsd?.capacity ? `${p.defaultSsd.capacity} SSD` : null);
const toGB = (s) => {
  if (!s) return 0;
  const m = String(s).match(/([\d.]+)\s*(TB|GB)/i);
  return m ? Math.round(parseFloat(m[1]) * (/tb/i.test(m[2]) ? 1024 : 1)) : 0;
};

const yesno = (v) => (v == null || v === "" ? undefined : v ? "Yes" : "No");

// Spec rows. `num` (when present) drives "best" highlighting (higher = better).
// `cats` (when present) limits a row to those categories — Compare is same-category,
// so this keeps each category's table to its relevant specs.
const ROWS = [
  { key: "processor", label: "Processor", get: (p) => p.attrs?.processor },
  { key: "gen", label: "Generation", get: (p) => p.attrs?.gen },
  { key: "ramType", label: "RAM Type", get: (p) => p.attrs?.ramType },
  { key: "ram", label: "RAM", get: ramText, num: (p) => toGB(p.defaultRam?.capacity) },
  { key: "ramExp", label: "RAM Expandability", get: (p) => p.attrs?.ramExpandability, cats: ["Laptops", "Workstations", "Desktops"] },
  { key: "ssd", label: "Storage", get: ssdText, num: (p) => toGB(p.defaultSsd?.capacity) },
  { key: "gpu", label: "Graphics (GPU)", get: (p) => p.attrs?.gpu, cats: ["Laptops", "Workstations", "Desktops"] },
  { key: "formFactor", label: "Form Factor", get: (p) => p.attrs?.formFactor || p.attrs?.chassis, cats: ["Desktops", "Servers", "Workstations"] },
  { key: "screen", label: "Display", get: (p) => p.attrs?.screen, cats: ["Laptops", "Monitors", "Desktops"] },
  { key: "res", label: "Resolution", get: (p) => p.attrs?.resolution, cats: ["Laptops", "Monitors", "Desktops"] },
  { key: "panel", label: "Panel", get: (p) => p.attrs?.panel, cats: ["Laptops", "Monitors"] },
  { key: "aspect", label: "Aspect Ratio", get: (p) => p.attrs?.aspectRatio, cats: ["Monitors"] },
  { key: "touch", label: "Touchscreen", get: (p) => yesno(p.attrs?.touchscreen), cats: ["Laptops"] },
  { key: "battery", label: "Battery Health", get: (p) => p.attrs?.batteryHealth, cats: ["Laptops"] },
  { key: "backlit", label: "Backlit Keyboard", get: (p) => yesno(p.attrs?.backlitKeyboard), cats: ["Laptops"] },
  { key: "webcam", label: "Webcam", get: (p) => yesno(p.attrs?.webcam), cats: ["Laptops"] },
  { key: "brightness", label: "Brightness", get: (p) => (p.attrs?.brightness ? `${p.attrs.brightness} nits` : undefined), cats: ["Monitors"] },
  { key: "response", label: "Response Time", get: (p) => (p.attrs?.responseTime ? `${p.attrs.responseTime} ms` : undefined), cats: ["Monitors"] },
  { key: "hdr", label: "HDR", get: (p) => yesno(p.attrs?.hdr), cats: ["Monitors"] },
  { key: "vesa", label: "VESA Mount", get: (p) => yesno(p.attrs?.vesaMount), cats: ["Monitors"] },
  { key: "speakers", label: "Built-in Speakers", get: (p) => yesno(p.attrs?.builtInSpeakers), cats: ["Monitors"] },
  { key: "psu", label: "Power Supply", get: (p) => p.attrs?.psu, cats: ["Workstations", "Desktops"] },
  { key: "driveBays", label: "Drive Bays", get: (p) => (p.attrs?.driveBays ? String(p.attrs.driveBays) : undefined), cats: ["Servers"] },
  { key: "raid", label: "RAID Support", get: (p) => p.attrs?.raid, cats: ["Servers"] },
  { key: "redundant", label: "Redundant Power", get: (p) => yesno(p.attrs?.redundantPower), cats: ["Servers"] },
  { key: "weight", label: "Weight", get: (p) => p.attrs?.weight, cats: ["Laptops", "Monitors"] },
  { key: "os", label: "Operating System", get: (p) => p.attrs?.os },
  { key: "warranty", label: "Warranty", get: (p) => p.attrs?.warranty },
  { key: "ports", label: "Ports", get: (p) => formatPorts(p.ports) },
  { key: "condition", label: "Condition", get: (p) => p.attrs?.grade || p.attrs?.condition },
  { key: "stock", label: "Availability", get: stockLabel },
];

function Thumb({ p }) {
  return (p.image || p.images?.[0]) ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.image || p.images?.[0]} alt={titleOf(p)} className="mx-auto h-24 w-full rounded-lg bg-warm-alt object-contain p-2" loading="lazy" />
  ) : (
    <div className="mx-auto flex h-24 w-full items-center justify-center rounded-lg bg-neutral-100 text-neutral-300">
      <BrokenDeviceIcon style={{ width: 36, height: 36 }} />
    </div>
  );
}

export default function CompareModal({ product, onClose }) {
  const dialogRef = useRef(null);
  const [closing, setClosing] = useState(false);
  const [phase, setPhase] = useState("pick"); // pick | table
  const [candidates, setCandidates] = useState(null); // null=loading
  const [selected, setSelected] = useState([]); // product ids (max 2)
  const [query, setQuery] = useState("");

  const cc = categoryColor(product.category);

  // Same-category products excluding the current one.
  useEffect(() => {
    let alive = true;
    getProducts({ category: product.category, exclude: product.id })
      .then((rows) => alive && setCandidates(rows || []))
      .catch(() => alive && setCandidates([]));
    return () => { alive = false; };
  }, [product.category, product.id]);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 200);
  };

  // ESC + focus trap + scroll lock.
  useEffect(() => {
    const el = dialogRef.current;
    const focusables = () => (el ? Array.from(el.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])')).filter((n) => !n.disabled && n.offsetParent !== null) : []);
    focusables()[0]?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); requestClose(); return; }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 2 ? s : [...s, id]));

  const chosen = (candidates || []).filter((c) => selected.includes(c.id));
  const cols = [product, ...chosen]; // current + up to 2

  // Live, case-insensitive search over name / brand / processor / title.
  const q = query.trim().toLowerCase();
  const visible = (candidates || []).filter((p) => {
    if (!q) return true;
    const hay = `${titleOf(p)} ${p.name || ""} ${p.brand || ""} ${p.attrs?.processor || ""}`.toLowerCase();
    return q.split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
  });

  // Best-value column index per highlightable row (only when values vary).
  const bestIdx = (row) => {
    if (!row.num) return new Set();
    const vals = cols.map(row.num);
    const max = Math.max(...vals);
    if (max <= 0 || vals.filter((v) => v === max).length === cols.length) return new Set();
    return new Set(vals.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0));
  };
  const priceBest = (() => {
    const vals = cols.map(priceOf).map((v) => (v > 0 ? v : Infinity));
    const min = Math.min(...vals);
    if (!isFinite(min) || vals.filter((v) => v === min).length === cols.length) return new Set();
    return new Set(vals.map((v, i) => (v === min ? i : -1)).filter((i) => i >= 0));
  })();

  return (
    <div
      className={`fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-[3px] ${closing ? "picker-fade-out" : "picker-fade-in"}`}
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={requestClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Compare ${product.category}`}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-card-hover sm:p-7 ${phase === "table" ? "max-w-[1000px]" : "max-w-[760px]"} ${closing ? "picker-scale-out" : "picker-scale-in"}`}
      >
        <button onClick={requestClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-ink">
          <CloseIcon style={{ width: 18, height: 18 }} />
        </button>

        <p className="flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-[#B8860B]">
          <span className="inline-block h-px w-5 shrink-0 bg-[#B8860B]" aria-hidden="true" />
          Compare
        </p>
        <h2 className="mt-2 font-display text-[1.6rem] font-bold tracking-[-0.02em] text-dark">Compare {product.category}</h2>

        {phase === "pick" ? (
          <>
            <p className="mt-1 text-sm text-muted">
              Select up to 2 to compare against <span className="font-semibold text-ink">{titleOf(product)}</span>.
            </p>

            {candidates === null ? (
              <p className="py-12 text-center text-sm text-neutral-400">Loading…</p>
            ) : candidates.length === 0 ? (
              <p className="py-12 text-center text-sm text-neutral-500">No other {String(product.category).toLowerCase()} available to compare.</p>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${String(product.category).toLowerCase()}…`}
                    aria-label={`Search ${String(product.category).toLowerCase()}`}
                    className="w-full rounded-lg border border-warm-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-ink focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                  <span className="shrink-0 text-[12px] font-semibold text-neutral-500">{selected.length} selected</span>
                </div>

                {visible.length === 0 ? (
                  <p className="py-12 text-center text-sm text-neutral-500">No products match “{query.trim()}”.</p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {visible.map((p) => {
                  const isSel = selected.includes(p.id);
                  const atMax = selected.length >= 2 && !isSel;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(p.id)}
                      disabled={atMax}
                      aria-pressed={isSel}
                      className={`relative flex flex-col rounded-xl border bg-white p-3 text-left transition-colors duration-200 ${isSel ? "" : "border-warm-border hover:border-ink"} ${atMax ? "cursor-not-allowed opacity-45" : ""}`}
                      style={isSel ? { borderColor: cc.color, boxShadow: `inset 0 0 0 1px ${cc.color}` } : undefined}
                    >
                      {isSel && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: cc.color }}>✓</span>
                      )}
                      <Thumb p={p} />
                      <span className="mt-2 line-clamp-2 text-[12px] font-semibold leading-snug text-dark">{titleOf(p)}</span>
                      <span className="mt-1 line-clamp-1 text-[11px] text-muted">
                        {[p.attrs?.processor, ramText(p), ssdText(p)].filter(Boolean).join(" · ") || "—"}
                      </span>
                      <span className="mt-1.5 text-[13px] font-bold text-ink">{formatINR(priceOf(p))}</span>
                    </button>
                  );
                    })}
                  </div>
                )}
              </>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <span className="text-[12px] text-neutral-400">{selected.length}/2 selected</span>
              <button
                type="button"
                disabled={selected.length === 0}
                onClick={() => setPhase("table")}
                className="rounded-full bg-dark px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2c2c2e] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Compare Now{selected.length ? ` (${selected.length + 1})` : ""}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-3">
              <button type="button" onClick={() => setPhase("pick")} className="inline-flex items-center gap-1 text-sm font-semibold text-ink transition-colors hover:text-[#B8860B]">
                <span aria-hidden="true">←</span> Back to selection
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-[130px]" />
                    {cols.map((p, i) => (
                      <th key={p.id} className="border-b border-warm-border px-3 pb-3 align-top">
                        <Thumb p={p} />
                        <span className="mt-2 block line-clamp-2 text-[12px] font-semibold leading-snug text-dark">{titleOf(p)}</span>
                        {i === 0 && <span className="mt-1 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">This product</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Price */}
                  <tr className="border-b border-black/5">
                    <th className="px-3 py-2.5 text-left text-[12px] font-semibold text-neutral-500">Price</th>
                    {cols.map((p, i) => {
                      const mrp = Number(p.mrp ?? 0) || 0;
                      return (
                        <td key={p.id} className={`px-3 py-2.5 ${priceBest.has(i) ? "font-extrabold text-ink" : "font-semibold text-ink"}`}>
                          {formatINR(priceOf(p))}
                          {mrp > priceOf(p) ? <span className="ml-1.5 text-[12px] font-normal text-neutral-400 line-through">{formatINR(mrp)}</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                  {ROWS.filter((row) => !row.cats || row.cats.includes(product.category)).map((row) => {
                    const best = bestIdx(row);
                    return (
                      <tr key={row.key} className="border-b border-black/5">
                        <th className="px-3 py-2.5 text-left text-[12px] font-semibold text-neutral-500">{row.label}</th>
                        {cols.map((p, i) => {
                          const v = row.get(p);
                          return (
                            <td key={p.id} className={`px-3 py-2.5 text-[13px] ${best.has(i) ? "font-bold text-ink" : "text-neutral-700"}`}>
                              {v || "—"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td />
                    {cols.map((p) => (
                      <td key={p.id} className="px-3 pt-4 align-top">
                        <AddToCartButton product={p} className="block w-full rounded-md bg-dark py-2 text-center text-[12px] font-bold text-white transition-colors hover:bg-[#2c2c2e]">
                          Add to Cart
                        </AddToCartButton>
                        <Link href={hrefOf(p)} className="mt-2 block rounded-md border border-warm-border py-2 text-center text-[12px] font-bold text-ink transition-colors hover:border-ink">
                          View
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
