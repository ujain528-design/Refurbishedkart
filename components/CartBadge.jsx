"use client";

import { useCart } from "@/lib/CartContext";

/* Live cart count for the navbar, from the cart Context (localStorage-backed). */
export default function CartBadge() {
  const { count } = useCart();
  if (!count) return null;
  return (
    <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}
