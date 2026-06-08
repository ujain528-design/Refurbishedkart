"use client";

import { useWishlist } from "@/lib/WishlistContext";
import { HeartIcon } from "@/components/Icons";

/* Wishlist toggle on product cards — backed by WishlistContext (persists,
   reflected in /account). Works even on out-of-stock cards. */
export default function WishlistButton({ productId }) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-card transition-all duration-200 hover:scale-110 ${
        saved ? "text-red-500" : "text-neutral-400 hover:text-red-500"
      }`}
    >
      <HeartIcon style={{ width: 18, height: 18, fill: saved ? "currentColor" : "none" }} />
    </button>
  );
}
