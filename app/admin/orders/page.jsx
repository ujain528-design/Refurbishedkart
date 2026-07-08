"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { formatINR } from "@/lib/admin-data";
import { paymentMethodLabel, RETURN_REASONS } from "@/lib/data";
import { adminGetOrders, adminUpdateOrderStatus, adminUpdateTracking, adminCreateReturn, adminShipOrder } from "@/lib/api";
import { WhatsAppIcon } from "@/components/Icons";
import { isPaymentPending, isCancelled, formatCountdown, cancellationReasonLabel, PAY_WARNING_MS } from "@/lib/orderStatus";

const STATUSES = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];

// Preset cancellation reasons shown to the admin (and, in turn, the customer).
// "Other (specify)" reveals a free-text input.
const CANCEL_REASONS = [
  "Customer requested cancellation",
  "Out of stock",
  "Pricing error",
  "Duplicate order",
  "Fraudulent order",
  "Unable to deliver to location",
  "Other (specify)",
];
const OTHER_REASON = "Other (specify)";

// Top filter bar. Each tab maps to an exact status query (null = no filter / all).
const FILTERS = [
  { label: "All", value: null },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Pending Payment", value: "payment_pending" },
  { label: "COD", value: "cod_pending" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Shipped", value: "Shipped" },
  { label: "Delivered", value: "Delivered" },
  // Not a status — client-side filter on the couponSlotUnavailable flag.
  { label: "Coupon Issues", value: null, couponIssues: true },
];

// Only paid orders can be fulfilled (status changes / Shiprocket). Pending-payment
// and cancelled orders have their fulfillment controls locked.
const isFulfillable = (s) => !isPaymentPending(s) && !isCancelled(s);

const badgeCls = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums";

// Friendly labels for the raw lowercase lifecycle statuses set by the return flow
// (mirrors the customer order list in AccountView).
const STATUS_LABEL = {
  return_requested: "Return In Progress",
  refunded: "Refunded",
};

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
    return_requested: "bg-amber-100 text-amber-700",
    refunded: "bg-brand-soft text-brand",
  };
  return <span className={`${badgeCls} ${TONE[s] || "bg-neutral-100 text-neutral-600"}`}>{STATUS_LABEL[s] || s}</span>;
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
  const [form, setForm] = useState({ status: "", courier: "", trackingNumber: "", trackingUrl: "" });
  const [saving, setSaving] = useState(false);
  // Admin "create return on behalf of customer" form. null = closed.
  const [retForm, setRetForm] = useState(null);
  // COD balance-collection confirmation (must be ticked to mark COD delivered).
  const [codBalanceConfirmed, setCodBalanceConfirmed] = useState(false);
  // Shiprocket shipment creation.
  const [shipping, setShipping] = useState(false);
  const [shipErr, setShipErr] = useState("");
  const [shipConfirm, setShipConfirm] = useState(false);

  const doShip = async () => {
    setShipping(true); setShipErr("");
    try {
      const { order } = await adminShipOrder(view.id);
      setView((v) => ({ ...v, ...order }));
      setShipConfirm(false);
      toast("Shipment created via Shiprocket");
      load();
    } catch (e) {
      setShipErr(e.message || "Shipment failed");
    } finally {
      setShipping(false);
    }
  };

  const load = useCallback(() => {
    setLoad("loading");
    const f = FILTERS.find((x) => x.label === filter) || {};
    // "Coupon Issues" isn't a status — fetch all and filter on the flag client-side.
    if (f.couponIssues) {
      adminGetOrders({})
        .then((o) => { setOrders((o || []).filter((x) => x.couponSlotUnavailable)); setLoad("ready"); })
        .catch(() => setLoad("error"));
      return;
    }
    adminGetOrders(f.value ? { status: f.value } : {})
      .then((o) => { setOrders(o); setLoad("ready"); })
      .catch(() => setLoad("error"));
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  // 1s tick so countdown badges on pending-payment orders stay live.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const openOrder = (o) => { setView(o); setForm({ status: o.status, courier: o.courierName || o.courier || "", trackingNumber: o.trackingNumber || "", trackingUrl: o.trackingUrl || "", cancelReason: "", cancelOther: "" }); setRetForm(null); setCodBalanceConfirmed(false); setShipErr(""); setShipConfirm(false); };

  // Effective cancellation reason from the dropdown (+ free-text when "Other").
  const effectiveCancelReason = (f) => (f.cancelReason === OTHER_REASON ? f.cancelOther.trim() : f.cancelReason);

  // Admin override: create a return on the customer's behalf (no 7-day window).
  const submitReturn = async () => {
    if (!retForm.reason) { toast("Select a reason"); return; }
    if (!retForm.description.trim()) { toast("Add a description"); return; }
    if (!retForm.adminNote.trim()) { toast("Admin note is required"); return; }
    setRetForm((f) => ({ ...f, submitting: true }));
    try {
      await adminCreateReturn(view.id, {
        reason: retForm.reason,
        description: retForm.description.trim(),
        whatsappNumber: retForm.whatsapp.trim(),
        adminNote: retForm.adminNote.trim(),
      });
      toast("Return created for customer");
      setView(null);
      setRetForm(null);
      load();
    } catch (e) {
      toast(e.message || "Couldn't create return");
      setRetForm((f) => ({ ...f, submitting: false }));
    }
  };

  const save = async () => {
    const reason = effectiveCancelReason(form);
    // Cancelling requires a reason — block the save and tell the admin.
    if (form.status === "Cancelled" && !reason) { toast("Cancellation reason required"); return; }
    // Marking a COD order Delivered requires explicit balance-collection confirmation,
    // on every path (this dropdown as well as the COD "Mark as Delivered" button).
    const codDeliverConfirm = view.paymentMethod === "COD" && form.status === "Delivered";
    if (codDeliverConfirm && !codBalanceConfirmed) { toast("Confirm the COD balance was collected"); return; }
    setSaving(true);
    try {
      // When shipping, save the shipment details WITH the status change so the
      // dispatch email (fired server-side on that transition) has them.
      const extra = { ...(codDeliverConfirm ? { codBalanceCollected: true } : {}) };
      if (form.status === "Shipped") {
        extra.courierName = form.courier;
        extra.trackingNumber = form.trackingNumber;
        extra.trackingUrl = form.trackingUrl;
      }
      if (form.status !== view.status) {
        await adminUpdateOrderStatus(view.id, form.status, form.status === "Cancelled" ? reason : undefined, extra);
      }
      // Persist tracking edits (also covers editing an already-Shipped order).
      await adminUpdateTracking(view.id, { courierName: form.courier, trackingNumber: form.trackingNumber, trackingUrl: form.trackingUrl });
      toast("Order updated");
      setView(null);
      load();
    } catch (e) { toast(e.message || "Update failed"); }
    finally { setSaving(false); }
  };

  // Direct status change (used by the COD delivery action buttons). `extra` carries
  // the codBalanceCollected confirmation when marking a COD order delivered.
  const updateStatus = async (status, extra = {}) => {
    setSaving(true);
    try {
      await adminUpdateOrderStatus(view.id, status, undefined, extra);
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
                  <td className="px-3 py-3">
                    <StatusBadge order={o} now={now} />
                    {o.couponSlotUnavailable && (
                      <span className="mt-1 block w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">⚠ Coupon limit reached after payment</span>
                    )}
                  </td>
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

            {view.couponSlotUnavailable && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <p className="text-[13px] font-bold text-amber-900">⚠ Coupon limit reached after payment</p>
                <p className="mt-1 text-[12px] leading-relaxed text-amber-800">
                  This customer paid with a coupon{view.couponCode ? ` (${view.couponCode})` : ""} that reached its usage limit at the
                  time of payment confirmation. Review and decide whether to honor the discount.
                </p>
              </div>
            )}
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
            {/* ── Shiprocket shipping ── */}
            {view.awbCode ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-emerald-700">Shipment · Shiprocket</p>
                <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-[13px]">
                  {view.shiprocketOrderId && (<><span className="text-neutral-500">Shiprocket Order ID</span><span className="text-right font-semibold text-ink">{view.shiprocketOrderId}</span></>)}
                  <span className="text-neutral-500">AWB</span><span className="text-right font-mono font-semibold text-ink">{view.awbCode}</span>
                  {view.courierName && (<><span className="text-neutral-500">Courier</span><span className="text-right font-semibold text-ink">{view.courierName}</span></>)}
                  {view.shiprocketStatus && (<><span className="text-neutral-500">Status</span><span className="text-right text-neutral-600">{view.shiprocketStatus}</span></>)}
                </div>
                {view.trackingUrl && (
                  <a href={view.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block rounded-full bg-emerald-600 px-4 py-1.5 text-[13px] font-bold text-white hover:bg-emerald-700">Track Shipment →</a>
                )}
              </div>
            ) : ["Confirmed", "Processing"].includes(view.status) ? (
              <div className="rounded-lg border border-black/10 p-3">
                {!shipConfirm ? (
                  <button onClick={() => { setShipConfirm(true); setShipErr(""); }} className="w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700">
                    📦 Ship via Shiprocket
                  </button>
                ) : (
                  <div>
                    <p className="text-[13px] font-medium text-ink">Create a Shiprocket shipment for <b>#{view.id}</b>? This assigns a courier + AWB and schedules pickup.</p>
                    <div className="mt-2.5 flex gap-2">
                      <button onClick={doShip} disabled={shipping} className="rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{shipping ? "Creating shipment…" : "Confirm & Ship"}</button>
                      <button onClick={() => setShipConfirm(false)} disabled={shipping} className={btnGhost}>Cancel</button>
                    </div>
                  </div>
                )}
                {shipErr && <p className="mt-2 text-[12px] font-semibold text-red-600">{shipErr}</p>}
              </div>
            ) : null}
            {view.status === "cod_failed" ? (
              <div className="rounded-lg border border-dashed border-red-200 bg-red-50 p-3 text-[13px] font-medium text-red-600">
                COD delivery failed. Both-side courier charges are deducted from the upfront amount; refund any balance to the customer manually.
              </div>
            ) : isFulfillable(view.status) ? (
              <>
                <Field label="Update Status">
                  {/* COD orders use the SAME flow as online (Confirmed → Packed → Shipped → Delivered).
                      cod_pending isn't in STATUSES, so surface it as the current option. */}
                  <select className={inputCls} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    {(STATUSES.includes(form.status) ? STATUSES : [form.status, ...STATUSES]).map((s) => (
                      <option key={s} value={s}>{s === "cod_pending" ? "COD · Awaiting Delivery" : s}</option>
                    ))}
                  </select>
                </Field>
                {form.status === "Cancelled" && (
                  <div className="rounded-lg border border-red-200 bg-red-50/60 p-3">
                    <Field label="Cancellation Reason" hint="Shown to the customer on their order.">
                      <select
                        className={inputCls}
                        value={form.cancelReason}
                        onChange={(e) => setForm((f) => ({ ...f, cancelReason: e.target.value }))}
                      >
                        <option value="">Select a reason…</option>
                        {CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </Field>
                    {form.cancelReason === OTHER_REASON && (
                      <input
                        className={`${inputCls} mt-2`}
                        placeholder="Specify the reason"
                        value={form.cancelOther}
                        onChange={(e) => setForm((f) => ({ ...f, cancelOther: e.target.value }))}
                      />
                    )}
                  </div>
                )}
                {view.paymentMethod === "COD" && form.status === "Delivered" && (
                  <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[13px] text-amber-900">
                    <input type="checkbox" checked={codBalanceConfirmed} onChange={(e) => setCodBalanceConfirmed(e.target.checked)} className="mt-0.5 accent-amber-600" />
                    <span>I confirm the remaining <b>{formatINR(view.codRemaining)}</b> was collected in cash/UPI at delivery.</span>
                  </label>
                )}
                {form.status === "Shipped" && (
                  <p className="rounded-md bg-brand-soft/60 px-2.5 py-1.5 text-[12px] font-semibold text-brand">Shipment details — saved before the dispatch email is sent to the customer.</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Courier Name"><input className={inputCls} placeholder="Delhivery" value={form.courier} onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))} /></Field>
                  <Field label="Tracking Number"><input className={inputCls} value={form.trackingNumber} onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))} /></Field>
                </div>
                <Field label="Tracking URL (optional)"><input className={inputCls} placeholder="https://…" value={form.trackingUrl} onChange={(e) => setForm((f) => ({ ...f, trackingUrl: e.target.value }))} /></Field>
                <button
                  onClick={save}
                  disabled={saving || (form.status === "Cancelled" && !effectiveCancelReason(form)) || (view.paymentMethod === "COD" && form.status === "Delivered" && !codBalanceConfirmed)}
                  className={`${btnPrimary} disabled:opacity-50`}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                {/* Failed-delivery path for COD orders not yet delivered (courier-deduction flow). */}
                {view.paymentMethod === "COD" && view.codStatus !== "delivered" && (
                  <button onClick={() => updateStatus("cod_failed")} disabled={saving} className="w-full rounded-full border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50">
                    Mark as Failed Delivery
                  </button>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-black/10 bg-neutral-50 p-3 text-[13px] font-medium text-neutral-500">
                {isCancelled(view.status)
                  ? "This order is cancelled — fulfillment and Shiprocket are locked."
                  : "Awaiting payment — fulfillment unlocks automatically once payment is confirmed."}
              </div>
            )}

            {/* Admin override: create a return on the customer's behalf, bypassing
                the 7-day window — for legitimate late returns support agrees to honour. */}
            {(view.status === "Delivered" || view.deliveredAt || view.status === "return_requested") && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                {!retForm ? (
                  <button
                    onClick={() => setRetForm({ reason: "", description: "", whatsapp: phoneOf(view) || "", adminNote: "", submitting: false })}
                    className="text-[13px] font-bold text-amber-800 hover:underline"
                  >
                    + Create Return for Customer
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-[12px] font-bold uppercase tracking-wide text-amber-700">Create Return — admin override (no 7-day limit)</p>
                    <Field label="Reason">
                      <select className={inputCls} value={retForm.reason} onChange={(e) => setRetForm((f) => ({ ...f, reason: e.target.value }))}>
                        <option value="">Select a reason…</option>
                        {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </Field>
                    <Field label="Description">
                      <textarea rows={2} className={inputCls} value={retForm.description} onChange={(e) => setRetForm((f) => ({ ...f, description: e.target.value }))} />
                    </Field>
                    <Field label="Customer WhatsApp">
                      <input className={inputCls} placeholder="+91…" value={retForm.whatsapp} onChange={(e) => setRetForm((f) => ({ ...f, whatsapp: e.target.value }))} />
                    </Field>
                    <Field label="Admin note (required)" hint="Why is this return being created past the normal 7-day window?">
                      <textarea rows={2} className={inputCls} value={retForm.adminNote} onChange={(e) => setRetForm((f) => ({ ...f, adminNote: e.target.value }))} />
                    </Field>
                    <div className="flex gap-2">
                      <button
                        onClick={submitReturn}
                        disabled={retForm.submitting || !retForm.reason || !retForm.description.trim() || !retForm.adminNote.trim()}
                        className={`${btnPrimary} disabled:opacity-50`}
                      >
                        {retForm.submitting ? "Creating…" : "Create Return"}
                      </button>
                      <button onClick={() => setRetForm(null)} className={btnGhost}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
