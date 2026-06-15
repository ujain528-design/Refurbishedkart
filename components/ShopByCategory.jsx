"use client";

import Link from "next/link";
import useReveal from "@/lib/useReveal";
import SectionHeading from "@/components/SectionHeading";
import { CATEGORY_TILES, TILE_CLASS, TileInner } from "@/components/CategoryTiles";

/* "Shop by Category" — restrained enterprise editorial cards (shared with the
   budget→category picker modal via CategoryTiles so the two always match). */
export default function ShopByCategory() {
  const { ref, isVisible } = useReveal();
  return (
    <section className="bg-warm-bg py-8 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Shop by Category" accent="#2D5016" title="Shop by Category" />
        <div ref={ref} className="mt-2 grid grid-cols-2 items-stretch gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_TILES.map((c, i) => (
            <Link
              key={c.slug}
              href={`/products/${c.slug}`}
              className={`${TILE_CLASS} fade-up stagger-${i + 1} ${isVisible ? "visible" : ""}`}
            >
              <TileInner {...c} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
