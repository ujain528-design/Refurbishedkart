"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatINR } from "@/lib/data";
import { getOrder } from "@/lib/api";
import { BrokenDeviceIcon } from "@/components/Icons";
import { ErrorState } from "@/components/ui/States";
import { randomConfirmQuote } from "@/components/LoadingScreen";

export default function OrderConfirmation() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("orderId");
  const [quote] = useState(randomConfirmQuote); // celebratory line, one per page load

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) { router.replace("/"); return; } // direct visit → home (Step 9)
    let alive = true;
    setStatus("loading");
    getOrder(orderId)
      .then((o) => { if (alive) { setOrder(o); setStatus("ready"); } })
      .catch(() => alive && setStatus("error"));
    return () => { alive = false; };
  }, [orderId, router]);

  if (!orderId) return null;
  if (status === "loading") return <div className="py-24 text-center text-sm text-neutral-400">Loading your order…</div>;
  if (status === "error")
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 lg:py-24">
        <ErrorState message="Couldn't load your order." onRetry={() => router.refresh()} />
      </div>
    );

  const lines = order.lines || [];
  const delivery = order.delivery ?? 0;
  const totalPaid = order.total ?? order.subtotal - (order.discount || 0) + delivery;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:py-16 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex h-20 w-20 animate-check-pop items-center justify-center rounded-full bg-brand text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 38, height: 38 }}>
            <path d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <h1 className="mt-6 text-2xl lg:text-3xl font-extrabold tracking-tight text-ink">Order Placed Successfully!</h1>
        <p className="mt-2 text-sm text-neutral-500">A confirmation has been sent to your email.</p>
        <p className="mt-3 text-center italic" style={{ color: "#2e7d32", fontSize: "15px" }}>{quote}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand">Order ID: #{order.id}</span>
          {order.status && <span className="rounded-full bg-neutral-100 px-4 py-1.5 text-sm font-bold text-neutral-600">{order.status}</span>}
        </div>
      </div>

      <div className="mt-6 lg:mt-10 rounded-card border border-black/5 bg-white p-4 lg:p-6 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">Items Ordered</h2>
        <div className="mt-4 space-y-4">
          {lines.map((it, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                <BrokenDeviceIcon style={{ width: 24, height: 24 }} className="text-neutral-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{it.name}</p>
                <p className="text-[13px] text-neutral-500">
                  {it.ram ? `${it.ram}GB` : ""}{it.ram && it.ssd ? " · " : ""}{it.ssd ? `${it.ssd} SSD` : ""} · Qty {it.qty}
                </p>
              </div>
              <p className="text-sm font-bold text-ink">{formatINR(it.unitPrice * it.qty)}</p>
            </div>
          ))}
        </div>

        <dl className="mt-5 space-y-2 border-t border-black/5 pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd className="font-semibold text-ink">{formatINR(order.subtotal)}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between"><dt className="text-brand">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd className="font-semibold text-brand">− {formatINR(order.discount)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-neutral-500">Delivery</dt><dd className="font-semibold text-ink">{delivery === 0 ? <span className="text-brand">Free</span> : formatINR(delivery)}</dd></div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-black/5 pt-4">
          <span className="text-sm font-bold text-ink">Total Paid</span>
          <span className="text-xl font-extrabold tracking-tight text-brand">{formatINR(totalPaid)}</span>
        </div>
        <p className="mt-1 text-[12px] text-neutral-400">Inclusive of all taxes</p>
      </div>

      <div className="mt-5 rounded-card bg-brand-softer px-5 py-4 text-center text-sm font-semibold text-brand">
        Estimated delivery: 3–5 business days
      </div>

      {/* Cancellation note — subtle, not a CTA */}
      <p className="mt-4 text-center text-[12px] leading-relaxed text-neutral-400">
        Need to cancel? Call or WhatsApp{" "}
        <a href="tel:+918448296273" className="font-semibold text-neutral-500 hover:text-brand hover:underline">+91 8448296273</a>{" "}
        before dispatch. Cancellations after dispatch are not accepted —{" "}
        <Link href="/return-policy" className="font-semibold text-neutral-500 hover:text-brand hover:underline">return policy</Link> applies.
      </p>

      <div className="mt-5 lg:mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/account?tab=orders" className="flex-1 rounded-full border-2 border-brand py-2.5 lg:py-3 text-center text-sm font-bold text-brand transition-colors hover:bg-brand-softer">
          View My Orders
        </Link>
        <Link href="/products/laptops" className="flex-1 rounded-full bg-brand py-2.5 lg:py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brand-dark">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
