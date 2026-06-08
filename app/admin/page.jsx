"use client";

import Link from "next/link";
import { StatCard, Badge, PageHeader } from "@/components/admin/ui";
import { DASHBOARD_STATS, ADMIN_ORDERS, LOW_STOCK, formatINR } from "@/lib/admin-data";

export default function AdminDashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Store overview at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {DASHBOARD_STATS.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* recent orders */}
        <div className="rounded-card border border-black/5 bg-white shadow-card">
          <div className="border-b border-black/5 px-5 py-3.5">
            <h2 className="text-sm font-bold text-ink">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[12px] uppercase tracking-wide text-neutral-400">
                  <th className="px-5 py-2.5">Order</th><th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Amount</th><th className="px-3 py-2.5">Status</th><th className="px-5 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody>
                {ADMIN_ORDERS.map((o, i) => (
                  <tr key={o.id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                    <td className="px-5 py-2.5 font-semibold text-brand">#{o.id}</td>
                    <td className="px-3 py-2.5 text-ink">{o.customer}</td>
                    <td className="px-3 py-2.5 font-semibold text-ink">{formatINR(o.total)}</td>
                    <td className="px-3 py-2.5"><Badge>{o.status}</Badge></td>
                    <td className="px-5 py-2.5 text-neutral-400">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* low stock */}
        <div className="rounded-card border border-black/5 bg-white shadow-card">
          <div className="border-b border-black/5 px-5 py-3.5">
            <h2 className="text-sm font-bold text-ink">Low Stock Alerts</h2>
          </div>
          <div className="divide-y divide-black/5">
            {LOW_STOCK.map((l, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{l.product}</p>
                  <p className="text-[12px] text-neutral-400">{l.variant}</p>
                </div>
                <span className="text-[13px] font-bold text-red-600">{l.stock} left</span>
                <Link href="/admin/products" className="rounded-full border border-black/10 px-3 py-1 text-[12px] font-bold text-ink hover:border-brand hover:text-brand">Edit</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
