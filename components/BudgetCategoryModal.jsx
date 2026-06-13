"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon } from "@/components/Icons";
import { CATEGORY_TILES, CatIcon } from "@/components/CategoryTiles";
import { categoryColor } from "@/lib/categoryColors";

/* Budget → category picker. `tier` = { cap, min, max }. Picking a category
   navigates to that category filtered to the tier's price range. Pure-CSS
   enter/exit animation; ESC + backdrop close; focus trapped; focus returns to
   the trigger (handled by the parent's onClose). */
export default function BudgetCategoryModal({ tier, onClose }) {
  const router = useRouter();
  const dialogRef = useRef(null);
  const [closing, setClosing] = useState(false);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    // let the exit animation play, then unmount + return focus (parent)
    setTimeout(onClose, 200);
  };

  const pick = (slug) => {
    // Navigation unmounts the homepage; no need to animate out first.
    router.push(`/products/${slug}?minPrice=${tier.min}&maxPrice=${tier.max}`);
  };

  // ESC + simple focus trap; lock body scroll while open.
  useEffect(() => {
    const el = dialogRef.current;
    const focusables = () =>
      el ? Array.from(el.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')).filter((n) => !n.disabled && n.offsetParent !== null) : [];

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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        aria-label={`Shop ${tier.cap}`}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-h-[90vh] w-full max-w-[900px] overflow-y-auto rounded-2xl bg-white p-7 shadow-card-hover ${closing ? "picker-scale-out" : "picker-scale-in"}`}
      >
        <button
          onClick={requestClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-ink"
        >
          <CloseIcon style={{ width: 18, height: 18 }} />
        </button>

        <p className="flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-[#B8860B]">
          <span className="inline-block h-px w-5 shrink-0 bg-[#B8860B]" aria-hidden="true" />
          Choose a Category
        </p>
        <h2 className="mt-2 font-display text-[1.6rem] font-bold tracking-[-0.02em] text-dark">Shop {tier.cap}</h2>
        <p className="mt-1 text-sm text-muted">Pick a category to browse in this budget.</p>

        {/* Compact category tiles — 5 across (wrap 3 → 2 on smaller screens) */}
        <div className="mt-6 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_TILES.map((c) => {
            const cc = categoryColor(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => pick(c.slug)}
                className="budget-tile flex flex-col items-center rounded-xl border border-warm-border bg-white p-4 text-center transition-[border-color,box-shadow] duration-200 ease-out"
                style={{ "--cc": cc.color }}
              >
                <span className="text-dark">
                  <CatIcon slug={c.slug} size={26} />
                </span>
                <span className="mt-3 block h-[2px] w-6 rounded-full" style={{ background: cc.color }} aria-hidden="true" />
                <span className="mt-3 text-[0.9rem] font-bold leading-tight text-dark">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
