"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StatCard, Badge, PageHeader } from "@/components/admin/ui";
import { formatINR } from "@/lib/admin-data";
import { adminGetDashboard } from "@/lib/api";

const STAT_DEFS = [
  { key: "ordersToday", label: "Orders Today" },
  { key: "revenueToday", label: "Revenue Today", money: true, accent: "text-brand" },
  { key: "activeProducts", label: "Active Products" },
  { key: "pendingReviews", label: "Pending Reviews", accent: "text-amber-600" },
  { key: "newEnquiries", label: "New Bulk Enquiries", accent: "text-indigo-600" },
  { key: "lowStockCount", label: "Low Stock Alerts", accent: "text-red-600" },
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = useCallback(() => {
    setStatus("loading");
    adminGetDashboard().then((d) => { setData(d); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (status === "loading") return (<div><PageHeader title="Dashboard" subtitle="Store overview at a glance." /><p className="py-16 text-center text-sm text-neutral-400">Loading…</p></div>);
  if (status === "error") return (
    <div><PageHeader title="Dashboard" subtitle="Store overview at a glance." />
      <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-neutral-600">Couldn't load dashboard.</p>
        <button onClick={load} className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Retry</button>
      </div>
    </div>
  );

  const { stats, recentOrders = [], lowStock = [] } = data;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Store overview at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {STAT_DEFS.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.money ? formatINR(stats[s.key] || 0) : String(stats[s.key] ?? 0)} accent={s.accent} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-card border border-black/5 bg-white shadow-card">
          <div className="border-b border-black/5 px-5 py-3.5"><h2 className="text-sm font-bold text-ink">Recent Orders</h2></div>
          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-neutral-400">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[12px] uppercase tracking-wide text-neutral-400">
                    <th className="px-5 py-2.5">Order</th><th className="px-3 py-2.5">Customer</th>
                    <th className="px-3 py-2.5">Amount</th><th className="px-3 py-2.5">Status</th><th className="px-5 py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o, i) => (
                    <tr key={o.id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                      <td className="px-5 py-2.5 font-semibold text-brand">#{o.id}</td>
                      <td className="px-3 py-2.5 text-ink">{o.customer}</td>
                      <td className="px-3 py-2.5 font-semibold text-ink">{formatINR(o.total)}</td>
                      <td className="px-3 py-2.5"><Badge>{o.status}</Badge></td>
                      <td className="px-5 py-2.5 text-neutral-400">{fmtDate(o.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-card border border-black/5 bg-white shadow-card">
          <div className="border-b border-black/5 px-5 py-3.5"><h2 className="text-sm font-bold text-ink">Low Stock Alerts</h2></div>
          <div className="divide-y divide-black/5">
            {lowStock.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-neutral-400">No low-stock items.</p>
            ) : lowStock.map((l, i) => (
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
