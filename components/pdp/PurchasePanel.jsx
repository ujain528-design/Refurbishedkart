"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/data";
import { defaultSelection, priceFor } from "@/lib/pdp";
import { HeartIcon } from "@/components/Icons";
import StarRating from "@/components/StarRating";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { useAuth } from "@/lib/AuthContext";

const selectCls =
  "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:opacity-50";

export default function PurchasePanel({ product, variants, rating = 4.5, ratingCount = 127 }) {
  // defaults per brief: RAM 8GB / SSD 256GB, else lowest — price valid from first paint
  const [sel, setSel] = useState(() => defaultSelection(variants));
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const { isLoggedIn } = useAuth();
  const wish = has(product.id);

  const addToCart = () => {
    const ok = addItem(product, sel.ram, sel.ssd);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
    return ok;
  };

  // Buy Now → checkout, gated by login (FIX 3)
  const buyNow = () => {
    if (!addToCart()) return;
    router.push(isLoggedIn ? "/checkout" : "/login?redirect=/checkout");
  };

  // component-level stock: config is sellable iff every component is in stock
  const stock = Math.min(
    variants.unitStock,
    variants.ramStock[sel.ram] ?? 0,
    variants.ssdStock[sel.ssd] ?? 0
  );
  const unavailable = stock === 0;
  const lowStock = stock > 0 && stock <= 5;

  // component-based total — breakdown is internal, never displayed
  const total = priceFor(product, sel.ram, sel.ssd);

  /* Each option's availability depends only on its OWN component stock —
     an in-stock 256GB SSD fits every RAM variant of this machine. */
  const ramAvailable = (ram) => (variants.ramStock[ram] ?? 0) > 0;
  const ssdAvailable = (ssd) => (variants.ssdStock[ssd] ?? 0) > 0;

  // spec summary mirrors the selected configuration
  const a = product.attrs;
  const summary = [
    a.processor && `${a.processor}${a.gen && !a.gen.startsWith("Apple") ? ` ${a.gen}` : ""}`,
    `${sel.ram}GB`,
    `${sel.ssd} SSD`,
    a.screen && `${a.screen}${a.os === "macOS" ? " Retina" : " FHD"}${a.touchscreen ? " Touch" : ""}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <p className="mt-2 text-[15px] text-neutral-500">{summary}</p>
      <div className="mt-3">
        <StarRating rating={rating} count={ratingCount} />
      </div>

      {/* variant selector */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-neutral-500">RAM</span>
          <select
            value={sel.ram}
            onChange={(e) => setSel((s) => ({ ...s, ram: +e.target.value }))}
            className={selectCls}
          >
            {variants.ramOptions.map((ram) => (
              <option key={ram} value={ram} disabled={!ramAvailable(ram)}>
                {ram} GB{variants.onboardRam === ram ? " (Onboard)" : ""}
                {!ramAvailable(ram) ? " — Unavailable" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-neutral-500">SSD</span>
          <select
            value={sel.ssd}
            onChange={(e) => setSel((s) => ({ ...s, ssd: e.target.value }))}
            className={selectCls}
          >
            {variants.ssdOptions.map((ssd) => (
              <option key={ssd} value={ssd} disabled={!ssdAvailable(ssd)}>
                {ssd}{variants.onboardSsd === ssd ? " (Onboard)" : ""}
                {!ssdAvailable(ssd) ? " — Unavailable" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* price + breakdown */}
      <div className="mt-6">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold tracking-tight text-ink">{formatINR(total)}</span>
          <span className="text-base text-neutral-400 line-through">{formatINR(product.mrp)}</span>
          <span className="text-sm font-bold text-brand-mid">
            {Math.round((1 - total / product.mrp) * 100)}% off
          </span>
        </div>
        {unavailable ? (
          <p className="mt-2 text-[13px] font-bold text-red-600">
            This configuration is currently unavailable.
          </p>
        ) : (
          lowStock && (
            <p className="mt-2 text-[13px] font-bold text-red-600">Only {stock} left</p>
          )
        )}
      </div>

      {/* buttons */}
      <div className="mt-6 space-y-3">
        <div className="flex gap-3">
          <button
            disabled={unavailable}
            onClick={addToCart}
            className="flex-1 rounded-full border-2 border-brand py-3 text-sm font-bold text-brand transition-colors hover:bg-brand-softer disabled:cursor-not-allowed disabled:opacity-40"
          >
            {added ? "Added to Cart ✓" : "Add to Cart"}
          </button>
          <button
            aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wish}
            onClick={() => toggle(product.id)}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
              wish ? "border-red-300 text-red-500" : "border-black/10 text-neutral-400 hover:border-red-300 hover:text-red-500"
            }`}
          >
            <HeartIcon style={{ width: 20, height: 20, fill: wish ? "currentColor" : "none" }} />
          </button>
        </div>
        <button
          disabled={unavailable}
          onClick={buyNow}
          className="w-full rounded-full bg-brand py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
