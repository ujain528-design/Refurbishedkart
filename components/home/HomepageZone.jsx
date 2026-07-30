"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getHomepageSections } from "@/lib/api";
import LiveProductRow from "@/components/home/LiveProductRow";
import BannerSection from "@/components/home/BannerSection";
import { CATEGORY_TILES, TILE_CLASS, TileInner } from "@/components/CategoryTiles";

/* DB-driven homepage zone — renders admin-managed sections in place of the old
   hardcoded product rows. Everything else on the homepage stays hand-composed. */

function CategoryGrid({ title, categories }) {
  const want = (categories || []).map((c) => String(c).toLowerCase());
  const tiles = want.length ? CATEGORY_TILES.filter((t) => want.includes(String(t.slug).toLowerCase())) : CATEGORY_TILES;
  if (!tiles.length) return null;
  return (
    <section className="bg-warm-bg py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {title && <h2 className="section-heading">{title}</h2>}
        <div className="mt-4 grid grid-cols-2 items-stretch gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((c) => (
            <Link key={c.slug} href={`/products/${c.slug}`} className={TILE_CLASS}><TileInner {...c} /></Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnnouncementBand({ text, bgColor, textColor }) {
  if (!text) return null;
  return (
    <section className="py-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-card px-5 py-3 text-center text-sm font-semibold" style={{ background: bgColor || "#2D5016", color: textColor || "#ffffff" }}>
          {text}
        </div>
      </div>
    </section>
  );
}

export default function HomepageZone() {
  const [sections, setSections] = useState(null);

  useEffect(() => {
    let alive = true;
    getHomepageSections().then((s) => { if (alive) setSections(Array.isArray(s) ? s : []); }).catch(() => { if (alive) setSections([]); });
    return () => { alive = false; };
  }, []);

  if (!sections) return null;

  return (
    <>
      {sections.map((s) => {
        switch (s.type) {
          case "product_row":
            return (
              <LiveProductRow
                key={s.id}
                eyebrow={s.title}
                title={s.title}
                tag={s.tag}
                category={s.category}
                limit={Number(s.maxProducts) || 8}
                viewAllHref={s.tag ? `/shop/${s.tag}` : undefined}
              />
            );
          case "banner":
            return <BannerSection key={s.id} imageUrl={s.imageUrl} heading={s.heading} subheading={s.subheading} ctaText={s.ctaText} ctaLink={s.ctaLink} bgColor={s.bgColor} />;
          case "category_grid":
            return <CategoryGrid key={s.id} title={s.title} categories={s.categories} />;
          case "announcement":
            return <AnnouncementBand key={s.id} text={s.text} bgColor={s.bgColor} textColor={s.textColor} />;
          default:
            return null;
        }
      })}
    </>
  );
}
