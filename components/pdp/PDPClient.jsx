"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import ProductRow from "@/components/ProductRow";
import Gallery from "@/components/pdp/Gallery";
import PurchasePanel from "@/components/pdp/PurchasePanel";
import ReviewsSection from "@/components/pdp/ReviewsSection";
import WriteReview from "@/components/pdp/WriteReview";
import CompareModal from "@/components/pdp/CompareModal";
import RichDescription from "@/components/pdp/RichDescription";
import { ErrorState } from "@/components/ui/States";
import { CATEGORY_SLUGS } from "@/lib/data";
import { variantsFor, specRowsFor, descriptionFor } from "@/lib/pdp";
import { generateProductTitle } from "@/lib/generateTitle";
import { getProduct, getReviews, getProducts } from "@/lib/api";

const singularCat = (c) => (c ? String(c).replace(/s$/, "") : "Product");

function PDPSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid animate-pulse gap-10 lg:grid-cols-2">
        <div className="h-[420px] rounded-card bg-neutral-200" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-neutral-200" />
          <div className="h-4 w-1/2 rounded bg-neutral-100" />
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="h-12 rounded-lg bg-neutral-100" />
            <div className="h-12 rounded-lg bg-neutral-100" />
          </div>
          <div className="mt-6 h-10 w-1/3 rounded bg-neutral-200" />
          <div className="h-12 w-full rounded-full bg-neutral-100" />
          <div className="h-12 w-full rounded-full bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

export default function PDPClient({ category, id }) {
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | error
  const [product, setProduct] = useState(null);
  const [reviewsData, setReviewsData] = useState({ reviews: [], summary: null });
  const [related, setRelated] = useState([]);
  const [alsoViewed, setAlsoViewed] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const compareBtnRef = useRef(null);

  const load = useCallback(() => {
    let alive = true;
    setStatus("loading");
    getProduct(id)
      .then((p) => {
        if (!alive) return;
        if (!p) { setStatus("notfound"); return; }
        setProduct(p);
        setStatus("ready");
        // secondary fetches use the resolved NUMERIC id (route param may be a slug),
        // so reviews + related/also-viewed exclusion key on the real product id.
        const pid = p.id;
        getReviews(pid).then((r) => alive && setReviewsData(r)).catch(() => {});
        getProducts({ category: p.category, limit: 6, exclude: pid })
          .then((rows) => alive && setRelated(rows)).catch(() => {});
        getProducts({ tags: "bestseller", limit: 6, exclude: pid })
          .then((rows) => alive && setAlsoViewed(rows)).catch(() => {});
      })
      .catch((e) => {
        if (!alive) return;
        setStatus(e?.status === 404 ? "notfound" : "error");
      });
    return () => { alive = false; };
  }, [id]);

  useEffect(load, [load]);

  if (status === "loading") return <PDPSkeleton />;
  if (status === "error")
    return <div className="mx-auto max-w-3xl px-4 py-20"><ErrorState message="Couldn't load this product." onRetry={load} /></div>;
  if (status === "notfound")
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-ink">Product not found</h1>
        <p className="mt-3 text-sm text-neutral-500">This product may have been removed or is out of stock.</p>
        <Link href={`/products/${category}`} className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark">
          Browse {CATEGORY_SLUGS[category] || "products"}
        </Link>
      </div>
    );

  const categoryName = CATEGORY_SLUGS[category] || product.category;
  const variants = variantsFor(product);
  // Servers & workstations are built to order — show a custom-config CTA below the
  // gallery (fills the empty left-column space). Case/plural tolerant match.
  const showCustomConfigCta = ["servers", "workstations", "server", "workstation"].includes(String(category || product.category || "").toLowerCase());
  const specRows = specRowsFor(product);
  const description = descriptionFor(product);
  // "What's in the box" — newline-separated on the product; blank lines dropped.
  const boxItems = String(product.whatsInBox || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const rating = reviewsData.summary?.avg ?? 4.5;
  const ratingCount = reviewsData.summary?.total ?? 127;

  return (
    <>
      <section className="py-6 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="text-[13px] text-neutral-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span className="mx-2">/</span>
            <Link href={`/products/${category}`} className="hover:text-brand">{categoryName}</Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-ink">{product.name}</span>
          </nav>

          {/* min-w-0 on both columns so a wide intrinsic child (e.g. a select sized
              to its longest option) can't force the grid wider than the viewport. */}
          <div className="mt-6 grid min-w-0 gap-8 lg:mt-8 lg:gap-10 lg:grid-cols-2">
            <div className="min-w-0">
              <Gallery
                images={product.images}
                alt={`${generateProductTitle(product)} — Refurbished ${singularCat(product.category)} for sale in India`}
                altBase={`${product.brand || ""} ${product.name || ""} — Refurbished ${singularCat(product.category)}`.trim()}
              />
              {/* Custom-configuration CTA — servers & workstations only. Sits in the
                  empty space below the gallery. WhatsApp + email are click-to-contact. */}
              {showCustomConfigCta && (
                <div className="mt-5 rounded-card border-l-4 border-brand bg-brand-soft/40 px-4 py-3.5">
                  <p className="text-sm font-bold text-ink">Need a Custom Configuration?</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                    Servers and workstations can be configured to your exact requirements — RAM, storage, processors, and more.
                  </p>
                  <div className="mt-2.5 space-y-1 text-[13px]">
                    <p>💬 WhatsApp us: <a href="https://wa.me/918448296273" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">+91 8448296273</a></p>
                    <p>📧 Email us: <a href="mailto:info@refurbishedkart.com" className="font-semibold text-brand hover:underline">info@refurbishedkart.com</a></p>
                  </div>
                  <p className="mt-1.5 text-[12px] text-neutral-500">Mon–Sat, 11:00 AM – 6:00 PM</p>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {(() => {
                  const cond = product.condition || product.attrs?.condition || product.attrs?.grade;
                  if (!cond) return null;
                  const tone = cond === "Excellent" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                    : cond === "Good" ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                    : "bg-orange-50 text-orange-700 ring-orange-600/20";
                  return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ring-1 ${tone}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                      Condition: {cond}
                    </span>
                  );
                })()}
                {/* Mobile workstation = a laptop carrying the "workstation" tag. */}
                {(product.tags || []).map((t) => String(t).toLowerCase()).includes("workstation") && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[12px] font-bold text-indigo-700 ring-1 ring-indigo-600/20">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }} aria-hidden="true"><path d="M3 5h18v10H3zM8 19h8M12 15v4" /></svg>
                    Workstation
                  </span>
                )}
              </div>
              <h1 className="text-[1.4rem] font-extrabold tracking-tight text-ink lg:text-3xl">{product.generatedTitle || generateProductTitle(product) || product.name}</h1>
              <PurchasePanel product={product} variants={variants} rating={rating} ratingCount={ratingCount} />
            </div>
          </div>

          <div className="mt-7 max-w-3xl lg:mt-16">
            <h2 className="section-heading !text-[1.15rem] lg:!text-[1.75rem]">Specifications</h2>
            <table className="mt-3 w-full overflow-hidden rounded-card border border-black/5 text-[12px] shadow-card lg:mt-7 lg:text-sm">
              <tbody>
                {specRows.map(([label, value], i) => (
                  <tr key={label} className={i % 2 ? "bg-white" : "bg-brand-softer/60"}>
                    <th className="w-2/5 px-2.5 py-1.5 text-left font-semibold text-neutral-500 lg:px-5 lg:py-3.5">{label}</th>
                    <td className="px-2.5 py-1.5 font-medium text-ink lg:px-5 lg:py-3.5">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-9 max-w-3xl lg:mt-16">
            <h2 className="section-heading">About this device</h2>
            {product.description && product.description.trim() ? (
              <RichDescription
                text={product.description}
                className="mt-5 text-[13px] leading-relaxed text-neutral-600 lg:mt-7 lg:text-[15px]"
              />
            ) : (
              <div className="mt-5 space-y-4 text-[13px] leading-relaxed text-neutral-600 lg:mt-7 lg:text-[15px]">
                {description.paragraphs.map((para, i) => (<p key={i}>{para}</p>))}
              </div>
            )}
            <ul className="mt-6 space-y-2.5">
              {description.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-neutral-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {boxItems.length > 0 && (
            <div className="mt-9 max-w-3xl lg:mt-16">
              <h2 className="section-heading !text-[1.15rem] lg:!text-[1.75rem]">What&apos;s in the Box</h2>
              <ul className="mt-3 space-y-2.5 lg:mt-7">
                {boxItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-neutral-600 lg:text-[15px]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ReviewsSection reviews={reviewsData.reviews} />
          <div className="max-w-3xl">
            <WriteReview productId={product.id} />
          </div>
        </div>
      </section>

      <div className="border-t border-black/5 bg-offwhite">
        {related.length > 0 && (
          <ProductRow
            title="Related products"
            subtitle={`More from ${product.brand} and other ${product.category.toLowerCase()}.`}
            products={related}
          />
        )}
        {alsoViewed.length > 0 && (
          <ProductRow title="Customers also viewed" subtitle="Popular picks across the store." products={alsoViewed} className="pb-16" />
        )}
      </div>

      {/* Floating Compare button — opens the same-category compare flow */}
      <button
        ref={compareBtnRef}
        type="button"
        onClick={() => setCompareOpen(true)}
        className="fixed bottom-[140px] right-4 z-40 flex items-center gap-2 rounded-full border border-warm-border bg-white px-5 py-3 text-sm font-bold text-ink shadow-[0_6px_20px_rgba(0,0,0,0.12)] transition-colors hover:border-ink lg:bottom-[96px] lg:right-5"
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }} aria-hidden="true">
          <path d="M4 5h6M4 5l2-2M4 5l2 2M20 19h-6M20 19l-2-2M20 19l-2 2M7 5v14M17 19V5" />
        </svg>
        Compare
      </button>

      {compareOpen && (
        <CompareModal product={product} onClose={() => { setCompareOpen(false); compareBtnRef.current?.focus(); }} />
      )}
    </>
  );
}
