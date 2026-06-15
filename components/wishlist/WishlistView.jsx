"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/WishlistContext";
import ProductCard from "@/components/ProductCard";
import { HeartIcon } from "@/components/Icons";

/* Public wishlist page — no login required (guest localStorage). */
export default function WishlistView() {
  const { ready, items } = useWishlist();

  if (!ready) return <div className="py-24 text-center text-sm text-neutral-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-10 sm:px-6 lg:px-8">
      <h1 className="section-heading">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="mt-6 lg:mt-10 flex flex-col items-center rounded-card bg-neutral-50 py-9 lg:py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
            <HeartIcon style={{ width: 30, height: 30 }} />
          </span>
          <p className="mt-5 text-[13px] lg:text-[15px] font-bold text-ink">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-neutral-500">Tap the heart on any product to save it here.</p>
          <Link href="/products/laptops" className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="mt-5 lg:mt-8 grid grid-cols-1 gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => <ProductCard key={p.id} product={p} className="w-full" />)}
        </div>
      )}
    </div>
  );
}
