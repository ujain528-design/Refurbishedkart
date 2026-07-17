"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR, WHATSAPP_NUMBER } from "@/lib/data";
import { TRUST_POLICIES } from "@/lib/pdp";
import { HeartIcon, TruckIcon, ReturnIcon, ShieldIcon, ChevronRight, CloseIcon } from "@/components/Icons";
import StarRating from "@/components/StarRating";
import Script from "next/script";
import InspectionPanel from "@/components/pdp/InspectionPanel";
import CheckpointCards from "@/components/pdp/CheckpointCards";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import ShareButton from "@/components/ShareButton";
import { useAuth } from "@/lib/AuthContext";
import { calculatePrice } from "@/lib/api";

const selectCls =
  "w-full min-w-0 rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:opacity-50";

const returnPolicy = TRUST_POLICIES.find((p) => p.id === "returns");

function useDeliveryDate() {
  const [label, setLabel] = useState("in 3–5 business days");
  useEffect(() => {
    const d = new Date();
    let added = 0;
    while (added < 5) { d.setDate(d.getDate() + 1); const day = d.getDay(); if (day !== 0 && day !== 6) added++; }
    setLabel(d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }));
  }, []);
  return label;
}

export default function PurchasePanel({ product, rating = 4.5, ratingCount = 127 }) {
  const a = product.attrs || {};
  const showConfigs = (product.configs || []).filter((c) => c.show !== false);
  const defaultConfig = showConfigs.find((c) => c.isDefault) || showConfigs[0] || null;
  const multi = showConfigs.length > 1;

  const [sel, setSel] = useState(() => (defaultConfig ? { ram: defaultConfig.ram, ssd: defaultConfig.ssd } : { ram: null, ssd: null }));
  const [serverPrice, setServerPrice] = useState(null);
  const [pricing, setPricing] = useState(false);
  const [added, setAdded] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const router = useRouter();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const { isLoggedIn } = useAuth();
  const deliveryDate = useDeliveryDate();
  const wish = has(product.id);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setReturnOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (returnOpen) document.body.style.overflow = "hidden";
    return () => { if (returnOpen) document.body.style.overflow = ""; };
  }, [returnOpen]);

  const ramOptions = [...new Set(showConfigs.map((c) => c.ram))];
  const ssdOptionsFor = (ram) => [...new Set(showConfigs.filter((c) => c.ram === ram).map((c) => c.ssd))];
  const selectedConfig = showConfigs.find((c) => c.ram === sel.ram && c.ssd === sel.ssd) || defaultConfig;

  const onRam = (ram) => {
    const ssds = ssdOptionsFor(ram);
    setSel({ ram, ssd: ssds.includes(sel.ssd) ? sel.ssd : ssds[0] });
  };

  // Server price on variant change (PRD §5.3). Config price is the immediate fallback.
  useEffect(() => {
    if (!selectedConfig) return;
    let alive = true;
    setPricing(true);
    calculatePrice(product.id, String(sel.ram || "").split(" ")[0], sel.ssd)
      .then((r) => { if (alive) setServerPrice(r.price ?? r.unitPrice); })
      .catch(() => {})
      .finally(() => { if (alive) setPricing(false); });
    return () => { alive = false; };
  }, [product.id, sel.ram, sel.ssd]); // eslint-disable-line react-hooks/exhaustive-deps

  const chassis = product.chassisStock ?? product.stock ?? 0;
  const configAvailable = selectedConfig ? selectedConfig.available !== false : true;
  const unavailable = chassis === 0 || !configAvailable;
  const lowStock = chassis > 0 && chassis <= 5;
  const total = serverPrice ?? (selectedConfig ? selectedConfig.price : product.listedPrice ?? product.price);
  // MRP must shift by the same delta as the listed price so the discount %
  // stays consistent across variants: selectedMRP = baseMRP + (selectedPrice − baseListedPrice).
  const baseListed = product.listedPrice ?? product.price ?? 0;
  const displayMrp = product.mrp ? product.mrp + (total - baseListed) : null;

  // Re-render Razorpay's affordability widget when the price changes (variant switch).
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.renderAffordabilityWidget === "function") {
      window.renderAffordabilityWidget();
    }
  }, [total]);

  const addToCart = () => {
    const ok = addItem(product, sel.ram, sel.ssd);
    if (ok) { setAdded(true); setTimeout(() => setAdded(false), 2000); }
    return ok;
  };
  const buyNow = () => { if (!addToCart()) return; router.push(isLoggedIn ? "/checkout" : "/login?redirect=/checkout"); };

  const specSummary = selectedConfig
    ? `${sel.ram} | ${sel.ssd} SSD${a.processor ? ` · ${a.processor}${a.gen && !String(a.gen).startsWith("Apple") ? ` ${a.gen}` : ""}` : ""}`
    : product.specs;

  return (
    <div>
      <p className="mt-2 text-[13px] text-neutral-500 lg:text-[14px]">{specSummary}</p>
      <div className="mt-2"><StarRating rating={rating} count={ratingCount} /></div>

      {/* Variant selector — dropdowns only when >1 config; otherwise fixed text */}
      {multi ? (
        // Stack on phones, side-by-side from sm. min-w-0 lets each select shrink
        // below its longest option's intrinsic width (which otherwise pushed the
        // SSD column off the right edge on mobile, causing horizontal scroll).
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-neutral-500">RAM</span>
            <select value={sel.ram} onChange={(e) => onRam(e.target.value)} className={selectCls}>
              {ramOptions.map((r) => {
                const cfg = showConfigs.find((c) => c.ram === r);
                const avail = cfg?.available !== false;
                return <option key={r} value={r} disabled={!avail}>{r}{!avail ? " — Currently unavailable" : ""}</option>;
              })}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-neutral-500">SSD</span>
            <select value={sel.ssd} onChange={(e) => setSel((s) => ({ ...s, ssd: e.target.value }))} className={selectCls}>
              {ssdOptionsFor(sel.ram).map((ss) => {
                const cfg = showConfigs.find((c) => c.ram === sel.ram && c.ssd === ss);
                const avail = cfg?.available !== false;
                return <option key={ss} value={ss} disabled={!avail}>{ss}{!avail ? " — Currently unavailable" : ""}</option>;
              })}
            </select>
          </label>
        </div>
      ) : selectedConfig ? (
        <p className="mt-4 inline-block rounded-lg bg-neutral-100 px-3 py-2 text-[13px] font-semibold text-ink">{sel.ram} | {sel.ssd} SSD — included</p>
      ) : null}

      {/* Price + Add to Cart + Wishlist */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          {displayMrp ? <p className="text-[13px] text-neutral-400 line-through">{formatINR(displayMrp)}</p> : null}
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold tracking-tight text-ink transition-opacity lg:text-3xl ${pricing ? "opacity-50" : ""}`}>{formatINR(total)}</span>
            {displayMrp ? <span className="text-sm font-bold text-brand-mid">{Math.round((1 - total / displayMrp) * 100)}% off</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={unavailable} onClick={addToCart} className="flex-1 rounded-card bg-dark px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2c2c2e] disabled:cursor-not-allowed disabled:opacity-40 lg:py-3.5">
            {added ? "Added ✓" : "Add to Cart"}
          </button>
          <button aria-label={wish ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={wish} onClick={() => toggle(product.id)}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-card border transition-all duration-200 ${wish ? "border-red-300 text-red-500" : "border-warm-border text-neutral-400 hover:border-red-300 hover:text-red-500"}`}>
            <HeartIcon style={{ width: 20, height: 20, fill: wish ? "currentColor" : "none" }} />
          </button>
          <ShareButton title={product.name} variant="pdp" className="shrink-0" />
        </div>
      </div>
      {unavailable ? (
        <p className="mt-2 text-[13px] font-bold text-red-600">{chassis === 0 ? "Out of stock" : "This configuration is currently unavailable."}</p>
      ) : lowStock ? (
        <p className="mt-2 text-[13px] font-bold text-red-600">Only {chassis} left</p>
      ) : null}

      {/* Razorpay official Affordability Widget — below price, above Buy Now. Only > ₹5,000. */}
      {total > 5000 && (
        <div
          className="razorpay-affordability-widget mt-4"
          data-key={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
          data-amount={String(total * 100)}
        />
      )}
      <Script
        src="https://cdn.razorpay.com/widgets/affordability/affordability.js"
        strategy="lazyOnload"
        onLoad={() => {
          // Force a render once the script is actually loaded — the widget div already
          // exists by then, so the auto-scan can't miss it (fixes the lazyOnload race).
          if (typeof window.renderAffordabilityWidget === "function") window.renderAffordabilityWidget();
        }}
      />

      <button disabled={unavailable} onClick={buyNow} className="mt-3 w-full rounded-card bg-dark py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2c2c2e] disabled:cursor-not-allowed disabled:opacity-40 lg:py-3.5">
        Buy Now
      </button>

      <div className="mt-4 flex items-center gap-3 rounded-card bg-[#EEF2FF] px-4 py-3">
        <TruckIcon style={{ width: 22, height: 22 }} className="shrink-0 text-indigo-500" />
        <p className="text-sm text-ink"><span className="font-bold">Free delivery</span> by {deliveryDate}</p>
      </div>

      <CheckpointCards onOpen={() => setInspectOpen(true)} />

      <div className="mt-4 space-y-2.5">
        <button onClick={() => setReturnOpen(true)} className="flex w-full items-center gap-3 rounded-card bg-[#EEF2FF] px-4 py-3 text-left transition-colors hover:bg-[#E3E8FF]">
          <ReturnIcon style={{ width: 20, height: 20 }} className="shrink-0 text-brand" />
          <span className="flex-1 text-sm font-semibold text-ink">7-day returns&nbsp; | &nbsp;{a.warranty || "6-month"} warranty</span>
          <ChevronRight style={{ width: 16, height: 16 }} className="shrink-0 text-neutral-400" />
        </button>
        <button onClick={() => setInspectOpen(true)} className="flex w-full items-center gap-3 rounded-card bg-[#EEF2FF] px-4 py-3 text-left transition-colors hover:bg-[#E3E8FF]">
          <ShieldIcon style={{ width: 20, height: 20 }} className="shrink-0 text-brand" />
          <span className="flex-1 text-sm font-semibold text-ink">Guaranteed by RefurbishedKart Promise</span>
          <ChevronRight style={{ width: 16, height: 16 }} className="shrink-0 text-neutral-400" />
        </button>
      </div>

      <InspectionPanel product={product} warranty={a.warranty} open={inspectOpen} onClose={() => setInspectOpen(false)} />

      {returnOpen && (
        <div role="dialog" aria-modal="true" aria-label="Return policy" className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] animate-overlay-in" onClick={() => setReturnOpen(false)}>
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
