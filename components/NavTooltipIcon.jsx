"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { HeartIcon, CartIcon } from "@/components/Icons";
import CartBadge from "@/components/CartBadge";

function Tooltip({ text }) {
  return (
    <div className="invisible absolute right-0 top-full z-[60] translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
      <div className="relative whitespace-nowrap rounded-card border border-black/5 bg-white px-3.5 py-2 text-[13px] font-semibold text-ink shadow-card-hover">
        <span className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-black/5 bg-white" />
        {text}
      </div>
    </div>
  );
}

export function WishlistNavIcon() {
  // Wishlist is open to everyone — badge + tooltip show for guests too (FIX).
  const { count } = useWishlist();
  return (
    <div className="group relative">
      <Link href="/wishlist" aria-label="Wishlist" className="relative block rounded-full p-2.5 text-neutral-600 transition-colors hover:bg-brand-softer hover:text-brand">
        <HeartIcon style={{ width: 21, height: 21 }} />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
      <Tooltip text={`My Wishlist (${count} item${count === 1 ? "" : "s"})`} />
    </div>
  );
}

export function CartNavIcon() {
  const { isLoggedIn } = useAuth();
  const { count } = useCart();
  const [bump, setBump] = useState(false);
  // Bounce the cart icon when an item is added (event from AddToCartButton).
  useEffect(() => {
    const onBump = () => { setBump(false); requestAnimationFrame(() => setBump(true)); setTimeout(() => setBump(false), 320); };
    window.addEventListener("cart:bump", onBump);
    return () => window.removeEventListener("cart:bump", onBump);
  }, []);
  return (
    <div className="group relative">
      <Link href="/cart" aria-label="Cart" className="relative block rounded-full p-2.5 text-neutral-600 transition-colors hover:bg-brand-softer hover:text-brand">
        <span className={`inline-block ${bump ? "animate-cart-bounce" : ""}`}><CartIcon style={{ width: 21, height: 21 }} /></span>
        <CartBadge />
      </Link>
      {isLoggedIn && <Tooltip text={`My Cart (${count} item${count === 1 ? "" : "s"})`} />}
    </div>
  );
}
