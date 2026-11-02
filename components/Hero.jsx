"use client";

import { useEffect, useRef, useState } from "react";
import { TRUST_BADGES } from "@/lib/data";
import { getPublicSettings } from "@/lib/api";
import BannerCtas, { BannerClickLink, bannerShowsButtons } from "@/components/banner/BannerCtas";
import { hasHref } from "@/lib/bannerCtas";

/* Multi-slide hero carousel — slides come from admin Settings → Appearance → Hero
   Carousel (the public settings route migrates the legacy single hero to slide[0]).
   Each slide renders its own background (image / gradient / colour), per-slide
   overlay darkness, text (only when a heading is set) and optional whole-slide
   click. Auto-advances every 5s (pauses on hover/touch), with dots, arrows and
   swipe. CSS-only transitions. */

const GRADIENT = "linear-gradient(160deg, #1C1C1E 0%, #2D5016 60%, #1C1C1E 100%)";
const AUTOPLAY_MS = 5000;
const clamp = (n) => Math.max(0, Math.min(100, Number(n ?? 55)));

const ArrowIcon = ({ dir }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }} aria-hidden="true">
    <path d={dir === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
  </svg>
);

export default function Hero() {
  const [slides, setSlides] = useState([]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);

  useEffect(() => {
    let alive = true;
    getPublicSettings()
      .then((d) => { if (alive) { setSlides(Array.isArray(d?.heroSlides) ? d.heroSlides : []); setIdx(0); } })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const go = (i) => { if (slides.length) setIdx((i + slides.length) % slides.length); };

  // Auto-advance; re-arms on every idx change so manual jumps reset the timer.
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setTimeout(() => go(idx + 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [idx, paused, slides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; setPaused(true); };
  const onTouchEnd = (e) => {
    const start = touchX.current;
    touchX.current = null;
    setPaused(false);
    if (start == null) return;
    const dx = e.changedTouches[0].clientX - start;
    if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1));
  };

  const multi = slides.length > 1;

  return (
    <section className="bg-warm-bg pb-12">
      {slides.length > 0 && (
        <div
          className="group relative w-full overflow-hidden"
          aria-label="Featured"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* sliding track */}
          <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
            {slides.map((s, i) => {
              const isImg = s.backgroundType === "image" && s.backgroundImage;
              // First slide's heading is the page H1 (one per page); others are h2.
              const HeadingTag = i === 0 ? "h1" : "h2";
              const fill = s.backgroundType === "color" ? (s.backgroundColor || "#1C1C1E") : isImg ? "#13150f" : GRADIENT;
              // Whole-banner mode: the slide is one real link. Otherwise buttons (if any).
              const bannerMode = !!s.clickEnabled && hasHref(s.clickUrl);
              const showButtons = bannerShowsButtons(s);
              // When a slide shows buttons the dark overlay is switched off (0); every
              // other slide keeps its configured overlay darkness.
              const x = showButtons ? 0 : clamp(s.overlayDarkness) / 100;
              const overlay = `linear-gradient(160deg, rgba(28,28,30,${x}) 0%, rgba(45,80,22,${x * 0.4}) 55%, rgba(28,28,30,${x * 0.9}) 100%)`;
              return (
                <div
                  key={s.id}
                  className={`relative aspect-[16/5] min-h-[200px] w-full shrink-0 overflow-hidden ${bannerMode ? "cursor-pointer" : ""}`}
                  style={{ background: fill }}
                >
                  {/* full poster — object-contain so the image is never cropped */}
                  {isImg && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-contain" aria-hidden="true" />
                  )}
                  <div className="absolute inset-0" style={{ background: overlay }} aria-hidden="true" />

                  {/* Whole-banner click — a real link covering the slide (no buttons in
                      this mode). Arrows/dots sit above it via z-10. */}
                  {bannerMode && <BannerClickLink url={s.clickUrl} label={s.heading || "View offer"} />}

                  {/* text overlay — when a heading is set */}
                  {s.heading && (
                    <div className="absolute inset-0 z-[2] flex items-center">
                      <div className="pointer-events-none mx-auto w-full max-w-7xl px-6 md:px-20">
                        <div className="max-w-[600px]">
                          <HeadingTag className="font-display text-[1.6rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2rem] md:text-[3.25rem]">{s.heading}</HeadingTag>
                          {s.subheading && <p className="mt-3 max-w-[460px] text-[0.9rem] leading-relaxed text-white/[0.72] sm:text-[1rem] md:mt-4 md:text-[1.05rem]">{s.subheading}</p>}
                          {showButtons && (
                            <BannerCtas
                              className="pointer-events-auto mt-4 md:mt-7"
                              primaryText={s.ctaText} primaryLink={s.ctaLink}
                              secondaryText={s.ctaSecondaryText} secondaryLink={s.ctaSecondaryLink}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No heading but buttons set → buttons bottom-left, above the dots. */}
                  {!s.heading && showButtons && (
                    <div className="absolute inset-x-0 bottom-0 z-[2] flex items-end">
                      <div className="mx-auto w-full max-w-7xl px-6 pb-12 md:px-20 md:pb-14">
                        <BannerCtas
                          primaryText={s.ctaText} primaryLink={s.ctaLink}
                          secondaryText={s.ctaSecondaryText} secondaryLink={s.ctaSecondaryLink}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* arrows — desktop, only with >1 slide */}
          {multi && (
            <>
              <button aria-label="Previous slide" onClick={(e) => { e.stopPropagation(); go(idx - 1); }} className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:flex">
                <ArrowIcon dir="left" />
              </button>
              <button aria-label="Next slide" onClick={(e) => { e.stopPropagation(); go(idx + 1); }} className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:flex">
                <ArrowIcon dir="right" />
              </button>
            </>
          )}

          {/* dot indicators */}
          {multi && (
            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === idx}
                  onClick={(e) => { e.stopPropagation(); go(i); }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${i === idx ? "w-7 bg-accent" : "w-2.5 bg-white/50 hover:bg-white/80"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brand slogan — elegant italic tagline (no quotes in the hero) */}
      <p className="picker-fade-in mx-auto mt-10 max-w-2xl px-6 text-center font-display text-xl font-light italic leading-snug tracking-[-0.01em] text-brand sm:text-2xl md:mt-12 md:text-[1.75rem]">
        The Confidence of New, in a Refurbished Shell.
      </p>

      {/* Trust badges */}
      <div className="mx-auto mt-8 flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 sm:px-6 lg:px-8">
        {TRUST_BADGES.map((badge) => (
          <span key={badge} className="rounded-full border border-warm-border bg-white px-4 py-2 text-[13px] font-semibold text-brand">{badge}</span>
        ))}
      </div>
    </section>
  );
}
