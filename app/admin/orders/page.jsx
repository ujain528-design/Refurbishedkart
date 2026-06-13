"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, Badge, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { formatINR } from "@/lib/admin-data";
import { paymentMethodLabel } from "@/lib/data";
import { adminGetOrders, adminUpdateOrderStatus, adminUpdateTracking } from "@/lib/api";

const STATUSES = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const itemsText = (o) => (o.lines || []).map((l) => `${l.name} ×${l.qty}`).join(", ");
const customerOf = (o) => o.customerName || o.shippingAddress?.name || "—";

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("All");
  const [load_, setLoad] = useState("loading");
  const [view, setView] = useState(null);
  const [form, setForm] = useState({ status: "", courier: "", trackingNumber: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoad("loading");
    adminGetOrders(status !== "All" ? { status } : {})
      .then((o) => { setOrders(o); setLoad("ready"); })
      .catch(() => setLoad("error"));
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const openOrder = (o) => { setView(o); setForm({ status: o.status, courier: o.courier || "", trackingNumber: o.trackingNumber || "" }); };

  const save = async () => {
    setSaving(true);
    try {
      if (form.status !== view.status) await adminUpdateOrderStatus(view.id, form.status);
      await adminUpdateTracking(view.id, { courier: form.courier, trackingNumber: form.trackingNumber });
      toast("Order updated");
      setView(null);
      load();
    } catch (e) { toast(e.message || "Update failed"); }
    finally { setSaving(false); }
  };

  const exportCsv = () => {
    const head = ["Order", "Customer", "Items", "Total", "Payment", "Status", "Date"];
    const lines = orders.map((o) => [o.id, customerOf(o), itemsText(o), o.total, paymentMethodLabel(o.paymentMethod), o.status, fmtDate(o.createdAt)]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orders.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${orders.length} orders`} action={<button onClick={exportCsv} className={btnGhost}>Export CSV</button>} />

      <div className="mb-4 flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} max-w-[160px]`}>
          <option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {load_ === "loading" ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading orders…</p>
      ) : load_ === "error" ? (
        <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-neutral-600">Couldn't load orders.</p>
          <button onClick={load} className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Retry</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-card border border-dashed border-black/10 bg-neutral-50 p-12 text-center text-sm text-neutral-500">No orders match this filter.</div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Order</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Items</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Payment</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Date</th>
            </tr></thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id} onClick={() => openOrder(o)} className={`cursor-pointer hover:bg-brand-softer/40 ${i % 2 ? "bg-neutral-50/60" : ""}`}>
                  <td className="px-4 py-3 font-semibold text-brand">#{o.id}</td>
                  <td className="px-3 py-3 text-ink">{customerOf(o)}</td>
                  <td className="px-3 py-3 text-[12px] text-neutral-500">{itemsText(o)}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{formatINR(o.total)}</td>
                  <td className="px-3 py-3 text-neutral-500">{paymentMethodLabel(o.paymentMethod)}</td>
                  <td className="px-3 py-3"><Badge>{o.status}</Badge></td>
                  <td className="px-3 py-3 text-[12px] text-neutral-400">{fmtDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view && (
        <Modal title={`Order #${view.id}`} onClose={() => setView(null)}>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-[12px] font-semibold uppercase text-neutral-400">Customer</p>
              <p className="mt-0.5 font-semibold text-ink">{customerOf(view)}</p>
              {view.shippingAddress && <p className="text-neutral-500">{[view.shippingAddress.line1, view.shippingAddress.city, view.shippingAddress.state, view.shippingAddress.pincode].filter(Boolean).join(", ")}</p>}
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase text-neutral-400">Items</p>
              <div className="mt-1 overflow-x-auto rounded-lg border border-black/5">
                <table className="w-full text-[12px]">
                  <thead><tr className="bg-neutral-50 text-left text-neutral-400">
                    <th className="px-2 py-1.5">Item</th><th className="px-2 py-1.5">Qty</th><th className="px-2 py-1.5">HSN</th><th className="px-2 py-1.5">GST</th><th className="px-2 py-1.5 text-right">Total</th>
                  </tr></thead>
                  <tbody>
                    {(view.lines || []).map((l, i) => {
                      const variant = [l.ram, l.ssd ? `${l.ssd} SSD` : ""].filter(Boolean).join(" | ");
                      return (
                        <tr key={i} className="border-t border-black/5">
                          <td className="px-2 py-1.5 text-ink">{l.name}{variant ? <span className="text-neutral-400"> ({variant})</span> : null}</td>
                          <td className="px-2 py-1.5">{l.qty}</td>
                          <td className="px-2 py-1.5">{l.hsnCode || "—"}</td>
                          <td className="px-2 py-1.5">{l.gstRate ? `${l.gstRate}%` : "—"}</td>
                          <td className="px-2 py-1.5 text-right">{formatINR((l.unitPrice || 0) * (l.qty || 1))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 rounded-lg bg-neutral-50 p-3">
              <span className="text-neutral-500">Subtotal (incl GST)</span><span className="text-right font-semibold">{formatINR(view.subtotal)}</span>
              {view.discount > 0 && (<><span className="text-neutral-500">Discount{view.couponCode ? ` (${view.couponCode})` : ""}</span><span className="text-right text-brand">− {formatINR(view.discount)}</span></>)}
              {view.gst?.igst != null
                ? (<><span className="text-neutral-500">IGST (incl)</span><span className="text-right">{formatINR(view.gst.igst)}</span></>)
                : view.gst?.total != null
                ? (<><span className="text-neutral-500">CGST + SGST (incl)</span><span className="text-right">{formatINR(view.gst.cgst)} + {formatINR(view.gst.sgst)}</span></>)
                : null}
              {view.delivery != null && (<><span className="text-neutral-500">Delivery</span><span className="text-right">{view.delivery ? formatINR(view.delivery) : "Free"}</span></>)}
              <span className="font-bold text-ink">Total Paid</span><span className="text-right font-bold text-brand">{formatINR(view.total)}</span>
            </div>
            <Field label="Update Status">
              <select className={inputCls} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Courier"><input className={inputCls} placeholder="Delhivery" value={form.courier} onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))} /></Field>
              <Field label="Tracking #"><input className={inputCls} value={form.trackingNumber} onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))} /></Field>
            </div>
            <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
