"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ALL_PRODUCTS, NAV_CATEGORIES } from "@/lib/data";
import { searchProducts } from "@/lib/search";
import ListingClient from "@/components/ListingClient";
import ProductCard from "@/components/ProductCard";

export default function SearchView() {
  const params = useSearchParams();
  const q = (params.get("q") || "").trim();
  const { results, synonym } = searchProducts(q);

  if (!q) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold text-ink">Search RefurbishedKart</h1>
        <p className="mt-2 text-sm text-neutral-500">Type a product, brand, or spec in the search bar above.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-[13px] text-neutral-400">Search results for</p>
      <h1 className="section-heading">“{q}”</h1>
      {synonym && results.length > 0 && (
        <p className="mt-3 text-[13px] text-neutral-500">
          Showing {synonym.category}
          {synonym.formFactor ? ` · ${synonym.formFactor}` : synonym.brand ? ` · ${synonym.brand}` : ""} for “{q}”
        </p>
      )}

      {results.length === 0 ? (
        <div className="mt-10">
          <div className="rounded-card bg-neutral-50 py-16 text-center">
            <p className="text-lg font-bold text-ink">No results for “{q}”</p>
            <p className="mt-1 text-sm text-neutral-500">Try a broader term, or browse a category:</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {NAV_CATEGORIES.map((c) => (
                <Link key={c.name} href={`/products/${c.name.toLowerCase()}`} className="rounded-full bg-brand-soft px-4 py-2 text-[13px] font-semibold text-brand hover:bg-brand hover:text-white">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
          <h2 className="section-heading mt-12">Recommended for you</h2>
          <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {ALL_PRODUCTS.filter((p) => p.tags.includes("bestseller")).slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} className="w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <ListingClient products={results} categoryName="results" />
        </div>
      )}
    </div>
  );
}
