"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR, WHATSAPP_NUMBER } from "@/lib/data";
import { defaultSelection, priceFor, TRUST_POLICIES } from "@/lib/pdp";
import { HeartIcon, TruckIcon, ReturnIcon, ShieldIcon, ChevronRight, CloseIcon } from "@/components/Icons";
import StarRating from "@/components/StarRating";
import InspectionPanel from "@/components/pdp/InspectionPanel";
import CheckpointCards from "@/components/pdp/CheckpointCards";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { useAuth } from "@/lib/AuthContext";

const selectCls =
  "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:opacity-50";

const returnPolicy = TRUST_POLICIES.find((p) => p.id === "returns");
const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi, I have a question about a RefurbishedKart device."
)}`;

/* Free-delivery date = 5 business days from today. Computed on the client to
   avoid an SSR/build-time date mismatch. */
function useDeliveryDate() {
  const [label, setLabel] = useState("in 3–5 business days");
  useEffect(() => {
    const d = new Date();
    let added = 0;
    while (added < 5) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    setLabel(d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }));
  }, []);
  return label;
}

export default function PurchasePanel({ product, variants, rating = 4.5, ratingCount = 127 }) {
  const hasVariants = !!variants;
  const [sel, setSel] = useState(() => (hasVariants ? defaultSelection(variants) : { ram: null, ssd: null }));
  const [added, setAdded] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const router = useRouter();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const { isLoggedIn } = useAuth();
  const deliveryDate = useDeliveryDate();
  const wish = has(product.id);

  // ESC closes the return modal too
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setReturnOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (returnOpen) document.body.style.overflow = "hidden";
    return () => { if (returnOpen) document.body.style.overflow = ""; };
  }, [returnOpen]);

  const a = product.attrs;

  // stock + price (variant-aware or flat)
  const stock = hasVariants
    ? Math.min(variants.unitStock, variants.ramStock[sel.ram] ?? 0, variants.ssdStock[sel.ssd] ?? 0)
    : product.stock;
  const unavailable = stock === 0;
  const lowStock = stock > 0 && stock <= 5;
  const total = hasVariants ? priceFor(product, sel.ram, sel.ssd) : product.price;

  const ramAvailable = (ram) => (variants.ramStock[ram] ?? 0) > 0;
  const ssdAvailable = (ssd) => (variants.ssdStock[ssd] ?? 0) > 0;

  const addToCart = () => {
    const ok = addItem(product, sel.ram, sel.ssd);
    if (ok) { setAdded(true); setTimeout(() => setAdded(false), 2000); }
    return ok;
  };
  const buyNow = () => {
    if (!addToCart()) return;
    router.push(isLoggedIn ? "/checkout" : "/login?redirect=/checkout");
  };

  // live spec summary mirrors the selected configuration
  const summary = hasVariants
    ? [
        a.processor && `${a.processor}${a.gen && !a.gen.startsWith("Apple") ? ` ${a.gen}` : ""}`,
        `${sel.ram}GB`,
        `${sel.ssd} SSD`,
        a.screen && `${a.screen}${a.os === "macOS" ? " Retina" : " FHD"}${a.touchscreen ? " Touch" : ""}`,
      ].filter(Boolean).join(" · ")
    : product.specs;

  return (
    <div>
      <p className="mt-2 text-[14px] text-neutral-500">{summary}</p>
      <div className="mt-2">
        <StarRating rating={rating} count={ratingCount} />
      </div>

      {/* 4. Variant selector (above price) */}
      {hasVariants && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-neutral-500">RAM</span>
            <select value={sel.ram} onChange={(e) => setSel((s) => ({ ...s, ram: +e.target.value }))} className={selectCls}>
              {variants.ramOptions.map((ram) => (
                <option key={ram} value={ram} disabled={!ramAvailable(ram)}>
                  {ram} GB{variants.onboardRam === ram ? " (Onboard)" : ""}{!ramAvailable(ram) ? " — Unavailable" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-neutral-500">SSD</span>
            <select value={sel.ssd} onChange={(e) => setSel((s) => ({ ...s, ssd: e.target.value }))} className={selectCls}>
              {variants.ssdOptions.map((ssd) => (
                <option key={ssd} value={ssd} disabled={!ssdAvailable(ssd)}>
                  {ssd}{variants.onboardSsd === ssd ? " (Onboard)" : ""}{!ssdAvailable(ssd) ? " — Unavailable" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* 5. Price row + Add to Cart + Wishlist */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-neutral-400 line-through">{formatINR(product.mrp)}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-ink">{formatINR(total)}</span>
            <span className="text-sm font-bold text-brand-mid">{Math.round((1 - total / product.mrp) * 100)}% off</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={unavailable}
            onClick={addToCart}
            className="rounded-full border-2 border-brand px-6 py-3 text-sm font-bold text-brand transition-colors hover:bg-brand-softer disabled:cursor-not-allowed disabled:opacity-40"
          >
            {added ? "Added ✓" : "Add to Cart"}
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
      </div>
      {unavailable ? (
        <p className="mt-2 text-[13px] font-bold text-red-600">This configuration is currently unavailable.</p>
      ) : lowStock ? (
        <p className="mt-2 text-[13px] font-bold text-red-600">Only {stock} left</p>
      ) : null}

      {/* 6. Buy Now */}
      <button
        disabled={unavailable}
        onClick={buyNow}
        className="mt-3 w-full rounded-full bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        Buy Now
      </button>

      {/* 7. Delivery estimate card */}
      <div className="mt-4 flex items-center gap-3 rounded-card bg-[#EEF2FF] px-4 py-3">
        <TruckIcon style={{ width: 22, height: 22 }} className="shrink-0 text-indigo-500" />
        <p className="text-sm text-ink">
          <span className="font-bold">Free delivery</span> by {deliveryDate}
        </p>
      </div>

      {/* 8. Inspection checkpoint cards */}
      <CheckpointCards onOpen={() => setInspectOpen(true)} />

      {/* 9. Trust rows */}
      <div className="mt-4 space-y-2.5">
        <button
          onClick={() => setReturnOpen(true)}
          className="flex w-full items-center gap-3 rounded-card bg-[#EEF2FF] px-4 py-3 text-left transition-colors hover:bg-[#E3E8FF]"
        >
          <ReturnIcon style={{ width: 20, height: 20 }} className="shrink-0 text-brand" />
          <span className="flex-1 text-sm font-semibold text-ink">
            7-day returns&nbsp; | &nbsp;{a.warranty || "6-month"} warranty
          </span>
          <ChevronRight style={{ width: 16, height: 16 }} className="shrink-0 text-neutral-400" />
        </button>
        <button
          onClick={() => setInspectOpen(true)}
          className="flex w-full items-center gap-3 rounded-card bg-[#EEF2FF] px-4 py-3 text-left transition-colors hover:bg-[#E3E8FF]"
        >
          <ShieldIcon style={{ width: 20, height: 20 }} className="shrink-0 text-brand" />
          <span className="flex-1 text-sm font-semibold text-ink">Guaranteed by RefurbishedKart Promise</span>
          <ChevronRight style={{ width: 16, height: 16 }} className="shrink-0 text-neutral-400" />
        </button>
      </div>

      {/* inspection panel (controlled) */}
      <InspectionPanel
        product={product}
        warranty={a.warranty}
        open={inspectOpen}
        onClose={() => setInspectOpen(false)}
      />

      {/* return policy modal */}
      {returnOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Return policy"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] animate-overlay-in"
          onClick={() => setReturnOpen(false)}
        >
          <div className="relative w-full max-w-md rounded-card bg-white p-7 shadow-card-hover animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Close" onClick={() => setReturnOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-ink">
              <CloseIcon style={{ width: 18, height: 18 }} />
            </button>
            <h3 className="pr-8 text-lg font-extrabold tracking-tight text-ink">{returnPolicy.label}</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{returnPolicy.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
