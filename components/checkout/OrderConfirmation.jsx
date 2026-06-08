"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/data";
import { BrokenDeviceIcon } from "@/components/Icons";

export default function OrderConfirmation() {
  const [order, setOrder] = useState(undefined); // undefined = loading, null = none

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("rk_last_order");
      setOrder(raw ? JSON.parse(raw) : null);
    } catch {
      setOrder(null);
    }
  }, []);

  if (order === undefined) {
    return <div className="py-24 text-center text-sm text-neutral-400">Loading…</div>;
  }

  // direct visit with no recent order
  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">No recent order</h1>
        <p className="mt-2 text-sm text-neutral-500">Looks like you reached this page directly.</p>
        <Link href="/products/laptops" className="mt-7 inline-block rounded-full bg-brand px-7 py-3 text-sm font-bold text-white hover:bg-brand-dark">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const delivery = order.subtotal > 999 ? 0 : 99;
  const totalPaid = order.subtotal - order.discount + delivery;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center">
        {/* green check, scale-in on load */}
        <span className="mx-auto flex h-20 w-20 animate-check-pop items-center justify-center rounded-full bg-brand text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 38, height: 38 }}>
            <path d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">Order Placed Successfully!</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Order confirmation sent to your email.
        </p>
        <p className="mt-4 inline-block rounded-full bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand">
          Order ID: #{order.id}
        </p>
      </div>

      {/* items */}
      <div className="mt-10 rounded-card border border-black/5 bg-white p-6 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">Items Ordered</h2>
        <div className="mt-4 space-y-4">
          {order.items.map((it, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                {it.image ? <img src={it.image} alt="" className="h-full w-full object-contain p-1" /> : <BrokenDeviceIcon style={{ width: 24, height: 24 }} className="text-neutral-300" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{it.name}</p>
                <p className="text-[13px] text-neutral-500">
                  {it.ram ? `${it.ram}GB${it.ramType ? ` ${it.ramType}` : ""}` : ""}{it.ram && it.ssd ? " · " : ""}{it.ssd ? `${it.ssd} SSD` : ""} · Qty {it.qty}
                </p>
              </div>
              <p className="text-sm font-bold text-ink">{formatINR(it.unitPrice * it.qty)}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-baseline justify-between border-t border-black/5 pt-4">
          <span className="text-sm font-bold text-ink">Total Paid</span>
          <span className="text-xl font-extrabold tracking-tight text-brand">{formatINR(totalPaid)}</span>
        </div>
        <p className="mt-1 text-[12px] text-neutral-400">Inclusive of all taxes</p>
      </div>

      {/* delivery estimate */}
      <div className="mt-5 rounded-card bg-brand-softer px-5 py-4 text-center text-sm font-semibold text-brand">
        Estimated delivery: 3–5 business days
      </div>

      {/* actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="#" className="flex-1 rounded-full border-2 border-brand py-3 text-center text-sm font-bold text-brand transition-colors hover:bg-brand-softer">
          Track Order
        </Link>
        <Link href="/products/laptops" className="flex-1 rounded-full bg-brand py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brand-dark">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
