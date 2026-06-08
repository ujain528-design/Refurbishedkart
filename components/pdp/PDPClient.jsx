"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ProductRow from "@/components/ProductRow";
import Gallery from "@/components/pdp/Gallery";
import PurchasePanel from "@/components/pdp/PurchasePanel";
import ReviewsSection from "@/components/pdp/ReviewsSection";
import { ErrorState } from "@/components/ui/States";
import { CATEGORY_SLUGS } from "@/lib/data";
import { variantsFor, specRowsFor, descriptionFor } from "@/lib/pdp";
import { getProduct, getReviews, getProducts } from "@/lib/api";

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

  const load = useCallback(() => {
    let alive = true;
    setStatus("loading");
    getProduct(id)
      .then((p) => {
        if (!alive) return;
        if (!p) { setStatus("notfound"); return; }
        setProduct(p);
        setStatus("ready");
        // secondary fetches — non-blocking, failures degrade gracefully
        getReviews(id).then((r) => alive && setReviewsData(r)).catch(() => {});
        getProducts({ category: p.category, limit: 6, exclude: id })
          .then((rows) => alive && setRelated(rows)).catch(() => {});
        getProducts({ tags: "bestseller", limit: 6, exclude: id })
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
  const specRows = specRowsFor(product);
  const description = descriptionFor(product);
  const rating = reviewsData.summary?.avg ?? 4.5;
  const ratingCount = reviewsData.summary?.total ?? 127;

  return (
    <>
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="text-[13px] text-neutral-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span className="mx-2">/</span>
            <Link href={`/products/${category}`} className="hover:text-brand">{categoryName}</Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-ink">{product.name}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <Gallery images={product.images} alt={product.name} />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">{product.name}</h1>
              <PurchasePanel product={product} variants={variants} rating={rating} ratingCount={ratingCount} />
            </div>
          </div>

          <div className="mt-16 max-w-3xl">
            <h2 className="section-heading">Specifications</h2>
            <table className="mt-7 w-full overflow-hidden rounded-card border border-black/5 text-sm shadow-card">
              <tbody>
                {specRows.map(([label, value], i) => (
                  <tr key={label} className={i % 2 ? "bg-white" : "bg-brand-softer/60"}>
                    <th className="w-2/5 px-5 py-3.5 text-left font-semibold text-neutral-500">{label}</th>
                    <td className="px-5 py-3.5 font-medium text-ink">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-16 max-w-3xl">
            <h2 className="section-heading">About this device</h2>
            <div className="mt-7 space-y-4 text-[15px] leading-relaxed text-neutral-600">
              {description.paragraphs.map((para, i) => (<p key={i}>{para}</p>))}
            </div>
            <ul className="mt-6 space-y-2.5">
              {description.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-neutral-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <ReviewsSection reviews={reviewsData.reviews} />
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
    </>
  );
}
