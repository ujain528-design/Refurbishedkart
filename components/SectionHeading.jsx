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
    <div ref={ref} className="mb-4 flex flex-wrap items-end justify-between gap-3 lg:mb-8 lg:gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1.5 flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-[#B8860B] lg:mb-2.5 lg:text-[0.75rem]">
            <span className="inline-block h-px w-4 shrink-0 bg-[#B8860B] lg:w-5" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-[1.3rem] font-bold leading-tight tracking-[-0.02em] text-dark lg:text-[2.25rem] lg:leading-tight">{title}</h2>
        <span
          className={`mt-2 block h-[3px] rounded-full transition-[width] duration-[600ms] ease-out lg:mt-3 ${accent ? "" : "bg-brand"}`}
          style={accent ? { width: shown ? 48 : 0, background: accent } : { width: shown ? 48 : 0 }}
          aria-hidden="true"
        />
        {subtitle && <p className="mt-2 text-[0.8rem] text-muted lg:mt-3 lg:text-sm">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
