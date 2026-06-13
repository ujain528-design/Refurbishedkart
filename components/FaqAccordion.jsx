"use client";

import { useState } from "react";

/* Simple expand/collapse FAQ accordion. First item open by default. */
export default function FaqAccordion({ items = [] }) {
  const [open, setOpen] = useState(0);
  if (!items.length) return null;

  return (
    <div className="divide-y divide-black/5 overflow-hidden rounded-card border border-black/5 bg-white shadow-card">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-ink">{it.q}</span>
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {isOpen && <p className="px-5 pb-4 text-[13px] leading-relaxed text-neutral-600">{it.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
