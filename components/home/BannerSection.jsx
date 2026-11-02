"use client";

import BannerCtas, { BannerClickLink, bannerShowsButtons } from "@/components/banner/BannerCtas";
import { hasHref } from "@/lib/bannerCtas";

/* Full-width promotional banner for the homepage DB zone (banner section type).
   Same click options as every other banner: optional buttons (up to two) OR the
   whole banner as a single real link. */
export default function BannerSection({
  imageUrl, heading, subheading, ctaText, ctaLink, ctaSecondaryText, ctaSecondaryLink,
  clickEnabled, clickUrl, bgColor,
}) {
  const cfg = { clickEnabled, ctaText, ctaLink, ctaSecondaryText, ctaSecondaryLink };
  const showButtons = bannerShowsButtons(cfg);
  const bannerMode = !!clickEnabled && hasHref(clickUrl);

  return (
    <section className="py-6 lg:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`relative overflow-hidden rounded-card ${bannerMode ? "cursor-pointer" : ""}`} style={{ background: bgColor || "#1C1C1E" }}>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={heading || "Banner"} className={`absolute inset-0 h-full w-full object-cover ${showButtons ? "opacity-100" : "opacity-90"}`} />
          )}

          {/* whole-banner real link (right-click / new-tab work) */}
          {bannerMode && <BannerClickLink url={clickUrl} label={heading || "Banner"} />}

          <div className="pointer-events-none relative z-[2] flex flex-col items-start gap-3 px-6 py-10 sm:px-10 sm:py-14">
            {heading && <h2 className="max-w-xl font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">{heading}</h2>}
            {subheading && <p className="max-w-lg text-sm text-white/85 sm:text-base">{subheading}</p>}
            {showButtons && (
              <BannerCtas
                className="pointer-events-auto mt-1"
                primaryText={ctaText} primaryLink={ctaLink}
                secondaryText={ctaSecondaryText} secondaryLink={ctaSecondaryLink}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
