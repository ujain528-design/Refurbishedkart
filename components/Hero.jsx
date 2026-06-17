"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TRUST_BADGES } from "@/lib/data";
import { getPublicSettings } from "@/lib/api";

// Fallback content — matches the design defaults so the hero looks identical
// before settings load (or if the request fails).
const DEFAULTS = {
  eyebrow: "Certified Refurbished",
  headline: "Premium laptops & desktops,",
  headlineAccent: "renewed.",
  subtext:
    "Enterprise-grade machines, fully tested and warrantied. GST invoice, 7-day returns, free delivery across India.",
  ctaPrimaryText: "Shop Laptops",
  ctaPrimaryLink: "/products/laptops",
  ctaSecondaryText: "Explore Deals",
  ctaSecondaryLink: "/flash-sale",
  backgroundType: "gradient",
  backgroundImage: "",
  backgroundVideo: "https://videos.pexels.com/video-files/3252223/3252223-uhd_2560_1440_25fps.mp4",
  overlayDarkness: 80,
};

// Word-stagger timing (ms): eyebrow → words → subtext → buttons.
const EYEBROW_DELAY = 200;
const WORDS_START = 500;
const WORD_STEP = 100;

/* Warm Tech hero — admin-editable via Settings → Appearance. Background can be
   gradient / image / video; overlay darkness, text and CTAs all come from the
   store settings with the defaults above as fallback. Animations unchanged. */
export default function Hero() {
  const [hero, setHero] = useState(DEFAULTS);
  const [showVideo, setShowVideo] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showChevron, setShowChevron] = useState(true);

  // Pull admin-managed hero settings; only override fields that are non-empty.
  useEffect(() => {
    let alive = true;
    getPublicSettings()
      .then((d) => {
        if (process.env.NODE_ENV !== "production") {
          // Diagnostic: confirm the hero settings the storefront receives.
          // eslint-disable-next-line no-console
          console.log("[Hero] /api/content/settings → hero:", d?.hero);
        }
        if (!alive || !d?.hero) return;
        setHero((prev) => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(d.hero)) {
            if (v !== undefined && v !== null && v !== "") next[k] = v;
          }
          return next;
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const isVideo = hero.backgroundType === "video" && hero.backgroundVideo;
  const isImage = hero.backgroundType === "image" && hero.backgroundImage;

  useEffect(() => {
    if (!isVideo) return;
    const desktop = window.matchMedia?.("(min-width: 768px)")?.matches;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (desktop && !reduce) {
      const t = setTimeout(() => setShowVideo(true), 600);
      return () => clearTimeout(t);
    }
  }, [isVideo]);
  useEffect(() => {
    const t = setTimeout(() => setShowChevron(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Headline → staggered words; the accent word (amber) comes last.
  const words = useMemo(() => {
    const base = String(hero.headline || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => ({ t, accent: false }));
    if (hero.headlineAccent) base.push({ t: hero.headlineAccent, accent: true });
    return base;
  }, [hero.headline, hero.headlineAccent]);

  const lastWord = WORDS_START + (words.length - 1) * WORD_STEP;
  const subtextDelay = lastWord + 400 + 200;
  const buttonsDelay = subtextDelay + 400 + 100;

  // Overlay opacity from the 0–100 darkness slider.
  const x = Math.max(0, Math.min(100, Number(hero.overlayDarkness ?? 80))) / 100;
  const overlay = `linear-gradient(160deg, rgba(28,28,30,${x.toFixed(3)}) 0%, rgba(45,80,22,${(x * 0.4).toFixed(3)}) 55%, rgba(28,28,30,${(x * 0.9).toFixed(3)}) 100%)`;

  return (
    <section className="bg-warm-bg pb-16">
      {/* Image background → lock the box to the poster's 1920:600 ratio (180px floor
          on small screens) so the FULL poster shows, never cropped. Gradient/video
          keep the tall 88vh text-hero. */}
      <div className={`relative flex items-center overflow-hidden ${isImage ? "aspect-[1920/600] min-h-[180px]" : "min-h-[88vh]"}`}>
        {/* 1 · Background — warm gradient base (always), image or video on top */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #1C1C1E 0%, #2D5016 60%, #1C1C1E 100%)" }} aria-hidden="true" />

        {isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-contain" aria-hidden="true" />
        )}

        {isVideo && showVideo && !failed && (
          <video
            autoPlay muted loop playsInline preload="none"
            onError={() => setFailed(true)}
            className="absolute inset-0 hidden h-full w-full object-cover md:block"
            aria-hidden="true"
          >
            <source src={hero.backgroundVideo} type="video/mp4" />
          </video>
        )}

        {/* 2 · Dark overlay (darkness-controlled) */}
        <div className="absolute inset-0" style={{ background: overlay }} aria-hidden="true" />

        {/* 3 · Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-20">
          <div className="max-w-[600px]">
            {hero.eyebrow && (
              <p className="hero-fade text-[0.72rem] font-medium uppercase tracking-[0.14em] text-accent" style={{ animationDelay: `${EYEBROW_DELAY}ms` }}>
                {hero.eyebrow}
              </p>
            )}
            <h1 className="mt-4 font-display text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-white md:text-[3.75rem]">
              {words.map((w, i) => (
                <span
                  key={`${w.t}-${i}`}
                  className={`blur-up mr-3 inline-block last:mr-0 ${w.accent ? "text-accent" : ""}`}
                  style={{ animationDelay: `${WORDS_START + i * WORD_STEP}ms` }}
                >
                  {w.t}
                </span>
              ))}
            </h1>
            {hero.subtext && (
              <p className="hero-rise mt-6 max-w-[460px] text-[1.05rem] leading-relaxed text-white/[0.68]" style={{ animationDelay: `${subtextDelay}ms` }}>
                {hero.subtext}
              </p>
            )}
            <div className="hero-rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: `${buttonsDelay}ms` }}>
              {hero.ctaPrimaryText && (
                <Link href={hero.ctaPrimaryLink || "/"} className="rounded-lg bg-brand px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-dark">
                  {hero.ctaPrimaryText}
                </Link>
              )}
              {hero.ctaSecondaryText && (
                <Link href={hero.ctaSecondaryLink || "/"} className="rounded-lg border-[1.5px] border-white/40 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/[0.08]">
                  {hero.ctaSecondaryText}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Scroll chevron */}
        {showChevron && (
          <div className="chev-bounce absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/45" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        )}
      </div>

      {/* Trust badges */}
      <div className="mx-auto mt-12 flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 sm:px-6 lg:px-8">
        {TRUST_BADGES.map((badge) => (
          <span key={badge} className="rounded-full border border-warm-border bg-white px-4 py-2 text-[13px] font-semibold text-brand">{badge}</span>
        ))}
      </div>
    </section>
  );
}
