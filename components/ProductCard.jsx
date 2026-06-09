import Link from "next/link";
import { formatINR } from "@/lib/data";
import { BrokenDeviceIcon } from "@/components/Icons";
import WishlistButton from "@/components/WishlistButton";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductCard({ product, className = "w-[260px] shrink-0 snap-start" }) {
  // Price/MRP fallbacks: a product reaching the card without `price` (e.g. only
  // listedPrice set) must still render. Never let undefined hit formatINR.
  const price = Number(product.price ?? product.listedPrice ?? 0) || 0;
  const mrp = Number(product.mrp ?? 0) || 0;
  const off = mrp > 0 ? Math.round((1 - price / mrp) * 100) : 0;
  const stock = product.chassisStock ?? product.stock;
  const oos = stock === 0;
  const lowStock = stock > 0 && stock <= 5;
  const href = `/products/${(product.category || "laptops").toLowerCase()}/${product.id}`;
  // Default-config spec summary, e.g. "16GB DDR4 | 256GB SSD"
  const specSummary = product.defaultRam?.capacity
    ? `${product.defaultRam.capacity} ${product.defaultRam.type || ""}`.trim() +
      (product.defaultSsd?.capacity ? ` | ${product.defaultSsd.capacity} SSD` : "")
    : product.specs;

  return (
    <article
      className={`${className} group relative overflow-hidden rounded-card border border-black/5 bg-white shadow-card transition-shadow duration-300 hover:shadow-card-hover`}
    >
      {/* stretched link — whole card opens the PDP; wishlist/cart sit above it */}
      <Link href={href} className="absolute inset-0 z-[5]" aria-label={`View ${product.name}`} />
      {/* Image area — zoom on hover, Add to Cart slides up */}
      <div className="relative h-[190px] overflow-hidden bg-neutral-100">
        <div
          className={`flex h-full w-full items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.08] ${
            oos ? "opacity-50 grayscale" : ""
          }`}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-300">
              <BrokenDeviceIcon style={{ width: 56, height: 56 }} />
              <span className="text-[11px] font-medium uppercase tracking-wider">
                Product Image
              </span>
            </div>
          )}
        </div>

        {/* badges — out of stock wins over sale/new */}
        {oos ? (
          <span className="absolute left-3 top-3 rounded-full bg-neutral-700 px-2.5 py-1 text-[11px] font-bold text-white">
            Out of Stock
          </span>
        ) : product.flashSale ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#B71C1C] px-2.5 py-1 text-[11px] font-bold text-white">
            {off}% OFF
          </span>
        ) : (
          product.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white">
              {product.badge}
            </span>
          )
        )}

        {/* wishlist stays active even when out of stock */}
        <WishlistButton productId={product.id} />

        {/* slide-up Add to Cart — hidden when out of stock */}
        {!oos && (
          <AddToCartButton
            product={product}
            className="absolute inset-x-0 bottom-0 z-10 translate-y-full bg-brand py-3 text-sm font-semibold text-white transition-transform duration-300 ease-out hover:bg-brand-dark group-hover:translate-y-0"
            addedLabel="Added to Cart ✓"
          >
            Add to Cart
          </AddToCartButton>
        )}
      </div>

      <div className={`p-4 ${oos ? "opacity-50" : ""}`}>
        <h3 className="truncate text-[15px] font-semibold text-ink" title={product.name}>
          {product.name}
        </h3>
        <p className="mt-1 truncate text-[13px] text-neutral-500" title={specSummary}>
          {specSummary}
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink">{formatINR(price)}</span>
          {mrp > price && (
            <>
              <span className="text-[13px] text-neutral-400 line-through">{formatINR(mrp)}</span>
              <span className="ml-auto text-[12px] font-bold text-brand-mid">{off}% off</span>
            </>
          )}
        </div>
        {lowStock && (
          <p className="mt-2 text-[12px] font-bold text-red-600">
            Only {stock} left
          </p>
        )}
      </div>
    </article>
  );
}
