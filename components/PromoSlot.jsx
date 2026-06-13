"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadBanners, isLive, placementOf } from "@/lib/promoBanners";

/* Renders any active, in-window banners assigned to a named homepage slot as
   full-width clickable promo posters. Self-hides when the slot is empty. */
export default function PromoSlot({ placement }) {
  const [banners, setBanners] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

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

  const href = (b) => b.cta?.href;
  const go = (b) => { const h = href(b); if (h && h !== "#") router.push(h); };

  return (
    <section aria-label="Promotion" className="w-full">
      {banners.map((b) => {
        const clickable = !!(href(b) && href(b) !== "#");
        return (
          <div
            key={b.id}
            onClick={() => go(b)}
            role={clickable ? "link" : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={clickable ? b.headline || "Promotion" : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(b); } } : undefined}
            className={`relative w-full overflow-hidden ${clickable ? "cursor-pointer" : ""}`}
            style={!b.backgroundImage ? { background: b.backgroundColor || "#2D5016" } : undefined}
          >
            {b.backgroundImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.backgroundImage} alt={b.headline || "Promotion"} loading="lazy" className="block w-full object-cover" />
            ) : (
              <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 px-6 py-12 sm:px-8">
                {b.headline && <p className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">{b.headline}</p>}
                {b.sub && <p className="text-sm text-white/85 md:text-base">{b.sub}</p>}
                {b.cta?.label && (
                  <span className="mt-3 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-bold text-ink">{b.cta.label}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
