"use client";

import { useEffect, useState, useCallback } from "react";
import ProductRow from "@/components/ProductRow";
import SectionHeading from "@/components/SectionHeading";
import { SkeletonRow, ErrorState } from "@/components/ui/States";
import { getProducts } from "@/lib/api";

/* Fetches a homepage product row by tag. Independent loading/error per row so
   one failing row doesn't blank the page. */
export default function LiveProductRow({ title, subtitle, tag, limit = 10, className = "" }) {
  const [state, setState] = useState({ status: "loading", products: [] });

  const load = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, status: "loading" }));
    getProducts({ tags: tag, limit })
      .then((products) => alive && setState({ status: "ready", products }))
      .catch(() => alive && setState({ status: "error", products: [] }));
    return () => { alive = false; };
  }, [tag, limit]);

  useEffect(load, [load]);

  if (state.status === "ready") {
    if (!state.products.length) return null; // hide empty rows on the homepage
    return <ProductRow title={title} subtitle={subtitle} products={state.products} className={className} />;
  }

  // loading / error keep the section header so layout doesn't jump
  return (
    <section className={`py-10 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={title} subtitle={subtitle} />
        {state.status === "error"
          ? <ErrorState message="Couldn't load this row." onRetry={load} />
          : <SkeletonRow count={5} />}
      </div>
    </section>
  );
}
