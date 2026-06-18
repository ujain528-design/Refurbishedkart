"use client";

import { useRef, useState } from "react";
import { BrokenDeviceIcon } from "@/components/Icons";

/* alt        — full SEO alt for the primary image.
   altBase    — shorter "[Brand] [Model] — Refurbished [Category]" base used for
                secondary images/thumbnails (with a view number appended).

   Mobile (< lg): app-style swipeable slider — a CSS scroll-snap horizontal
   scroller (one image per frame) with dot indicators. Only the slider scrolls,
   never the page. Desktop (lg+): the original main-image + thumbnail-strip
   layout, unchanged. */
export default function Gallery({ images, alt, altBase }) {
  const [active, setActive] = useState(0);
  const scroller = useRef(null);
  const imgAlt = (i) => (i === 0 ? alt : `${altBase || alt} (view ${i + 1})`);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-card border border-black/5 bg-white">
        <div className="flex flex-col items-center gap-3 text-neutral-300">
          <BrokenDeviceIcon style={{ width: 80, height: 80 }} />
          <span className="text-xs font-medium uppercase tracking-wider">Product Image</span>
        </div>
      </div>
    );
  }

  // Active dot tracks the snapped slide (rounded scroll position).
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };
  const goTo = (i) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setActive(i);
  };

  return (
    <div>
      {/* ── MOBILE: swipeable slider + dots (hidden on desktop) ── */}
      <div className="lg:hidden">
        <div
          ref={scroller}
          onScroll={onScroll}
          aria-label="Product images — swipe to browse"
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-card border border-black/5 bg-white shadow-card"
        >
          {images.map((src, i) => (
            <div key={src} className="flex aspect-[4/3] w-full shrink-0 snap-center items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={imgAlt(i)} className="h-full w-full object-contain p-6" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5" aria-label="Image position">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to image ${i + 1} of ${images.length}`}
                aria-current={active === i}
                className={`h-1.5 rounded-full transition-all duration-200 ${active === i ? "w-4 bg-brand" : "w-1.5 bg-neutral-300"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP: original main image + thumbnail strip (hidden on mobile) ── */}
      <div className="hidden lg:block">
        {/* main image — zoom on hover */}
        <div className="group relative aspect-[4/3] overflow-hidden rounded-card border border-black/5 bg-white shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt={imgAlt(active)}
            className="h-full w-full object-contain p-8 transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </div>

        {/* thumbnail strip — click swaps main */}
        {images.length > 1 && (
          <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={active === i}
                className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border bg-white p-1.5 transition-all duration-200 ${
                  active === i
                    ? "border-brand ring-2 ring-brand/25"
                    : "border-black/10 opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={imgAlt(i)} className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
