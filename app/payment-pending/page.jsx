"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { formatINR } from "@/lib/data";
import { getOrder, createRazorpayOrder, verifyPayment } from "@/lib/api";
import { useCart } from "@/lib/CartContext";
import {
  isConfirmed, isCancelled, isPaymentPending,
  formatCountdown, msUntilDeadline, PAY_WARNING_MS,
} from "@/lib/orderStatus";

const COD_ADVANCE = 500; // ₹500 advance for COD orders (full amount otherwise)

/* Ensure the Razorpay checkout script is available. */
function loadRazorpay() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function PaymentPendingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const { user } = useAuth();
  const cart = useCart();

  const [order, setOrder] = useState(null);
  const [load, setLoad] = useState("loading"); // loading | ready | error | notfound
  const [now, setNow] = useState(Date.now());  // ticks every second for the countdown
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [cancelled, setCancelled] = useState(false);

  // ── Initial load ──
  const fetchOrder = useCallback(async () => {
    if (!orderId) { setLoad("notfound"); return null; }
    try {
      const o = await getOrder(orderId);
      if (!o) { setLoad("notfound"); return null; }
      setOrder(o);
      setLoad("ready");
      if (isCancelled(o.status)) setCancelled(true);
      return o;
    } catch (e) {
      setLoad(e?.status === 404 ? "notfound" : "error");
      return null;
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // ── 1s countdown tick ──
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Poll order status every 10s: Confirmed → confirmation page; Cancelled → show cancelled ──
  const redirectingRef = useRef(false);
  useEffect(() => {
    if (load !== "ready" || cancelled || redirectingRef.current) return;
    const poll = setInterval(async () => {
      try {
        const o = await getOrder(orderId);
        if (!o) return;
        setOrder(o);
        if (isConfirmed(o.status)) {
          redirectingRef.current = true;
          clearInterval(poll);
          router.push(`/order-confirmation?orderId=${orderId}`);
        } else if (isCancelled(o.status)) {
          setCancelled(true);
          clearInterval(poll);
        }
      } catch { /* transient — keep polling */ }
    }, 10000);
    return () => clearInterval(poll);
  }, [load, cancelled, orderId, router]);

  const timeLeft = order ? msUntilDeadline(order.paymentDeadline) : 0;
  const expired = !!order && timeLeft <= 0 && isPaymentPending(order.status);
  const isFinalCancelled = cancelled || (order && isCancelled(order.status));

  // ── Re-open Razorpay for the SAME order (no new DB order is created) ──
  const payNow = async () => {
    if (!order || paying) return;
    setPaying(true);
    setPayError("");
    try {
      const payAmount = order.paymentMethod === "COD" ? COD_ADVANCE : order.total;
      const created = await createRazorpayOrder(order.id, payAmount);
      const ok = await loadRazorpay();
      if (!ok || typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Couldn't load the payment gateway. Check your connection and try again.");
      }
      if (!created || !created.keyId || !created.razorpayOrderId) {
        throw new Error("Payment couldn't be initialised — please try again or contact support.");
      }
      const rzp = new window.Razorpay({
        key: created.keyId,
        amount: created.amount,
        currency: "INR",
        order_id: created.razorpayOrderId,
        name: "RefurbishedKart",
        description: `Order #${order.id}`,
        prefill: { name: user?.name || "", email: user?.email || "", contact: user?.phone || "" },
        theme: { color: "#1B5E20" },
        handler: async (resp) => {
          try {
            const v = await verifyPayment({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              orderId: order.id,
            });
            if (v.success) {
              try { cart?.clearCart?.(); } catch {}
              router.push(`/order-confirmation?orderId=${order.id}`);
            } else {
              setPayError(v.error || "Payment verification failed.");
              setPaying(false);
            }
          } catch (e) { setPayError(e.message || "Verification failed."); setPaying(false); }
        },
        modal: { ondismiss: () => { setPaying(false); } },
      });
      rzp.on("payment.failed", (r) => {
        setPayError(r?.error?.description || "Payment failed. Please try again before the timer expires.");
        setPaying(false);
      });
      rzp.open();
    } catch (e) {
      setPayError(e.message || "Couldn't start payment.");
      setPaying(false);
    }
  };

  // ── States ──
  if (load === "loading") {
    return <div className="py-24 text-center text-sm text-neutral-400">Loading your order…</div>;
  }
  if (load === "notfound") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-dark">Order not found</h1>
        <p className="mt-3 text-sm text-neutral-500">We couldn&apos;t find this order. It may have been removed.</p>
        <Link href="/products" className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark">Shop Now</Link>
      </div>
    );
  }
  if (load === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-dark">Couldn&apos;t load this order</h1>
        <button onClick={fetchOrder} className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark">Retry</button>
      </div>
    );
  }

  const lines = order.lines || [];
  const warning = timeLeft <= PAY_WARNING_MS;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}>
      {isFinalCancelled ? (
        /* ── Cancelled ── */
        <div className="rounded-card border border-red-100 bg-white p-8 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">✕</div>
          <h1 className="mt-4 font-display text-2xl font-bold text-dark">Order cancelled</h1>
          <p className="mt-2 text-sm text-neutral-500">This order has been cancelled. Please place a new order.</p>
          <Link href="/products" className="mt-6 inline-block rounded-full bg-brand px-7 py-3 text-sm font-bold text-white hover:bg-brand-dark">Shop Now</Link>
        </div>
      ) : (
        <>
          <div className="text-center">
            <h1 className="section-heading !text-2xl sm:!text-3xl">Complete Your Payment</h1>
            <p className="mt-2 text-[13px] text-neutral-500">Order <span className="font-semibold text-ink">#{order.id}</span></p>
          </div>

          {/* ── Countdown ── */}
          <div className="mt-6 rounded-card border border-black/5 bg-white p-6 text-center shadow-card">
            {expired ? (
              <>
                <p className="text-[12px] font-bold uppercase tracking-wide text-red-500">Expired</p>
                <div className="mt-1 font-mono text-5xl font-bold tabular-nums text-red-600">00:00</div>
                <p className="mt-3 text-sm font-semibold text-neutral-600">This order has been cancelled. Please place a new order.</p>
              </>
            ) : (
              <>
                <p className={`text-[12px] font-bold uppercase tracking-wide ${warning ? "text-red-500" : "text-amber-600"}`}>
                  Time left to pay
                </p>
                <div className={`mt-1 font-mono text-5xl font-bold tabular-nums sm:text-6xl ${warning ? "text-red-600" : "text-amber-600"}`}>
                  {formatCountdown(timeLeft)}
                </div>
                <p className="mt-3 text-[13px] text-neutral-500">Pay before the timer expires or your order will be cancelled.</p>
              </>
            )}
          </div>

          {/* ── Order summary ── */}
          <div className="mt-5 rounded-card border border-black/5 bg-white p-5 shadow-card">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Order summary</p>
            <div className="mt-3 space-y-2.5">
              {lines.map((l, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 text-ink">
                    {l.name}
                    <span className="text-neutral-400"> × {l.qty}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-ink">{formatINR((l.unitPrice || 0) * (l.qty || 1))}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
              <span className="text-sm font-bold text-ink">Total</span>
              <span className="text-lg font-bold text-brand">{formatINR(order.total)}</span>
            </div>
          </div>

          {payError && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{payError}</p>}

          {/* ── Pay Now (hidden once expired) ── */}
          {!expired && (
            <button
              onClick={payNow}
              disabled={paying}
              className="mt-5 w-full rounded-full bg-brand px-6 py-4 text-base font-bold text-white shadow-card transition-colors hover:bg-brand-dark disabled:opacity-60"
            >
              {paying ? "Opening payment…" : `Pay Now · ${formatINR(order.paymentMethod === "COD" ? COD_ADVANCE : order.total)}`}
            </button>
          )}
          {expired && (
            <Link href="/products" className="mt-5 block w-full rounded-full bg-brand px-6 py-4 text-center text-base font-bold text-white shadow-card hover:bg-brand-dark">
              Shop Now
            </Link>
          )}

          <p className="mt-4 text-center text-[12px] text-neutral-400">
            Need help? <Link href="/contact" className="font-semibold text-brand hover:underline">Contact us</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-neutral-400">Loading…</div>}>
      <PaymentPendingInner />
    </Suspense>
  );
}
