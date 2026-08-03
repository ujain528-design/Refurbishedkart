"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { SkeletonGrid } from "@/components/ui/States";
import { getProducts } from "@/lib/api";

/* Live brand products grid. Fetches up to 12 products for the brand and renders
   them in the same card grid as the category pages. */
export default function BrandProducts({ brand, displayName }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    getProducts({ brand, limit: 12 })
      .then((rows) => { if (alive) { setProducts(rows || []); setStatus("ready"); } })
      .catch(() => alive && setStatus("error"));
    return () => { alive = false; };
  }, [brand]);

  if (status === "loading") return <div className="mt-7"><SkeletonGrid count={8} /></div>;

  if (status === "error" || products.length === 0) {
    return (
      <div className="mt-7 rounded-card border border-dashed border-black/10 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
        No products available for {displayName} currently.
      </div>
    );
  }

  return (
    <>
      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        {products.map((p) => (<ProductCard key={p.id} product={p} className="w-full" />))}
      </div>
      <div className="mt-8 text-center">
        <Link href={`/products/laptops?brand=${brand}`} className="inline-block rounded-full border-2 border-brand px-7 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand-softer">
          View All {displayName} Products
        </Link>
      </div>
    </>
  );
}
