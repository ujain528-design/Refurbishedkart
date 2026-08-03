"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import { getBrands } from "@/lib/api";

/* "Shop by Brand" — dynamic. Shows only brands that actually have products (from
   /api/brands), each linking to its brand page. A monogram badge stands in for a
   logo (drop real logos in /public/brands/ later to upgrade). Hidden when empty. */
export default function BrandStrip() {
  const [brands, setBrands] = useState(null);

  useEffect(() => {
    let alive = true;
    getBrands().then((b) => { if (alive) setBrands(Array.isArray(b) ? b : []); }).catch(() => { if (alive) setBrands([]); });
    return () => { alive = false; };
  }, []);

  // Loaded and empty → render nothing (no dead "Shop by Brand" band).
  if (brands && brands.length === 0) return null;

  return (
    <section className="bg-offwhite py-9 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Shop by Brand"
          subtitle="Enterprise-grade hardware from the names IT departments trust."
        />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 lg:gap-4">
          {(brands || []).map((brand) => (
            <Link
              key={brand}
              href={`/brands/${brand.toLowerCase()}`}
              className="flex h-14 items-center justify-center gap-2 rounded-card border border-black/5 bg-white text-[0.8rem] font-bold tracking-wide text-neutral-500 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:text-brand hover:shadow-card-hover lg:h-20 lg:text-[15px]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[11px] font-extrabold text-brand lg:h-7 lg:w-7" aria-hidden="true">
                {brand.slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate">{brand}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
