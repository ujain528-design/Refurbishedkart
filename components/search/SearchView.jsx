"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NAV_CATEGORIES } from "@/lib/data";
import ListingClient from "@/components/ListingClient";
import ProductCard from "@/components/ProductCard";
import { SkeletonGrid, ErrorState } from "@/components/ui/States";
import { searchProductsApi, getProducts } from "@/lib/api";
import { randomSearchQuote } from "@/components/LoadingScreen";

export default function SearchView() {
  const params = useSearchParams();
  const q = (params.get("q") || "").trim();

  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [results, setResults] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [noResultQuote] = useState(randomSearchQuote); // helpful line on empty results

  const run = useCallback(() => {
    if (!q) { setStatus("idle"); return; }
    let alive = true;
    setStatus("loading");
    searchProductsApi(q)
      .then((rows) => {
        if (!alive) return;
        setResults(rows);
        setStatus("ready");
        if (!rows.length) {
          getProducts({ tags: "bestseller", limit: 4 }).then((r) => alive && setRecommended(r)).catch(() => {});
        }
      })
      .catch(() => alive && setStatus("error"));
    return () => { alive = false; };
  }, [q]);

  useEffect(run, [run]);

  if (!q) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6 lg:px-8 lg:py-16">
        <h1 className="text-xl font-bold text-ink">Search RefurbishedKart</h1>
        <p className="mt-2 text-sm text-neutral-500">Type a product, brand, or spec in the search bar above.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <p className="text-[13px] text-neutral-400">Search results for</p>
      <h1 className="section-heading">“{q}”</h1>

      {status === "loading" && <div className="mt-5 lg:mt-8"><SkeletonGrid count={8} /></div>}

      {status === "error" && (
        <div className="mt-5 lg:mt-8"><ErrorState message="Search failed. Please try again." onRetry={run} /></div>
      )}

      {status === "ready" && results.length === 0 && (
        <div className="mt-6 lg:mt-10">
          <div className="rounded-card bg-neutral-50 py-8 text-center lg:py-16">
            <p className="text-base lg:text-lg font-bold text-ink">No results for “{q}”</p>
            <p className="mx-auto mt-2 max-w-sm text-center italic" style={{ color: "#2e7d32", fontSize: "15px" }}>{noResultQuote}</p>
            <p className="mt-3 text-sm text-neutral-500">Try a broader term, or browse a category:</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {NAV_CATEGORIES.map((c) => (
                <Link key={c.name} href={`/products/${c.name.toLowerCase()}`} className="rounded-full bg-brand-soft px-4 py-2 text-[13px] font-semibold text-brand hover:bg-brand hover:text-white">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
          {recommended.length > 0 && (
            <>
              <h2 className="section-heading mt-6 lg:mt-12">Recommended for you</h2>
              <div className="mt-5 lg:mt-7 grid grid-cols-1 gap-4 lg:gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {recommended.map((p) => (<ProductCard key={p.id} product={p} className="w-full" />))}
              </div>
            </>
          )}
        </div>
      )}

      {status === "ready" && results.length > 0 && (
        <div className="mt-5 lg:mt-8">
          {/* key forces a fresh ListingClient when the query changes */}
          <ListingClient key={q} products={results} categoryName="results" />
        </div>
      )}
    </div>
  );
}
