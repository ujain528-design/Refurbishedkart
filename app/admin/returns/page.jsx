"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, Badge, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { formatINR } from "@/lib/admin-data";
import { adminGetReturns, adminUpdateReturn } from "@/lib/api";

const STATUSES = ["Requested", "Approved", "Rejected", "Picked Up", "Received", "Refunded"];
const FILTERS = ["All", ...STATUSES];
// Allowed forward transitions from each status (workflow). Rejected/Refunded are terminal.
const NEXT = {
  Requested: ["Approved", "Rejected"],
  Approved: ["Picked Up"],
  "Picked Up": ["Received"],
  Received: ["Refunded"],
  Rejected: [],
  Refunded: [],
};
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export default function Returns() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("loading");
  const [view, setView] = useState(null);

  const load = useCallback(() => {
    setStatus("loading");
    adminGetReturns(filter !== "All" ? { status: filter } : {})
      .then((r) => { setList(r); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const term = q.trim().toLowerCase();
  const shown = term
    ? list.filter((r) => `${r.orderId} ${r.id} ${r.userName} ${r.userEmail}`.toLowerCase().includes(term))
    : list;

  return (
    <div>
      <PageHeader title="Returns" subtitle={`${list.length} return request${list.length === 1 ? "" : "s"}`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputCls} max-w-[180px]`}>
          {FILTERS.map((f) => <option key={f}>{f}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order ID or customer…" className={`${inputCls} max-w-[280px]`} />
      </div>

      {status === "loading" ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading returns…</p>
      ) : status === "error" ? (
        <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-neutral-600">Couldn&apos;t load returns.</p>
          <button onClick={load} className={`${btnPrimary} mt-4`}>Retry</button>
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-card border border-dashed border-black/10 bg-neutral-50 p-12 text-center text-sm text-neutral-500">No returns match this filter.</div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Return ID</th><th className="px-3 py-3">Order</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Product</th><th className="px-3 py-3">Reason</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                  <td className="px-4 py-3 font-semibold text-brand">{r.id}</td>
                  <td className="px-3 py-3 text-neutral-600">{r.orderId}</td>
                  <td className="px-3 py-3 text-ink">{r.userName || "—"}</td>
                  <td className="px-3 py-3 max-w-[220px] truncate text-neutral-600" title={r.productName}>{r.productName || "—"}</td>
                  <td className="px-3 py-3 text-neutral-500">{r.reason}</td>
                  <td className="px-3 py-3 text-[12px] text-neutral-400">{fmtDate(r.createdAt)}</td>
                  <td className="px-3 py-3"><Badge>{r.status}</Badge></td>
                  <td className="px-3 py-3"><button onClick={() => setView(r)} className="text-[13px] font-bold text-brand hover:underline">Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view && <ReturnDetail ret={view} onClose={() => setView(null)} onSaved={() => { setView(null); load(); }} toast={toast} />}
    </div>
  );
}

function ReturnDetail({ ret, onClose, onSaved, toast }) {
  // The refund basis is what the customer ACTUALLY paid (orderPaid from the API:
  // online → order.total; COD → codUpfront), NOT the stored paidAmount line total
  // (which ignores coupons and would over-refund). Fall back to paidAmount only if
  // the order couldn't be resolved.
  const paid = Number(ret.orderPaid ?? ret.paidAmount) || 0;
  const [form, setForm] = useState({
    status: ret.status,
    adminNotes: ret.adminNotes || "",
    deductionAmount: ret.deductionAmount ?? 0,
    deductionReason: ret.deductionReason || "",
    refundAmount: ret.refundAmount ?? Math.max(0, paid),
    addToStock: false,
    ackOverRefund: false, // explicit acknowledgment when refund > amount paid
  });
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Refund auto-tracks paid − deduction unless the admin has typed a custom value.
  const autoRefund = Math.max(0, paid - (Number(form.deductionAmount) || 0));
  const onDeduction = (v) => setForm((f) => ({ ...f, deductionAmount: v, refundAmount: Math.max(0, paid - (Number(v) || 0)) }));

  const showRefund = ["Approved", "Received", "Refunded"].includes(form.status);
  // Refund must never silently exceed what was collected. Not blocked (admin may
  // have a valid reason) but requires explicit acknowledgment.
  const overRefund = showRefund && (Number(form.refundAmount) || 0) > paid;
  const refundBlocked = overRefund && !form.ackOverRefund;

  // Current status + the steps it may move to (workflow-enforced in the dropdown).
  const statusOptions = [ret.status, ...(NEXT[ret.status] || [])];

  const save = async (overrideStatus) => {
    const status = overrideStatus || form.status;
    // A rejection must carry a reason — it's shown to the customer.
    if (status === "Rejected" && !form.adminNotes.trim()) {
      toast("Admin note is required to reject a return", "error");
      return;
    }
    // Refund over the amount paid must be explicitly acknowledged first.
    if (refundBlocked) {
      toast("Refund exceeds the amount paid — tick the acknowledgment to proceed", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        status,
        adminNotes: form.adminNotes,
        deductionAmount: Number(form.deductionAmount) || 0,
        deductionReason: form.deductionReason,
        refundAmount: Number(form.refundAmount) || 0,
      };
      if (status === "Received" && form.addToStock) payload.addToStock = true;
      await adminUpdateReturn(ret.id, payload);
      toast("Return updated");
      onSaved();
    } catch (e) {
      toast(e.message || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Return ${ret.id}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={btnGhost}>Close</button>
          {form.status === "Refunded" ? (
            <button onClick={() => save("Refunded")} disabled={saving || refundBlocked} className={`${btnPrimary} disabled:opacity-50`}>{saving ? "Saving…" : "Mark as Refunded"}</button>
          ) : (
            <button onClick={() => save()} disabled={saving || refundBlocked} className={`${btnPrimary} disabled:opacity-50`}>{saving ? "Saving…" : "Save"}</button>
          )}
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-neutral-50 p-3 text-[13px]">
          <span className="text-neutral-500">Order</span><span className="text-right font-semibold text-ink">{ret.orderId}</span>
          <span className="text-neutral-500">Customer</span><span className="text-right text-ink">{ret.userName || "—"}</span>
          <span className="text-neutral-500">Email</span><span className="text-right text-ink">{ret.userEmail || "—"}</span>
          <span className="text-neutral-500">Product</span><span className="text-right text-ink">{ret.productName || "—"}</span>
          <span className="text-neutral-500">Amount paid (this item)</span><span className="text-right font-semibold text-ink">{formatINR(paid)}</span>
        </div>

        {/* ── Order Payment Breakdown ── for the returned line. */}
        {ret.orderInfo && (() => {
          const oi = ret.orderInfo;
          const variant = oi.line ? [oi.line.ram ? `${oi.line.ram}GB` : "", oi.line.ssd ? `${oi.line.ssd}` : ""].filter(Boolean).join("/") : "";
          // GST is INCLUSIVE in the stored prices (computeLineTaxes extracts it) — shown
          // as an informational order-level figure, not added on top.
          const g = oi.gst || {};
          const gstTotal = Number(g.total ?? ((Number(g.cgst) || 0) + (Number(g.sgst) || 0)) ?? g.igst) || (Number(g.igst) || 0);
          const codTotalPaid = oi.codBalanceCollected ? (Number(oi.codUpfront) || 0) + (Number(oi.codRemaining) || 0) : (Number(oi.codUpfront) || 0);
          return (
            <div className="rounded-lg border border-black/10 p-3">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-brand">Order Payment Breakdown</p>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between gap-3">
                  <span className="text-neutral-500">Product</span>
                  <span className="text-right font-semibold text-ink">{oi.line?.name || ret.productName || "—"}{variant ? ` | ${variant}` : ""}</span>
                </div>
                <div className="flex justify-between"><span className="text-neutral-500">Original price</span><span className="text-right text-ink">{formatINR(oi.lineTotal)}</span></div>
                {oi.lineDiscountShare > 0 && (
                  <div className="flex justify-between"><span className="text-brand">Coupon discount{oi.couponCode ? ` (${oi.couponCode})` : ""}</span><span className="text-right text-brand">− {formatINR(oi.lineDiscountShare)}</span></div>
                )}
                {gstTotal > 0 && (
                  <div className="flex justify-between"><span className="text-neutral-400">GST (included in prices, order-level)</span><span className="text-right text-neutral-400">{formatINR(gstTotal)}</span></div>
                )}
                <div className="flex justify-between border-t border-black/5 pt-1.5"><span className="text-neutral-500">Payment method</span><span className="text-right font-semibold text-ink">{oi.isCod ? "Cash on Delivery" : "Online (Razorpay)"}</span></div>

                {oi.isCod ? (
                  <div className="mt-1 rounded-md bg-amber-50 p-2.5 text-[12px]">
                    <div className="flex justify-between"><span className="text-amber-800">COD upfront paid (10%, Razorpay)</span><span className="font-semibold text-amber-900">{formatINR(oi.codUpfront)}</span></div>
                    <div className="flex justify-between">
                      <span className="text-amber-800">COD balance at delivery (90%, cash)</span>
                      <span className="font-semibold text-amber-900">
                        {formatINR(oi.codRemaining)}
                        {oi.codBalanceCollected ? "" : oi.codDelivered ? " (collection unconfirmed)" : " (not yet collected)"}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between border-t border-amber-200 pt-1"><span className="font-bold text-amber-900">Total actually paid</span><span className="font-bold text-amber-900">{formatINR(codTotalPaid)}</span></div>
                    {!oi.codBalanceCollected && oi.codDelivered && (
                      <p className="mt-1 text-[11px] font-semibold text-red-600">⚠ Balance collection not confirmed for this order — verify with delivery records before refunding the full amount.</p>
                    )}
                    {!oi.codBalanceCollected && !oi.codDelivered && (
                      <p className="mt-1 text-[11px] text-amber-700">Order not marked delivered — only the upfront advance is confirmed collected.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between"><span className="text-neutral-500">Amount paid via Razorpay</span><span className="text-right font-semibold text-ink">{formatINR(oi.orderTotal)}</span></div>
                )}
              </div>
            </div>
          );
        })()}

        <div>
          <p className="text-[12px] font-semibold uppercase text-neutral-400">Reason</p>
          <p className="mt-0.5 text-ink">{ret.reason}</p>
          <p className="mt-2 whitespace-pre-wrap text-[13px] text-neutral-600">{ret.description}</p>
          {ret.whatsappNumber && <p className="mt-2 text-[13px] text-neutral-500">WhatsApp (video sent from): <span className="font-semibold text-ink">+91 {ret.whatsappNumber}</span></p>}
        </div>

        {Array.isArray(ret.statusHistory) && ret.statusHistory.length > 0 && (
          <div>
            <p className="mb-1.5 text-[12px] font-semibold uppercase text-neutral-400">Status history</p>
            <ol className="space-y-2 border-l-2 border-black/10 pl-3">
              {ret.statusHistory.map((h, i) => (
                <li key={i} className="text-[13px]">
                  <span className="font-semibold text-ink">{h.status}</span>
                  <span className="text-neutral-400"> · {fmtDateTime(h.timestamp)}</span>
                  {h.updatedBy && <span className="text-neutral-400"> · {h.updatedBy}</span>}
                  {h.note && <p className="text-[12px] text-neutral-500">{h.note}</p>}
                </li>
              ))}
            </ol>
          </div>
        )}

        {Array.isArray(ret.photos) && ret.photos.length > 0 && (
          <div>
            <p className="mb-1 text-[12px] font-semibold uppercase text-neutral-400">Photos</p>
            <div className="flex flex-wrap gap-2">
              {ret.photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`Return photo ${i + 1}`} onClick={() => setLightbox(src)} className="h-16 w-16 cursor-pointer rounded-lg object-cover ring-1 ring-black/10" />
              ))}
            </div>
          </div>
        )}

        <Field label="Status">
          <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {statusOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
          {NEXT[ret.status]?.length === 0 && <p className="mt-1 text-[11px] text-neutral-400">This return is in a final state.</p>}
        </Field>

        <Field label="Admin notes (shown to customer on rejection)">
          <textarea rows={2} className={inputCls} value={form.adminNotes} onChange={(e) => set("adminNotes", e.target.value)} placeholder="Internal notes / rejection reason…" />
        </Field>

        {form.status === "Received" && (
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input type="checkbox" checked={form.addToStock} onChange={(e) => set("addToStock", e.target.checked)} className="accent-brand" />
            Add this unit back to inventory (only if resellable)
          </label>
        )}

        {showRefund && (
          <div className="rounded-lg border border-black/10 p-3">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-brand">Refund</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Deduction (₹)"><input type="number" className={inputCls} value={form.deductionAmount} onChange={(e) => onDeduction(e.target.value)} /></Field>
              <Field label="Refund amount (₹)"><input type="number" className={inputCls} value={form.refundAmount} onChange={(e) => set("refundAmount", e.target.value)} /></Field>
            </div>
            <Field label="Deduction reason"><input className={inputCls} value={form.deductionReason} onChange={(e) => set("deductionReason", e.target.value)} placeholder="e.g. restocking fee, missing accessory" /></Field>
            <p className="mt-1 text-[11px] text-neutral-400">Auto = paid − deduction ({formatINR(autoRefund)}). Amount paid: {formatINR(paid)}. Refunds are processed manually; mark Refunded once done.</p>

            {overRefund && (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
                <p className="text-[13px] font-bold text-amber-900">⚠ This amount exceeds what the customer paid ({formatINR(paid)}). Please verify before proceeding.</p>
                <label className="mt-2 flex items-center gap-2 text-[12px] font-semibold text-amber-900">
                  <input type="checkbox" checked={form.ackOverRefund} onChange={(e) => set("ackOverRefund", e.target.checked)} className="accent-amber-600" />
                  I&apos;ve verified this and want to refund more than was paid.
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/70 p-6" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Return photo" className="max-h-[88vh] max-w-full rounded-lg" />
        </div>
      )}
    </Modal>
  );
}
