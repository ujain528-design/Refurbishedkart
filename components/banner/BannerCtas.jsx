"use client";

import Link from "next/link";
import { isExternalHref, hasButton, hasHref } from "@/lib/bannerCtas";

/* Shared banner button + whole-banner-link renderer. Used by the hero carousel and
   every other admin-editable banner so they behave identically:
   - A button renders only when BOTH its text and link are filled.
   - http:// or https:// links open in a new tab (rel=noopener noreferrer);
     internal links use next/link.
   - Whole-banner mode renders a single absolutely-positioned REAL link so
     right-click / open-in-new-tab work (never an onClick → router.push).

   Pass `stop` when the banner sits inside a carousel that has its own slide-click
   handler, so button clicks don't bubble up to it. */

const BTN_PRIMARY =
  "rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark md:px-7 md:py-3.5 md:text-base";
const BTN_SECONDARY =
  "rounded-lg border-[1.5px] border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] md:px-7 md:py-3.5 md:text-base";

function OneButton({ text, link, variant, stop }) {
  if (!hasButton(text, link)) return null;
  const cls = variant === "secondary" ? BTN_SECONDARY : BTN_PRIMARY;
  const onClick = stop ? (e) => e.stopPropagation() : undefined;
  if (isExternalHref(link)) {
    return <a href={link} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cls}>{text}</a>;
  }
  return <Link href={link} onClick={onClick} className={cls}>{text}</Link>;
}

/* Up to two buttons. Returns null when neither is complete. */
export default function BannerCtas({
  primaryText, primaryLink, secondaryText, secondaryLink, stop = false, className = "",
}) {
  if (!hasButton(primaryText, primaryLink) && !hasButton(secondaryText, secondaryLink)) return null;
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <OneButton text={primaryText} link={primaryLink} variant="primary" stop={stop} />
      <OneButton text={secondaryText} link={secondaryLink} variant="secondary" stop={stop} />
    </div>
  );
}

/* Absolutely-positioned real link covering the whole banner. Place arrows / dots /
   buttons ABOVE it with a higher z-index. Renders nothing when the url is empty
   or "#". */
export function BannerClickLink({ url, label, className = "absolute inset-0 z-[1]" }) {
  if (!hasHref(url)) return null;
  const aria = label || "Open";
  if (isExternalHref(url)) {
    return <a href={url} target="_blank" rel="noopener noreferrer" aria-label={aria} className={className} />;
  }
  return <Link href={url} aria-label={aria} className={className} />;
}

/* Does this banner currently show at least one button? (buttons mode + a complete
   button). Shared so renderers and previews can switch the overlay off uniformly. */
export function bannerShowsButtons({ clickEnabled, ctaText, ctaLink, ctaSecondaryText, ctaSecondaryLink } = {}) {
  if (clickEnabled) return false;
  return hasButton(ctaText, ctaLink) || hasButton(ctaSecondaryText, ctaSecondaryLink);
}
