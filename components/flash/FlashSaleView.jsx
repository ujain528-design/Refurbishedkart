"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { SkeletonGrid } from "@/components/ui/States";
import FlashCountdown from "@/components/flash/FlashCountdown";
import { getProducts } from "@/lib/api";

/* Customer-facing flash-sale page body. `config` is the server-resolved flash
   config (title/subtitle/cta/timer/banner). Products are pulled live by the
   "flash-sale" or "on-sale" tags. All colours default to the cream/serif/gold
   theme and are overridden only by the admin banner colour pickers. */

function BannerStrip({ banner }) {
  if (banner.image) {
    return (
      <div
        className="w-full"
        style={{ aspectRatio: "3 / 1", backgroundImage: `url(${banner.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
        role="img"
        aria-label="Flash sale banner"
      />
    );
  }
  // No image → full-width colour block (admin-set background colour).
  return <div className="h-28 w-full sm:h-40" style={{ background: banner.bg }} aria-hidden="true" />;
}

function HeroBanner({ config }) {
  const { banner, title, subtitle, ctaText, ctaLink, timer } = config;
  const hasImg = !!banner.image;
  const style = hasImg
    ? { backgroundImage: `url(${banner.image})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: banner.bg };
  return (
    <section className="relative w-full overflow-hidden" style={style}>
      {/* legibility overlay only when there's a photo behind the text */}
      {hasImg && <div className="absolute inset-0 bg-black/45" aria-hidden="true" />}
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl" style={{ color: banner.textColor }}>{title}</h1>
        {subtitle && <p className="max-w-2xl text-sm sm:text-base" style={{ color: banner.textColor, opacity: 0.9 }}>{subtitle}</p>}
        {timer.active && <div className="mt-2"><FlashCountdown endsAt={timer.endsAt} variant="page" /></div>}
        {ctaText && (
          <Link href={ctaLink || "#products"} className="mt-3 rounded-full bg-brand px-7 py-3 text-sm font-bold text-white shadow-card transition-colors hover:bg-brand-dark">
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  );
}

function TitleBlock({ config }) {
  return (
    <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
      <h1 className="section-heading !text-3xl sm:!text-4xl">{config.title}</h1>
      {config.subtitle && <p className="mt-3 text-sm text-neutral-600 sm:text-base">{config.subtitle}</p>}
    </div>
  );
}

function TimerCta({ config }) {
  const { timer, ctaText, ctaLink } = config;
  if (!timer.active && !ctaText) return null;
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 sm:px-6">
      {timer.active && <FlashCountdown endsAt={timer.endsAt} variant="page" />}
      {ctaText && (
        <Link href={ctaLink || "#products"} className="rounded-full bg-brand px-7 py-3 text-sm font-bold text-white shadow-card transition-colors hover:bg-brand-dark">
          {ctaText}
        </Link>
      )}
    </div>
  );
}

function Products() {
  const [state, setState] = useState({ status: "loading", products: [] });
  const load = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, status: "loading" }));
    getProducts({ tags: "flash-sale,on-sale", limit: 60 })
      .then((products) => alive && setState({ status: "ready", products }))
      .catch(() => alive && setState({ status: "error", products: [] }));
    return () => { alive = false; };
  }, []);
  useEffect(load, [load]);

  if (state.status === "loading") return <SkeletonGrid count={6} />;
  if (state.status === "error" || !state.products.length) {
    return (
      <div className="rounded-card bg-neutral-50 py-16 text-center">
        <p className="text-lg font-bold text-ink">Products coming soon</p>
        <p className="mt-1 text-sm text-neutral-500">Deals are being lined up — check back shortly.</p>
        <Link href="/products/laptops" className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Browse all products</Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
      {state.products.map((p) => <ProductCard key={p.id} product={p} className="w-full" />)}
    </div>
  );
}

export default function FlashSaleView({ config }) {
  const pos = config.banner.position || "hero";
  const isHero = pos === "hero";

  return (
    <div className="pb-16">
      {isHero ? (
        <HeroBanner config={config} />
      ) : (
        <>
          {pos === "top" && <BannerStrip banner={config.banner} />}
          <div className="pt-8 sm:pt-12"><TitleBlock config={config} /></div>
          {pos === "below-title" && <div className="mt-8"><BannerStrip banner={config.banner} /></div>}
          <div className="mt-8"><TimerCta config={config} /></div>
          {pos === "above-products" && <div className="mt-8"><BannerStrip banner={config.banner} /></div>}
        </>
      )}

      <section id="products" className="mt-10 sm:mt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Products />
        </div>
      </section>
    </div>
  );
}
