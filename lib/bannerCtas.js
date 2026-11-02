/* Shared banner-link helpers — pure JS (no imports), safe on both server and
   client. Used by every admin-editable banner (hero carousel, DB promo banners,
   homepage-builder banner, flash-sale band) so they all validate and treat links
   the same way. */

/* A link that leaves the site (opens in a new tab with rel=noopener). */
export function isExternalHref(href) {
  return /^https?:\/\//i.test(String(href || "").trim());
}

/* A non-empty, non-placeholder link. */
export function hasHref(href) {
  const v = String(href || "").trim();
  return v !== "" && v !== "#";
}

/* A button is shown only when BOTH its text and link are filled. */
export function hasButton(text, link) {
  return !!String(text || "").trim() && hasHref(link);
}

/* Shared validation for a banner's click config. Returns an error string to block
   the save, or "" when valid. Field names match the hero slide shape; other
   banners map their fields onto these keys before calling.
   - Buttons mode (clickEnabled falsey): each button needs text AND link together.
   - Banner mode (clickEnabled truthy): needs a link. */
export function bannerCtaError({ clickEnabled, clickUrl, ctaText, ctaLink, ctaSecondaryText, ctaSecondaryLink } = {}) {
  if (clickEnabled) {
    return hasHref(clickUrl) ? "" : "Add a Banner Link, or switch to Buttons.";
  }
  const pair = (t, l, name) => {
    const hasT = !!String(t || "").trim();
    const hasL = hasHref(l);
    if (hasT && !hasL) return `${name} has text but no link.`;
    if (hasL && !hasT) return `${name} has a link but no text.`;
    return "";
  };
  return pair(ctaText, ctaLink, "Button 1") || pair(ctaSecondaryText, ctaSecondaryLink, "Button 2");
}
