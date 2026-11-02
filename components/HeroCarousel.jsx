"use client";

import { useEffect, useRef, useState } from "react";
import { OPEN_BULK_MODAL_EVENT } from "@/components/BulkEnquiryTrigger";
import { loadBanners, placementOf, bannerCtaConfig } from "@/lib/promoBanners";
import BannerCtas, { BannerClickLink } from "@/components/banner/BannerCtas";
import { hasHref, hasButton } from "@/lib/bannerCtas";

const AUTOPLAY_MS = 4000;
const GRADIENTS = [
  "bg-gradient-to-br from-[#0E3D12] via-brand to-brand-mid",
  "bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800",
  "bg-gradient-to-br from-neutral-950 via-neutral-800 to-neutral-600",
];

const pillCls =
  "inline-block rounded-full bg-white px-7 py-3 text-sm font-bold text-ink";

export default function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);

  // Active banners from the DB (admin-managed). No mock fallback — the section
  // simply hides when there are no active banners.
  useEffect(() => {
    let alive = true;
    loadBanners()
      .then((all) => {
        if (!alive) return;
        // Hero carousel shows only hero-placement banners (legacy = hero).
        const banners = (all || []).filter((b) => placementOf(b) === "hero");
        setSlides(banners.map((b, i) => ({
          id: b.id,
          gradient: b.gradient || GRADIENTS[i % GRADIENTS.length],
          backgroundImage: b.backgroundImage || "",
          backgroundColor: b.backgroundColor || "",
          headline: b.headline,
          sub: b.sub || "",
          bulk: !!b.cta?.bulk,
          cfg: bannerCtaConfig(b),
        })));
        setIdx(0);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  const go = (i) => { if (slides.length) setIdx((i + slides.length) % slides.length); };

  /* Auto-play: re-arms whenever idx changes, so any manual jump (arrow,
     dot, swipe) naturally resets the 4s timer. Paused while hovered. */
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setTimeout(() => go(idx + 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [idx, paused, slides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTouchStart = (e) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1));
    touchX.current = null;
  };

  const openBulk = () => window.dispatchEvent(new CustomEvent(OPEN_BULK_MODAL_EVENT));

  // No active banners → render nothing (no mock slides).
  if (!loaded || slides.length === 0) return null;

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
        {slides.map((s) => {
          const cfg = s.cfg;
          const showButtons = !cfg.clickEnabled
            && (hasButton(cfg.ctaText, cfg.ctaLink) || hasButton(cfg.ctaSecondaryText, cfg.ctaSecondaryLink));
          const bannerMode = !s.bulk && cfg.clickEnabled && hasHref(cfg.clickUrl);
          return (
            <div
              key={s.id}
              className={`relative aspect-[16/5] min-h-[200px] w-full shrink-0 overflow-hidden ${s.backgroundImage || s.backgroundColor ? "" : s.gradient} ${bannerMode ? "cursor-pointer" : "cursor-default"}`}
              style={{ background: s.backgroundImage ? (s.backgroundColor || "#13150f") : (s.backgroundColor && !s.backgroundImage ? s.backgroundColor : undefined) }}
              aria-hidden={slides[idx]?.id !== s.id}
            >
              {/* image poster — object-contain shows the FULL 16:5 poster with no
                  cropping; letterbox bars (off-ratio images) are filled by the
                  slide background colour set above. */}
              {s.backgroundImage && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-contain" aria-hidden="true" />
                  {/* overlay fade — off when buttons show (they need full contrast of their own) */}
                  {!showButtons && <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(28,28,30,0.55) 0%, rgba(28,28,30,0.18) 55%, rgba(28,28,30,0.05) 100%)" }} aria-hidden="true" />}
                </>
              )}

              {/* whole-banner real link (right-click / new-tab work). Arrows & dots sit above via z-10. */}
              {bannerMode && <BannerClickLink url={cfg.clickUrl} label={s.headline || "View offer"} />}

              {/* poster copy — bottom-left desktop, centered mobile */}
              <div className="pointer-events-none absolute inset-0 z-[2] flex items-end pb-16 md:pb-20">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col items-center text-center md:items-start md:text-left">
                    <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                      {s.headline}
                    </h2>
                    <p className="mt-3 text-[15px] text-white/75 md:text-lg">{s.sub}</p>
                    <div className="mt-6">
                      {s.bulk ? (
                        <button onClick={openBulk} className={`pointer-events-auto ${pillCls} cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover`}>
                          {cfg.pillLabel || "Enquire now"}
                        </button>
                      ) : showButtons ? (
                        <BannerCtas
                          className="pointer-events-auto justify-center md:justify-start"
                          primaryText={cfg.ctaText} primaryLink={cfg.ctaLink}
                          secondaryText={cfg.ctaSecondaryText} secondaryLink={cfg.ctaSecondaryLink}
                        />
                      ) : cfg.pillLabel ? (
                        // Whole-banner / display mode: the label is a visual pill (the
                        // slide link, if any, handles the click).
                        <span className={pillCls}>{cfg.pillLabel}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* arrows — desktop only */}
      <button
        aria-label="Previous slide"
        onClick={(e) => { e.stopPropagation(); go(idx - 1); }}
        className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:flex"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>
      <button
        aria-label="Next slide"
        onClick={(e) => { e.stopPropagation(); go(idx + 1); }}
        className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:flex"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      {/* dot indicators */}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {slides.map((s, i) => (
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
