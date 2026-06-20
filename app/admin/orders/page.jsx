"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { formatINR } from "@/lib/admin-data";
import { paymentMethodLabel } from "@/lib/data";
import { adminGetOrders, adminUpdateOrderStatus, adminUpdateTracking } from "@/lib/api";
import { WhatsAppIcon } from "@/components/Icons";
import { isPaymentPending, isCancelled, formatCountdown, cancellationReasonLabel, PAY_WARNING_MS } from "@/lib/orderStatus";

const STATUSES = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];

// Top filter bar. Each tab maps to an exact status query (null = no filter / all).
const FILTERS = [
  { label: "All", value: null },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Pending Payment", value: "payment_pending" },
  { label: "COD", value: "cod_pending" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Shipped", value: "Shipped" },
  { label: "Delivered", value: "Delivered" },
];

// Only paid orders can be fulfilled (status changes / Shiprocket). Pending-payment
// and cancelled orders have their fulfillment controls locked.
const isFulfillable = (s) => !isPaymentPending(s) && !isCancelled(s);

const badgeCls = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums";

/* Color-coded status pill. Payment-pending shows a live countdown while inside the
   30-min window; a Cancelled order caused by a failed payment reads "Payment Failed". */
function StatusBadge({ order, now }) {
  const s = order.status;
  if (isPaymentPending(s)) {
    const left = order.paymentDeadline ? new Date(order.paymentDeadline).getTime() - now : 0;
    if (left > 0) {
      const warn = left <= PAY_WARNING_MS;
      return <span className={`${badgeCls} ${warn ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>Payment Pending · {formatCountdown(left)}</span>;
    }
    return <span className={`${badgeCls} bg-amber-100 text-amber-700`}>Payment Pending</span>;
  }
  if (isCancelled(s)) {
    const failed = order.cancellationReason === "payment_failed";
    return <span className={`${badgeCls} bg-red-100 text-red-700`}>{failed ? "Payment Failed" : "Cancelled"}</span>;
  }
  if (s === "cod_pending") return <span className={`${badgeCls} bg-amber-100 text-amber-700`}>COD · Awaiting Delivery</span>;
  if (s === "cod_failed") return <span className={`${badgeCls} bg-red-100 text-red-700`}>Failed Delivery</span>;
  const TONE = {
    Confirmed: "bg-green-100 text-green-700",
    Shipped: "bg-blue-100 text-blue-700",
    Delivered: "bg-emerald-200 text-emerald-900",
    Packed: "bg-indigo-100 text-indigo-700",
    Pending: "bg-amber-100 text-amber-700",
    Returned: "bg-neutral-200 text-neutral-600",
  };
  return <span className={`${badgeCls} ${TONE[s] || "bg-neutral-100 text-neutral-600"}`}>{s}</span>;
}
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const itemsText = (o) => (o.lines || []).map((l) => `${l.name} ×${l.qty}`).join(", ");
const customerOf = (o) => o.customerName || o.shippingAddress?.name || "—";
const emailOf = (o) => o.shippingAddress?.email || "";
const phoneOf = (o) => o.shippingAddress?.phone || o.shippingAddress?.mobile || "";
// Opt-in lives top-level or inside the (free-form) shippingAddress.
const waOptIn = (o) => (o.whatsappOptIn ?? o.shippingAddress?.whatsappOptIn) === true;

const WaBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#0e7a4f]" title="Opted in to WhatsApp order updates">
    <WhatsAppIcon style={{ width: 11, height: 11 }} /> WA ✓
  </span>
);

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All"); // FILTERS label
  const [now, setNow] = useState(Date.now());  // ticks for pending-payment countdowns
  const [load_, setLoad] = useState("loading");
  const [view, setView] = useState(null);
  const [form, setForm] = useState({ status: "", courier: "", trackingNumber: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoad("loading");
    const value = (FILTERS.find((f) => f.label === filter) || {}).value;
    adminGetOrders(value ? { status: value } : {})
      .then((o) => { setOrders(o); setLoad("ready"); })
      .catch(() => setLoad("error"));
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  // 1s tick so countdown badges on pending-payment orders stay live.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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

  // Direct status change (used by the COD delivery action buttons).
  const updateStatus = async (status) => {
    setSaving(true);
    try {
      await adminUpdateOrderStatus(view.id, status);
      toast("Order updated");
      setView(null);
      load();
    } catch (e) { toast(e.message || "Update failed"); }
    finally { setSaving(false); }
  };

  const exportCsv = () => {
    const head = ["Order", "Customer", "Phone", "Email", "WhatsApp", "Items", "Total", "Payment", "Status", "Date"];
    const lines = orders.map((o) => [o.id, customerOf(o), phoneOf(o), emailOf(o), waOptIn(o) ? "Yes" : "No", itemsText(o), o.total, paymentMethodLabel(o.paymentMethod), o.status, fmtDate(o.createdAt)]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orders.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${orders.length} orders`} action={<button onClick={exportCsv} className={btnGhost}>Export CSV</button>} />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.label)}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
              filter === f.label ? "bg-brand text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {f.label}
          </button>
        ))}
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
                  <td className="px-3 py-3 text-ink">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{customerOf(o)}</span>
                      {waOptIn(o) ? <WaBadge /> : null}
                    </div>
                    {(phoneOf(o) || emailOf(o)) && (
                      <div className="mt-0.5 text-[11px] text-neutral-400">
                        {[phoneOf(o), emailOf(o)].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-neutral-500">{itemsText(o)}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{formatINR(o.total)}</td>
                  <td className="px-3 py-3 text-neutral-500">{paymentMethodLabel(o.paymentMethod)}</td>
                  <td className="px-3 py-3"><StatusBadge order={o} now={now} /></td>
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
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge order={view} now={now} />
              {isCancelled(view.status) && view.cancellationReason && (
                <span className="text-[12px] font-semibold text-red-600">Reason: {cancellationReasonLabel(view.cancellationReason)}</span>
              )}
            </div>
            <div className="rounded-lg border border-black/5 bg-neutral-50/60 p-3">
              <p className="text-[12px] font-semibold uppercase text-neutral-400">Customer</p>
              <p className="mt-0.5 font-semibold text-ink">{customerOf(view)}</p>
              {/* Phone shown prominently — it's the number to message on WhatsApp */}
              {phoneOf(view) && (
                <p className="mt-1 text-[15px] font-bold text-ink">📞 {phoneOf(view)}</p>
              )}
              {emailOf(view) && <p className="text-[13px] text-neutral-500">{emailOf(view)}</p>}
              {/* WhatsApp consent */}
              <p className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-bold ${waOptIn(view) ? "bg-[#25D366]/15 text-[#0e7a4f]" : "bg-neutral-200/70 text-neutral-500"}`}>
                <WhatsAppIcon style={{ width: 13, height: 13 }} />
                WhatsApp Updates: {waOptIn(view) ? "Opted In ✓" : "Not opted in"}
              </p>
              {/* Full shipping address */}
              {view.shippingAddress && (
                <div className="mt-2">
                  <p className="text-[11px] font-semibold uppercase text-neutral-400">Shipping Address</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-600">
                    {[
                      view.shippingAddress.line1,
                      view.shippingAddress.line2,
                      view.shippingAddress.city,
                      view.shippingAddress.state,
                      view.shippingAddress.pincode,
                    ].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
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
              {(view.shippingCharge ?? view.delivery) != null && (<><span className="text-neutral-500">Shipping</span><span className="text-right">{(view.shippingCharge ?? view.delivery) ? formatINR(view.shippingCharge ?? view.delivery) : "FREE"}</span></>)}
              <span className="font-bold text-ink">Order Total</span><span className="text-right font-bold text-brand">{formatINR(view.total)}</span>
            </div>
            {view.paymentMethod === "COD" && (view.codUpfront != null || view.codRemaining != null) && (
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <span className="col-span-2 text-[11px] font-bold uppercase tracking-wide text-amber-700">Cash on Delivery</span>
                <span className="text-neutral-600">Upfront paid (10%)</span><span className="text-right font-semibold text-ink">{formatINR(view.codUpfront)}</span>
                <span className="text-neutral-600">Remaining (on delivery)</span><span className="text-right font-semibold text-ink">{formatINR(view.codRemaining)}</span>
              </div>
            )}
            {view.status === "cod_pending" ? (
              <div className="space-y-3">
                <p className="text-[13px] font-medium text-neutral-600">
                  This COD order is awaiting delivery. Once the courier delivers and collects the balance, mark it delivered. If delivery fails, mark it failed to trigger the courier-deduction process.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => updateStatus("Confirmed")} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Mark as Delivered"}</button>
                  <button onClick={() => updateStatus("cod_failed")} disabled={saving} className="rounded-full border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50">
                    Mark as Failed Delivery
                  </button>
                </div>
              </div>
            ) : view.status === "cod_failed" ? (
              <div className="rounded-lg border border-dashed border-red-200 bg-red-50 p-3 text-[13px] font-medium text-red-600">
                COD delivery failed. Both-side courier charges are deducted from the upfront amount; refund any balance to the customer manually.
              </div>
            ) : isFulfillable(view.status) ? (
              <>
                <Field label="Update Status">
                  <select className={inputCls} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Courier"><input className={inputCls} placeholder="Delhivery" value={form.courier} onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))} /></Field>
                  <Field label="Tracking #"><input className={inputCls} value={form.trackingNumber} onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))} /></Field>
                </div>
                <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save Changes"}</button>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-black/10 bg-neutral-50 p-3 text-[13px] font-medium text-neutral-500">
                {isCancelled(view.status)
                  ? "This order is cancelled — fulfillment and Shiprocket are locked."
                  : "Awaiting payment — fulfillment unlocks automatically once payment is confirmed."}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
