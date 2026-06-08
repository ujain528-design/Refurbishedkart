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
  const [added, setAdded] = useState(false);

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
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }
      }}
    >
      {added ? addedLabel : children}
    </button>
  );
}
