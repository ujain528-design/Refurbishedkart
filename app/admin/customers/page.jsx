"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { formatINR } from "@/lib/admin-data";
import { adminGetCustomers, adminExportCustomers } from "@/lib/api";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function Customers() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ totalCustomers: 0, whatsappSubscribers: 0 });
  const [status, setStatus] = useState("loading");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | whatsapp
  const [exporting, setExporting] = useState(""); // "" | "all" | "whatsapp"

  const load = useCallback(() => {
    setStatus("loading");
    adminGetCustomers()
      .then((r) => { setRows(r.customers || []); setCounts({ totalCustomers: r.totalCustomers || 0, whatsappSubscribers: r.whatsappSubscribers || 0 }); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const doExport = async (whatsappOnly) => {
    setExporting(whatsappOnly ? "whatsapp" : "all");
    try { await adminExportCustomers(whatsappOnly); toast("Export downloaded"); }
    catch (e) { toast(e.message || "Export failed", "error"); }
    finally { setExporting(""); }
  };

  const term = q.trim().toLowerCase();
  const shown = rows.filter((r) => {
    if (filter === "whatsapp" && !r.whatsappOptIn) return false;
    if (!term) return true;
    return `${r.name} ${r.email} ${r.phone}`.toLowerCase().includes(term);
  });

  return (
    <div>
      <PageHeader title="Customers" subtitle="Customer list, spend & WhatsApp subscribers." />

      {/* Counts */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:max-w-md">
        <div className="rounded-card border border-black/5 bg-white p-4 shadow-card">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Total Customers</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{counts.totalCustomers}</p>
        </div>
        <div className="rounded-card border border-emerald-200 bg-emerald-50 p-4 shadow-card">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-emerald-700">WhatsApp Subscribers</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-800">{counts.whatsappSubscribers}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…" className={`${inputCls} max-w-[280px]`} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputCls} max-w-[200px]`}>
          <option value="all">All customers</option>
          <option value="whatsapp">WhatsApp subscribers only</option>
        </select>
        <div className="ml-auto flex flex-wrap gap-2">
          <button onClick={() => doExport(false)} disabled={!!exporting} className={`${btnPrimary} disabled:opacity-50`}>{exporting === "all" ? "Exporting…" : "Export to Excel"}</button>
          <button onClick={() => doExport(true)} disabled={!!exporting} className={`${btnGhost} disabled:opacity-50`}>{exporting === "whatsapp" ? "Exporting…" : "Export WhatsApp List"}</button>
        </div>
      </div>

      {status === "loading" ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading customers…</p>
      ) : status === "error" ? (
        <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-neutral-600">Couldn&apos;t load customers.</p>
          <button onClick={load} className={`${btnPrimary} mt-4`}>Retry</button>
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-card border border-dashed border-black/10 bg-neutral-50 p-12 text-center text-sm text-neutral-500">No customers match.</div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Name</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3 text-right">Orders</th><th className="px-3 py-3 text-right">Spend</th>
              <th className="px-3 py-3">Last Order</th><th className="px-3 py-3 text-center">WhatsApp</th>
            </tr></thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={`${r.email || r.phone || r.name}-${i}`} className={i % 2 ? "bg-neutral-50/60" : ""}>
                  <td className="px-4 py-3 font-semibold text-ink">{r.name || "—"}</td>
                  <td className="px-3 py-3 text-neutral-600">{r.email || "—"}</td>
                  <td className="px-3 py-3 text-neutral-600">{r.phone || "—"}</td>
                  <td className="px-3 py-3 text-right text-ink">{r.totalOrders}</td>
                  <td className="px-3 py-3 text-right font-semibold text-ink">{formatINR(r.totalSpend)}</td>
                  <td className="px-3 py-3 text-[12px] text-neutral-500">{fmtDate(r.lastOrderDate)}</td>
                  <td className="px-3 py-3 text-center">
                    {r.whatsappOptIn
                      ? <span className="rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[11px] font-bold text-[#0e7a4f]">Yes</span>
                      : <span className="text-[12px] text-neutral-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
