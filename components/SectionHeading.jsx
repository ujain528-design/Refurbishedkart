"use client";

import { useEffect, useRef, useState } from "react";

/* Section heading — optional amber eyebrow + green underline that draws
   left→right (0→48px) when the heading scrolls into view. Self-observing;
   reduced-motion shows it immediately. */
export default function SectionHeading({ title, subtitle, eyebrow, accent, children }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) { setShown(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2.5 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-[#B8860B]">
            <span className="inline-block h-px w-5 shrink-0 bg-[#B8860B]" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-[2.25rem] font-bold tracking-[-0.02em] text-dark">{title}</h2>
        <span
          className={`mt-3 block h-[3px] rounded-full transition-[width] duration-[600ms] ease-out ${accent ? "" : "bg-brand"}`}
          style={accent ? { width: shown ? 48 : 0, background: accent } : { width: shown ? 48 : 0 }}
          aria-hidden="true"
        />
        {subtitle && <p className="mt-3 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
