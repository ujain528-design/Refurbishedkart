import Link from "next/link";
import { formatINR } from "@/lib/data";
import { generateProductTitle } from "@/lib/generateTitle";
import { categoryColor } from "@/lib/categoryColors";
import { BrokenDeviceIcon } from "@/components/Icons";

// "Laptops" → "Laptop" for natural alt text.
const singular = (c) => (c ? String(c).replace(/s$/, "") : "Product");
import WishlistButton from "@/components/WishlistButton";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductCard({ product, className = "w-[260px] shrink-0 snap-start" }) {
  // Price/MRP fallbacks: a product reaching the card without `price` (e.g. only
  // listedPrice set) must still render. Never let undefined hit formatINR.
  const price = Number(product.price ?? product.listedPrice ?? 0) || 0;
  const mrp = Number(product.mrp ?? 0) || 0;
  const off = mrp > 0 ? Math.round((1 - price / mrp) * 100) : 0;
  const seoTitle = generateProductTitle(product);
  // Display the SEO title (API-provided or computed); fall back to the raw name.
  const displayTitle = product.generatedTitle || seoTitle || product.name;
  const imgAlt = `${seoTitle} — Refurbished ${singular(product.category)} for sale in India`;
  const stock = product.chassisStock ?? product.stock;
  const oos = stock === 0;
  const lowStock = stock > 0 && stock <= 5;
  // Slug URL for SEO; falls back to numeric id (which 301s to the slug) until backfilled.
  const href = `/products/${(product.category || "laptops").toLowerCase()}/${product.slug || product.id}`;
  // Default-config spec summary, e.g. "16GB DDR4 | 256GB SSD"
  const specSummary = product.defaultRam?.capacity
    ? `${product.defaultRam.capacity} ${product.defaultRam.type || ""}`.trim() +
      (product.defaultSsd?.capacity ? ` | ${product.defaultSsd.capacity} SSD` : "")
    : product.specs;

  return (
    <article
      className={`${className} group relative flex flex-col overflow-visible rounded-card border border-warm-border bg-white transition-colors duration-[250ms] ease-out hover:border-brand`}
    >
      {/* stretched link — whole card opens the PDP; wishlist sits above it */}
      <Link href={href} className="absolute inset-0 z-[5]" aria-label={`View ${product.name}`} />
      {/* Image area — subtle 1.03 zoom on hover (Apple-restraint; no lift/shadow) */}
      <div className="relative h-[180px] overflow-hidden rounded-t-card bg-warm-alt">
        <div
          className={`flex h-full w-full items-center justify-center transition-transform duration-[250ms] ease-out group-hover:scale-[1.03] ${
            oos ? "opacity-50 grayscale" : ""
          }`}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={imgAlt}
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

      </div>

      {/* Content — flex column. Title grows naturally (full, untruncated); the
          price + button block is pinned to the card's base via mt-auto so the
          buttons line up across a stretched row regardless of title length. */}
      <div className={`flex flex-1 flex-col p-4 ${oos ? "opacity-50" : ""}`}>
        <p className="flex items-center gap-1.5 text-[0.7rem] font-normal uppercase tracking-[0.08em] text-muted">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: categoryColor(product.category).color }} aria-hidden="true" />
          {product.brand}
        </p>
        <h3 className="mt-1.5 text-[0.875rem] font-normal leading-[1.5] text-[#2c2c2e]">
          {displayTitle}
        </h3>
        {specSummary && <p className="mt-2 text-[0.78rem] font-normal text-muted">{specSummary}</p>}

        {/* bottom block — pinned to the base of the (stretched) card */}
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[1.2rem] font-bold text-dark">{formatINR(price)}</span>
            {mrp > price && <span className="text-[0.8rem] font-normal text-[#b0b0b0] line-through">{formatINR(mrp)}</span>}
          </div>
          {lowStock && <p className="mt-2 text-[12px] font-semibold text-red-600">Only {stock} left</p>}
          {!oos && (
            <AddToCartButton
              product={product}
              className="relative z-10 mt-3 block w-full rounded-md bg-dark py-2.5 text-center text-[0.825rem] font-medium text-white transition-colors hover:bg-[#2c2c2e]"
              addedLabel="Added ✓"
            >
              Add to Cart
            </AddToCartButton>
          )}
        </div>
      </div>
    </article>
  );
}
