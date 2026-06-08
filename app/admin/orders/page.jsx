"use client";

import { useState } from "react";
import { PageHeader, Badge, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { ADMIN_ORDERS, formatINR } from "@/lib/admin-data";

const STATUSES = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];

export default function Orders() {
  const toast = useToast();
  const [status, setStatus] = useState("All");
  const [method, setMethod] = useState("All");
  const [view, setView] = useState(null);

  const rows = ADMIN_ORDERS.filter((o) => (status === "All" || o.status === status) && (method === "All" || o.method === method));

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${ADMIN_ORDERS.length} orders`} action={<button onClick={() => toast("Orders exported to Excel")} className={btnGhost}>Export Excel</button>} />

      <div className="mb-4 flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} max-w-[160px]`}><option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${inputCls} max-w-[160px]`}><option>All</option>{["UPI", "Card", "Net Banking", "Wallet", "COD"].map((m) => <option key={m}>{m}</option>)}</select>
      </div>

      <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3">Order</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Items</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Payment</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Date</th>
          </tr></thead>
          <tbody>
            {rows.map((o, i) => (
              <tr key={o.id} onClick={() => setView(o)} className={`cursor-pointer hover:bg-brand-softer/40 ${i % 2 ? "bg-neutral-50/60" : ""}`}>
                <td className="px-4 py-3 font-semibold text-brand">#{o.id}</td>
                <td className="px-3 py-3 text-ink">{o.customer}</td>
                <td className="px-3 py-3 text-[12px] text-neutral-500">{o.items}</td>
                <td className="px-3 py-3 font-semibold text-ink">{formatINR(o.total)}</td>
                <td className="px-3 py-3 text-neutral-500">{o.method}</td>
                <td className="px-3 py-3"><Badge>{o.status}</Badge></td>
                <td className="px-3 py-3 text-[12px] text-neutral-400">{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {view && (
        <Modal title={`Order #${view.id}`} onClose={() => setView(null)}
          footer={<button onClick={() => toast("Invoice downloaded")} className={btnGhost}>Download Invoice</button>}>
          <div className="space-y-4 text-sm">
            <div><p className="text-[12px] font-semibold uppercase text-neutral-400">Customer</p><p className="mt-0.5 font-semibold text-ink">{view.customer}</p><p className="text-neutral-500">402, Brigade Gateway, Bengaluru, KA — 560055</p></div>
            <div><p className="text-[12px] font-semibold uppercase text-neutral-400">Items</p><p className="mt-0.5 text-ink">{view.items}</p></div>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-neutral-50 p-3">
              <span className="text-neutral-500">Subtotal</span><span className="text-right font-semibold">{formatINR(view.total)}</span>
              <span className="text-neutral-500">GST (incl.)</span><span className="text-right">{formatINR(Math.round(view.total * 18 / 118))}</span>
              <span className="font-bold text-ink">Total Paid</span><span className="text-right font-bold text-brand">{formatINR(view.total)}</span>
            </div>
            <Field label="Update Status"><select className={inputCls} defaultValue={view.status}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Courier"><input className={inputCls} placeholder="Delhivery" /></Field>
              <Field label="Tracking #"><input className={inputCls} /></Field>
              <Field label="Tracking URL"><input className={inputCls} /></Field>
            </div>
            <button onClick={() => { setView(null); toast("Order updated"); }} className={btnPrimary}>Save Changes</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
