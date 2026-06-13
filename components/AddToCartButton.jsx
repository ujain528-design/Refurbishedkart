"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";

/* Client island so server-rendered cards/PDP branches can add to the cart.
   product must be a plain serializable object (from lib/data). ram/ssd
   optional — omitted = default config. redirectTo = navigate after adding
   (used for Buy Now); a "/checkout" target is login-gated (FIX 3). */
export default function AddToCartButton({
  product, ram = null, ssd = null, className, children, addedLabel = "Added ✓", redirectTo,
}) {
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState("idle"); // idle | busy | added

  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        e.preventDefault(); // don't trigger the card's stretched link
        e.stopPropagation();
        if (addItem(product, ram, ssd)) {
          if (redirectTo) {
            const dest = redirectTo === "/checkout" && !isLoggedIn ? "/login?redirect=/checkout" : redirectTo;
            return router.push(dest);
          }
          // brief spinner → green check ("Added!") → back; bounce the navbar cart
          if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("cart:bump"));
          setPhase("busy");
          setTimeout(() => setPhase("added"), 350);
          setTimeout(() => setPhase("idle"), 1850);
        }
      }}
    >
      {phase === "busy" ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-middle" aria-label="Adding…" />
      ) : phase === "added" ? (
        <span className="animate-check-pop inline-block">{addedLabel}</span>
      ) : (
        children
      )}
    </button>
  );
}
