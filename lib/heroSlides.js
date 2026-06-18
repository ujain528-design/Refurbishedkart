/* Shared hero-slide helpers — used by the public settings route (server), the
   admin slide manager, and the Hero carousel. Pure JS, no imports, so it's safe
   on both server and client. */

/* A fresh, blank slide for "Add New Slide". */
export function blankHeroSlide(order = 0) {
  return {
    id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    backgroundType: "gradient", // image | gradient | color
    backgroundImage: "",
    backgroundColor: "#1C1C1E",
    overlayDarkness: 55, // 0–100
    heading: "",
    subheading: "",
    ctaText: "",
    ctaLink: "",
    ctaSecondaryText: "",
    ctaSecondaryLink: "",
    clickEnabled: false,
    clickUrl: "",
    order,
    active: true,
  };
}

/* Build a single slide from the legacy flat hero* settings so existing hero
   content is preserved with zero data loss when no slides exist yet. */
export function legacyHeroSlides(s = {}) {
  const heading = [s.heroHeadline, s.heroHeadlineAccent].filter(Boolean).join(" ").trim();
  return [{
    id: "legacy-hero",
    backgroundType: s.heroBackgroundType === "image" ? "image" : "gradient",
    backgroundImage: s.heroBackgroundImage || "",
    backgroundColor: "",
    overlayDarkness: Number(s.heroOverlayDarkness ?? 80),
    heading,
    subheading: s.heroSubtext || "",
    ctaText: s.heroCtaPrimaryText || "",
    ctaLink: s.heroCtaPrimaryLink || "",
    ctaSecondaryText: s.heroCtaSecondaryText || "",
    ctaSecondaryLink: s.heroCtaSecondaryLink || "",
    clickEnabled: false,
    clickUrl: "",
    order: 0,
    active: true,
  }];
}

/* Slides to actually render: existing slides if any, else the migrated legacy
   slide. Used by the admin (to seed the editor) — does NOT filter inactive. */
export function resolveHeroSlides(s = {}) {
  const slides = Array.isArray(s.heroSlides) ? s.heroSlides : [];
  return slides.length ? slides : legacyHeroSlides(s);
}

/* Active slides in display order — what the storefront carousel renders. */
export function activeSortedSlides(slides) {
  return (Array.isArray(slides) ? slides : [])
    .filter((sl) => sl && sl.active !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}
