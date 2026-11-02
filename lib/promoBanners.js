"use client";

import { getBanners } from "@/lib/api";
import { hasHref } from "@/lib/bannerCtas";

/* Normalize a banner doc (new flat click config OR legacy cta/clickable) into the
   shared hero-style config the renderers consume. New banners set `clickEnabled`
   explicitly; legacy banners keep their old whole-banner-to-cta.href behaviour. */
export function bannerCtaConfig(b = {}) {
  const cta = b.cta || {};
  const sec = b.ctaSecondary || {};
  if (b.clickEnabled !== undefined && b.clickEnabled !== null) {
    return {
      clickEnabled: !!b.clickEnabled,
      clickUrl: b.clickUrl || cta.href || "",
      ctaText: cta.label || "",
      ctaLink: cta.href || "",
      ctaSecondaryText: sec.label || "",
      ctaSecondaryLink: sec.href || "",
      pillLabel: cta.label || "",
    };
  }
  // Legacy: whole banner was clickable to cta.href. Tolerate older/alt link fields
  // (link / href / ctaLink) exactly as the old carousel did. Preserve as a real link.
  const href = cta.href || b.link || b.href || b.ctaLink || "";
  const clickable = b.clickable !== false;
  return {
    clickEnabled: clickable && hasHref(href),
    clickUrl: href,
    ctaText: cta.label || "",
    ctaLink: href,
    ctaSecondaryText: "",
    ctaSecondaryLink: "",
    pillLabel: cta.label || "",
  };
}

// Module-level cached fetch so the hero carousel + every promo slot share ONE
// /api/banners call per page session (the route itself is force-dynamic/no-store).
let cache;
export function loadBanners() {
  if (!cache) cache = getBanners().catch((e) => { cache = undefined; throw e; });
  return cache;
}

// Active + within the optional start/end window.
export function isLive(b, now = Date.now()) {
  if (b.active === false) return false;
  if (b.start && new Date(b.start).getTime() > now) return false;
  if (b.end && new Date(b.end).getTime() < now) return false;
  return true;
}

export const placementOf = (b) => b.placement || "hero";

// Named homepage slots (hero = existing carousel).
export const PROMO_SLOTS = ["after-bestsellers", "after-categories", "after-budget", "before-reviews", "footer-top"];
export const PLACEMENT_OPTIONS = ["hero", ...PROMO_SLOTS];
export const PLACEMENT_LABELS = {
  hero: "Hero Carousel",
  "after-bestsellers": "After Bestsellers",
  "after-categories": "After Categories",
  "after-budget": "After Shop by Budget",
  "before-reviews": "Before Reviews",
  "footer-top": "Above Footer",
};
