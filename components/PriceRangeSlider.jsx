"use client";

import { formatINR } from "@/lib/data";

const STEP = 1000;

/* Dual-handle range slider: two native range inputs stacked on one track.
   Thumbs are clickable (pointer-events re-enabled in .range-thumb CSS). */
export default function PriceRangeSlider({ min, max, value, onChange }) {
  const [lo, hi] = value;
  const pct = (v) => ((v - min) / (max - min)) * 100;

  return (
    <div>
      <div className="relative h-7">
        {/* track */}
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200" />
        {/* active segment */}
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={STEP}
          value={lo}
          aria-label="Minimum price"
          onChange={(e) => onChange([Math.min(+e.target.value, hi - STEP), hi])}
          className="range-thumb absolute left-0 top-1/2 h-1 w-full -translate-y-1/2"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={STEP}
          value={hi}
          aria-label="Maximum price"
          onChange={(e) => onChange([lo, Math.max(+e.target.value, lo + STEP)])}
          className="range-thumb absolute left-0 top-1/2 h-1 w-full -translate-y-1/2"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[13px] font-semibold text-ink">
        <span>{formatINR(lo)}</span>
        <span>{formatINR(hi)}</span>
      </div>
    </div>
  );
}
