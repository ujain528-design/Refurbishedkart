"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { SkeletonGrid } from "@/components/ui/States";
import { getProducts } from "@/lib/api";

/* Live products filtered by category + price range. */
export default function BudgetProducts({ category, minPrice, maxPrice, categoryLabel }) {
  const [status, setStatus] = useState("loading");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    getProducts({ category, minPrice, maxPrice, limit: 12 })
      .then((rows) => { if (alive) { setProducts(rows || []); setStatus("ready"); } })
      .catch(() => alive && setStatus("error"));
    return () => { alive = false; };
  }, [category, minPrice, maxPrice]);

  if (status === "loading") return <div className="mt-7"><SkeletonGrid count={8} /></div>;

  if (status === "error" || products.length === 0) {
    return (
      <div className="mt-7 rounded-card border border-dashed border-black/10 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
        Check back soon — we&apos;re adding more {categoryLabel} in this budget.
      </div>
    );
  }

  return (
    <>
      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        {products.map((p) => (<ProductCard key={p.id} product={p} className="w-full" />))}
      </div>
      <div className="mt-8 text-center">
        <Link href={`/products/${category}?minPrice=${minPrice}&maxPrice=${maxPrice}`} className="inline-block rounded-full border-2 border-brand px-7 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand-softer">
          View All {categoryLabel}
        </Link>
      </div>
    </>
  );
}
