"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@/components/Icons";

/* Mega dropdown brands come from real master data (GET /api/master-data/brands
   ?category=). The static NAV_CATEGORIES brands render immediately as the initial
   state, then get replaced by live DB brands — no loading flash, graceful fallback. */
export default function MegaDropdown({ category }) {
  const base = `/products/${category.name.toLowerCase()}`;
  const [brands, setBrands] = useState(category.brands);

  useEffect(() => {
    let alive = true;
    fetch(`/api/master-data/brands?category=${category.name.toLowerCase()}`)
      .then((r) => r.json())
      .then((d) => { if (alive && Array.isArray(d.brands) && d.brands.length) setBrands(d.brands); })
      .catch(() => {});
    return () => { alive = false; };
  }, [category.name]);

  return (
    <div className="invisible absolute left-1/2 top-full z-50 w-[420px] -translate-x-1/2 translate-y-3 pt-3 opacity-0 transition-all duration-300 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
      <div className="overflow-hidden rounded-card border border-black/5 bg-white shadow-card-hover">
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
          <p className="text-sm font-semibold text-ink">Refurbished {category.name}</p>
          <Link href={base} className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 px-4 py-4">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={`${base}?brand=${encodeURIComponent(brand)}`}
              className="rounded-lg px-3 py-2.5 text-sm text-neutral-600 transition-colors duration-150 hover:bg-brand-softer hover:text-brand"
            >
              {brand}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
