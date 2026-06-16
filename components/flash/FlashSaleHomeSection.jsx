"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import FlashCountdown from "@/components/flash/FlashCountdown";
import { getFlashSale, getProducts } from "@/lib/api";

/* Homepage Flash Sale band. Rendered at all four candidate positions in the
   homepage; each instance shows ONLY when the sale is active AND the admin-set
   home position matches this slot — so a disabled sale leaves zero trace.

   Shows the sale title, an optional countdown, a CTA, and up to 4 tagged products. */
export default function FlashSaleHomeSection({ slot }) {
  const [flash, setFlash] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let alive = true;
    getFlashSale()
      .then((f) => {
        if (!alive) return;
        setFlash(f);
        if (f?.active && f?.home?.active && f?.home?.position === slot) {
          getProducts({ tags: "flash-sale,on-sale", limit: 4 })
            .then((rows) => alive && setProducts(rows))
            .catch(() => {});
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [slot]);

  if (!flash?.active || !flash?.home?.active || flash?.home?.position !== slot) return null;

  const { title, subtitle, ctaText, ctaLink, slug, timer } = flash;
  const href = ctaLink || `/${slug || "flash-sale"}`;

  return (
    <section className="py-12 lg:py-16" style={{ background: "linear-gradient(180deg,#FBF4EE 0%,#F7EDE4 100%)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B5532A]/12 px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-[#B5532A]">
            🔥 Limited time
          </span>
          <h2 className="section-heading !text-2xl sm:!text-4xl">{title}</h2>
          {subtitle && <p className="max-w-2xl text-sm text-neutral-600 sm:text-base">{subtitle}</p>}
          {timer?.active && timer?.endsAt && <div className="mt-1"><FlashCountdown endsAt={timer.endsAt} variant="compact" /></div>}
          {ctaText && (
            <Link href={href} className="mt-1 rounded-full bg-brand px-7 py-3 text-sm font-bold text-white shadow-card transition-colors hover:bg-brand-dark">
              {ctaText}
            </Link>
          )}
        </div>

        {products.length > 0 && (
          <div className="mt-9 grid grid-cols-2 items-stretch gap-3 sm:gap-6 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} className="w-full" />)}
          </div>
        )}
      </div>
    </section>
  );
}
