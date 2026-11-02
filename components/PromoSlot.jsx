"use client";

import { useEffect, useState } from "react";
import { loadBanners, isLive, placementOf, bannerCtaConfig } from "@/lib/promoBanners";
import BannerCtas, { BannerClickLink } from "@/components/banner/BannerCtas";
import { hasHref, hasButton } from "@/lib/bannerCtas";

/* Renders any active, in-window banners assigned to a named homepage slot as
   full-width promo posters. Supports the same click options as every other banner:
   optional buttons OR a whole-banner real link. Self-hides when the slot is empty. */
export default function PromoSlot({ placement }) {
  const [banners, setBanners] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    loadBanners()
      .then((all) => {
        if (!alive) return;
        setBanners((all || []).filter((b) => placementOf(b) === placement && isLive(b)));
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [placement]);

  if (!loaded || banners.length === 0) return null;

  return (
    <section aria-label="Promotion" className="w-full">
      {banners.map((b) => {
        const cfg = bannerCtaConfig(b);
        const showButtons = !cfg.clickEnabled
          && (hasButton(cfg.ctaText, cfg.ctaLink) || hasButton(cfg.ctaSecondaryText, cfg.ctaSecondaryLink));
        const bannerMode = cfg.clickEnabled && hasHref(cfg.clickUrl);
        return (
          <div
            key={b.id}
            className={`relative w-full overflow-hidden ${bannerMode ? "cursor-pointer" : ""}`}
            style={!b.backgroundImage ? { background: b.backgroundColor || "#2D5016" } : undefined}
          >
            {/* whole-banner real link (right-click / new-tab work) */}
            {bannerMode && <BannerClickLink url={cfg.clickUrl} label={b.headline || "Promotion"} />}

            {b.backgroundImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.backgroundImage} alt={b.headline || "Promotion"} loading="lazy" className="block w-full object-cover" />
                {/* buttons over an image poster → bottom-left */}
                {showButtons && (
                  <div className="absolute inset-x-0 bottom-0 z-[2] mx-auto flex max-w-7xl items-end px-5 pb-6 sm:px-8">
                    <BannerCtas
                      primaryText={cfg.ctaText} primaryLink={cfg.ctaLink}
                      secondaryText={cfg.ctaSecondaryText} secondaryLink={cfg.ctaSecondaryLink}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="pointer-events-none relative z-[2] mx-auto flex max-w-7xl flex-col items-start gap-2 px-5 py-7 sm:px-8 lg:py-12">
                {b.headline && <p className="text-xl font-extrabold tracking-tight text-white lg:text-3xl">{b.headline}</p>}
                {b.sub && <p className="text-sm text-white/85 md:text-base">{b.sub}</p>}
                {showButtons ? (
                  <BannerCtas
                    className="pointer-events-auto mt-3"
                    primaryText={cfg.ctaText} primaryLink={cfg.ctaLink}
                    secondaryText={cfg.ctaSecondaryText} secondaryLink={cfg.ctaSecondaryLink}
                  />
                ) : cfg.pillLabel ? (
                  <span className="mt-3 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-bold text-ink">{cfg.pillLabel}</span>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
