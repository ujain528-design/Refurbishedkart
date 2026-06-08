"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OPEN_BULK_MODAL_EVENT } from "@/components/BulkEnquiryTrigger";

const AUTOPLAY_MS = 4000;

/* Poster slides — gradient placeholders until real poster art is ready.
   Swap `gradient` for a bg image per slide when assets arrive. */
// clickable: whole slide navigates to the CTA target. false = display-only
// (no navigation anywhere, CTA disabled). Slide 2 is set false to test it.
const SLIDES = [
  {
    id: "laptops",
    gradient: "bg-gradient-to-br from-[#0E3D12] via-brand to-brand-mid",
    headline: "Premium Refurbished Laptops",
    sub: "Certified, tested, ready to work",
    cta: { label: "Shop Now", href: "/products/laptops" },
    clickable: true,
  },
  {
    id: "flash",
    gradient: "bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800",
    headline: "Flash Sale — Up to 60% Off",
    sub: "Limited stock, limited time",
    cta: { label: "Shop Flash Sale", href: "/flash-sale" },
    clickable: false,
  },
  {
    id: "bulk",
    gradient: "bg-gradient-to-br from-neutral-950 via-neutral-800 to-neutral-600",
    headline: "Business Bulk Orders",
    sub: "GST invoice, uniform spec, PAN India delivery",
    cta: { label: "Get a Quote", bulk: true },
    clickable: true,
  },
];

const ctaCls =
  "inline-block rounded-full bg-white px-7 py-3 text-sm font-bold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover";

export default function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const router = useRouter();

  const go = (i) => setIdx((i + SLIDES.length) % SLIDES.length);

  // whole-slide click → CTA target (FIX 4). No-op for display-only slides.
  const slideClick = (s) => {
    if (!s.clickable) return;
    if (s.cta.bulk) window.dispatchEvent(new CustomEvent(OPEN_BULK_MODAL_EVENT));
    else router.push(s.cta.href);
  };

  /* Auto-play: re-arms whenever idx changes, so any manual jump (arrow,
     dot, swipe) naturally resets the 4s timer. Paused while hovered. */
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(idx + 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [idx, paused]);

  const onTouchStart = (e) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1));
    touchX.current = null;
  };

  return (
    <section
      aria-label="Featured offers"
      className="group relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* sliding track */}
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {SLIDES.map((s) => (
          <div
            key={s.id}
            onClick={() => slideClick(s)}
            className={`relative h-[380px] w-full shrink-0 md:h-[460px] ${s.gradient} ${s.clickable ? "cursor-pointer" : "cursor-default"}`}
            aria-hidden={SLIDES[idx].id !== s.id}
          >
            {/* poster copy — bottom-left desktop, centered mobile */}
            <div className="absolute inset-0 flex items-end pb-16 md:pb-20">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center md:items-start md:text-left">
                  <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                    {s.headline}
                  </h2>
                  <p className="mt-3 text-[15px] text-white/75 md:text-lg">{s.sub}</p>
                  <div className="mt-6">
                    {/* CTA is visual only — the whole slide handles the click.
                        Disabled (greyed, no pointer) on display-only slides. */}
                    <span
                      aria-disabled={!s.clickable}
                      className={`${ctaCls} ${s.clickable ? "" : "cursor-default opacity-50"}`}
                    >
                      {s.cta.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* arrows — desktop only */}
      <button
        aria-label="Previous slide"
        onClick={(e) => { e.stopPropagation(); go(idx - 1); }}
        className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:flex"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>
      <button
        aria-label="Next slide"
        onClick={(e) => { e.stopPropagation(); go(idx + 1); }}
        className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:flex"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      {/* dot indicators */}
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === idx}
            onClick={(e) => { e.stopPropagation(); go(i); }}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === idx ? "w-7 bg-brand-accent" : "w-2.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
