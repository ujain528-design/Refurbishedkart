"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { formatINR } from "@/lib/data";
import { calculatePrice, getPublicSettings } from "@/lib/api";
import { BrokenDeviceIcon, CartIcon } from "@/components/Icons";

const FREE_DELIVERY_ABOVE = 999;
const DELIVERY_FEE = 99;

function QtyStepper({ qty, max, onChange }) {
  return (
    <div className="inline-flex items-center rounded-full border border-black/10">
      <button
        aria-label="Decrease quantity"
        onClick={() => onChange(qty - 1)}
        disabled={qty <= 1}
        className="px-3 py-1.5 text-ink disabled:opacity-30"
      >
        −
      </button>
      <span className="min-w-[28px] text-center text-sm font-bold tabular-nums">{qty}</span>
      <button
        aria-label="Increase quantity"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= max}
        className="px-3 py-1.5 text-ink disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export default function CartView() {
  const { ready, items, subtotal, discount, coupon, applyCoupon, clearCoupon, setQty, removeItem, MAX_QTY } = useCart();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);
  const [stockIssues, setStockIssues] = useState([]); // names whose real stock < requested
  const [rules, setRules] = useState({ freeDeliveryAbove: FREE_DELIVERY_ABOVE, deliveryFee: DELIVERY_FEE });

  // Delivery thresholds from store settings (admin-managed).
  useEffect(() => {
    getPublicSettings().then((s) => setRules({ freeDeliveryAbove: s.freeDeliveryAbove ?? FREE_DELIVERY_ABOVE, deliveryFee: s.deliveryFee ?? DELIVERY_FEE })).catch(() => {});
  }, []);

  // Validate each line against real server stock (PRD §5.3) via the pricing API.
  useEffect(() => {
    let alive = true;
    const variantItems = items.filter((it) => !it.outOfStock);
    if (!variantItems.length) { setStockIssues([]); return; }
    Promise.all(
      variantItems.map((it) =>
        calculatePrice(it.productId, it.ram, it.ssd)
          .then((r) => (r.sellable < it.qty ? { name: it.name, sellable: r.sellable } : null))
          .catch(() => null)
      )
    ).then((res) => { if (alive) setStockIssues(res.filter(Boolean)); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items.map((i) => [i.productId, i.ram, i.ssd, i.qty]))]);

  // login gate before checkout (FIX 3)
  const goToCheckout = () => router.push(isLoggedIn ? "/checkout" : "/login?redirect=/checkout");

  if (!ready) return <div className="py-24 text-center text-sm text-neutral-400">Loading your cart…</div>;

  // empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 lg:py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand">
          <CartIcon style={{ width: 38, height: 38 }} />
        </span>
        <h1 className="mt-6 text-xl lg:text-2xl font-extrabold tracking-tight text-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-neutral-500">Certified refurbished tech is a few clicks away.</p>
        <Link
          href="/products/laptops"
          className="mt-7 rounded-full bg-brand px-7 py-2.5 lg:py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const delivery = subtotal > rules.freeDeliveryAbove ? 0 : rules.deliveryFee;
  const total = subtotal - discount + delivery;

  const handleApply = async () => {
    setApplying(true);
    setCouponError("");
    try {
      const r = await applyCoupon(code);
      if (r.ok) setCode("");
      else { clearCoupon(); setCouponError(r.error || "Invalid coupon code"); }
    } catch (e) {
      clearCoupon();
      setCouponError(e.message || "Couldn't validate coupon");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-10 sm:px-6 lg:px-8">
      <h1 className="section-heading">Your Cart</h1>

      {stockIssues.length > 0 && (
        <div className="mt-5 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-bold">Stock changed:</span>{" "}
          {stockIssues.map((s) => `${s.name} (only ${s.sellable} left)`).join(", ")}. Adjust quantity before checkout.
        </div>
      )}

      <div className="mt-5 lg:mt-8 gap-4 lg:gap-8 lg:grid lg:grid-cols-[1fr_minmax(320px,35%)]">
        {/* ── items list ── */}
        <div className="space-y-4">
          {items.map((it) => (
            <article
              key={it.key}
              className={`flex gap-3 lg:gap-4 rounded-card border border-black/5 bg-white p-3 lg:p-4 shadow-card ${
                it.outOfStock ? "opacity-70" : ""
              }`}
            >
              {/* thumbnail */}
              <div className="flex h-16 w-16 lg:h-20 lg:w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                {it.image ? (
                  <img src={it.image} alt={it.name} className="h-full w-full object-contain p-1.5" />
                ) : (
                  <BrokenDeviceIcon style={{ width: 32, height: 32 }} className="text-neutral-300" />
                )}
              </div>

              {/* details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{it.brand}</p>
                    <h3 className="truncate text-[13px] lg:text-[15px] font-bold text-ink">{it.name}</h3>
                    {(it.ram || it.ssd) && (
                      <p className="mt-0.5 text-[13px] text-neutral-500">
                        {it.ram || ""}
                        {it.ram && it.ssd ? " · " : ""}
                        {it.ssd ? `${it.ssd} SSD` : ""}
                      </p>
                    )}
                  </div>
                  <button
                    aria-label="Remove item"
                    onClick={() => removeItem(it.key)}
                    className="shrink-0 rounded-full p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <TrashIcon style={{ width: 18, height: 18 }} />
                  </button>
                </div>

                {it.outOfStock ? (
                  <p className="mt-2 text-[13px] font-bold text-red-600">
                    Out of stock — remove to continue
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <QtyStepper qty={it.qty} max={Math.min(MAX_QTY, it.sellable)} onChange={(q) => setQty(it.key, q)} />
                    <div className="text-right">
                      <p className="text-[13px] lg:text-[15px] font-bold text-ink">{formatINR(it.unitPrice * it.qty)}</p>
                      {it.qty > 1 && (
                        <p className="text-[12px] text-neutral-400">{formatINR(it.unitPrice)} each</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* ── order summary (sticky desktop) ── */}
        <aside className="mt-8 lg:mt-0">
          <div className="rounded-card border border-black/5 bg-white p-4 lg:p-6 shadow-card lg:sticky lg:top-[124px]">
            <h2 className="text-base lg:text-lg font-bold text-ink">Order Summary</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd className="font-semibold text-ink">{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Delivery</dt>
                <dd className="font-semibold text-ink">
                  {delivery === 0 ? <span className="text-brand">Free</span> : formatINR(delivery)}
                </dd>
              </div>

              {/* coupon — input when none applied; applied row with remove when applied */}
              <div className="pt-1">
                {coupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-brand-soft px-3 py-2">
                    <span className="text-[13px] font-semibold text-brand">✓ {coupon.code} applied — {formatINR(discount)} off</span>
                    <button
                      onClick={() => { clearCoupon(); setCode(""); setCouponError(""); }}
                      aria-label="Remove coupon"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-brand transition-colors hover:bg-brand/15"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Coupon code"
                        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm uppercase placeholder:normal-case placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                      />
                      <button
                        onClick={handleApply}
                        disabled={applying || !code}
                        className="shrink-0 rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black disabled:opacity-40"
                      >
                        {applying ? "…" : "Apply"}
                      </button>
                    </div>
                    {couponError && <p className="mt-1.5 text-[13px] font-semibold text-red-600">{couponError}</p>}
                  </>
                )}
              </div>

              {coupon && (
                <div className="flex justify-between">
                  <dt className="text-brand">Discount{coupon.type === "flat" ? "" : ` (${coupon.value}%)`}</dt>
                  <dd className="font-semibold text-brand">− {formatINR(discount)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-black/5 pt-4">
              <span className="text-base font-bold text-ink">Total</span>
              <span className="text-xl lg:text-2xl font-extrabold tracking-tight text-ink">{formatINR(total)}</span>
            </div>
            <p className="mt-1 text-[12px] text-neutral-400">Inclusive of all taxes</p>

            <div className="mt-5 rounded-lg bg-brand-softer px-4 py-3 text-center text-[12px] font-medium text-brand">
              7-day returns · Warranty included · GST invoice on every order
            </div>

            <button
              onClick={goToCheckout}
              className="mt-5 hidden w-full rounded-full bg-brand py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-brand-dark lg:block"
            >
              Proceed to Checkout
            </button>
          </div>
        </aside>
      </div>

      {/* mobile sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
        <button
          onClick={goToCheckout}
          className="flex w-full items-center justify-between rounded-full bg-brand px-6 py-3 text-sm font-bold text-white"
        >
          <span>Proceed to Checkout</span>
          <span>{formatINR(total)}</span>
        </button>
      </div>
      {/* spacer so content isn't hidden behind the mobile bar */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
