"use client";

import Link from "next/link";

/* Full-width promotional banner for the homepage DB zone (banner section type). */
export default function BannerSection({ imageUrl, heading, subheading, ctaText, ctaLink, bgColor }) {
  return (
    <section className="py-6 lg:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-card" style={{ background: bgColor || "#1C1C1E" }}>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={heading || "Banner"} className="absolute inset-0 h-full w-full object-cover opacity-90" />
          )}
          <div className="relative flex flex-col items-start gap-3 px-6 py-10 sm:px-10 sm:py-14">
            {heading && <h2 className="max-w-xl font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">{heading}</h2>}
            {subheading && <p className="max-w-lg text-sm text-white/85 sm:text-base">{subheading}</p>}
            {ctaText && (
              <Link href={ctaLink || "/"} className="mt-1 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-white/90">
                {ctaText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
