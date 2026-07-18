"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { formatINR, INDIAN_STATES, paymentMethodLabel, RETURN_REASONS } from "@/lib/data";
import {
  getOrders, downloadInvoice, markInvoiceSeen,
  getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
  getUserProfile, updateProfile,
  getReturns, createReturn, uploadReturnPhoto, submitReturnBankDetails,
} from "@/lib/api";
import { ErrorState, EmptyState } from "@/components/ui/States";
import { ChevronDown, BrokenDeviceIcon } from "@/components/Icons";
import { isPaymentPending, isCancelled, cancellationReasonLabel, formatCountdown, PAY_WARNING_MS } from "@/lib/orderStatus";

const TABS = [
  { id: "orders", label: "My Orders" },
  { id: "addresses", label: "Addresses" },
  { id: "profile", label: "My Profile" },
];

const STATUS_COLOR = {
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Shipped: "bg-indigo-100 text-indigo-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-neutral-200 text-neutral-600",
  return_requested: "bg-amber-100 text-amber-700",
  refunded: "bg-brand-soft text-brand",
};
// Friendly labels for the raw lowercase lifecycle statuses set by the return flow.
const STATUS_LABEL = {
  return_requested: "Return In Progress",
  refunded: "Refunded",
};
const statusLabel = (s) => STATUS_LABEL[s] || s;
// Self-serve cancel disabled — cancellations handled by support team only.
// An order counts as "paid" if any payment signal is present (online capture or
// COD advance). A cancelled order with no such signal was never paid — i.e. it
// auto-expired from payment_pending after the 30-minute window.
const wasPaid = (o) => !!(o?.paidAt || o?.razorpayPaymentId || o?.codAdvancePaid);
// Invoice exists only once payment is confirmed (not for pending_payment / cancelled).
// Invoice is only available to the customer once the order has shipped (it carries
// device serial numbers captured at ship time). Hidden before that.
const INVOICE_STATUSES = ["Shipped", "Delivered", "Refunded", "refunded"];
const variantText = (it) => (it.ram ? `${it.ram}GB${it.ssd ? ` · ${it.ssd} SSD` : ""}` : it.ssd ? it.ssd : "");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

/* ── Orders ── */
const DAY = 24 * 60 * 60 * 1000;
// Return window is a fixed 7 days from delivery (policy) — NOT settings-driven,
// so the UI gate always matches the "7 days" copy and the server-side check.
const RETURN_WINDOW_DAYS = 7;
const RETURN_STATUS_COLOR = {
  Requested: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-600",
  "Picked Up": "bg-blue-100 text-blue-700",
  Received: "bg-indigo-100 text-indigo-700",
  Refunded: "bg-brand-soft text-brand",
};
// Icon + label for each status in the customer-facing return timeline.
const RETURN_TIMELINE = {
  Requested: { icon: "🔄", label: "Return Requested" },
  Approved: { icon: "✅", label: "Return Approved" },
  "Picked Up": { icon: "🚚", label: "Device Picked Up" },
  Received: { icon: "📦", label: "Device Received" },
  Refunded: { icon: "💰", label: "Refund Processed" },
  Rejected: { icon: "❌", label: "Return Rejected" },
};

/* Low-key "how to cancel" helper shown at the bottom of the orders list. Not a
   CTA — a last-resort reference. Self-serve cancel is disabled; all cancellations
   go through the support team, explained here. */
function CancellationHelp() {
  return (
    <div className="mt-6 rounded-card border border-black/5 bg-neutral-50 p-5">
      <h3 className="text-sm font-bold text-ink">Want to Cancel Your Order?</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
        Cancellations are handled by our support team.
      </p>

      <div className="mt-4 space-y-3">
        {/* Before dispatch — positive path */}
        <div className="rounded-lg border border-green-200 bg-green-50/60 p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-green-700">
            <span aria-hidden="true">✅</span> Before Dispatch
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
            Full refund processed within 5–7 business days. Contact us immediately:
          </p>
          <div className="mt-2.5 flex flex-col gap-1.5 text-[13px]">
            <a href="tel:+918448296273" className="font-semibold text-green-800 hover:underline">
              📞 Call: +91 8448296273
            </a>
            <a
              href="https://wa.me/918448296273"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-green-800 hover:underline"
            >
              💬 WhatsApp: +91 8448296273
            </a>
          </div>
          <p className="mt-2 text-[12px] text-neutral-500">Monday to Saturday, 11:00 AM – 6:00 PM</p>
        </div>

        {/* After dispatch — warning path */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-amber-700">
            <span aria-hidden="true">❌</span> After Dispatch
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
            If your order has already been dispatched, cancellation is not possible. You may initiate a
            return after delivery — a ₹999 restocking fee will apply.{" "}
            <Link href="/return-policy" className="font-semibold text-amber-800 hover:underline">
              See our Return Policy
            </Link>{" "}
            for details.
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-neutral-600">
            <span className="font-semibold text-amber-800">Within 7 days of delivery?</span> You can request a
            return — use the Request Return button on the order above (shown while the window is open), or call /
            WhatsApp{" "}
            <a href="tel:+918448296273" className="font-semibold text-amber-800 hover:underline">+91 8448296273</a>.
            After 7 days the return window is closed.
          </p>
        </div>
      </div>
    </div>
  );
}

function OrdersTab() {
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [orders, setOrders] = useState([]);
  const [returnsByOrder, setReturnsByOrder] = useState({});
  const [open, setOpen] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [returnFor, setReturnFor] = useState(null); // order object whose modal is open
  const [now, setNow] = useState(Date.now());       // ticks every second for live countdowns

  // Download the GST invoice PDF (Bearer-authenticated blob from /api/invoices).
  const doDownload = async (id) => {
    setDownloading(id);
    try {
      await downloadInvoice(id);
    } catch (e) {
      alert(e.message || "Invoice isn't available for this order yet.");
    } finally {
      setDownloading(null);
    }
  };

  // Invoice-update popup: the customer must DOWNLOAD to dismiss (no auto-close, no
  // separate dismiss). Only after a successful download do we mark it seen + advance
  // to the next pending order's popup.
  const downloadAndDismiss = async (o) => {
    setDownloading(o.id);
    try {
      await downloadInvoice(o.id);
      await markInvoiceSeen(o.id).catch(() => {});
      setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, invoiceUpdateSeen: true } : x)));
    } catch (e) {
      alert(e.message || "Invoice isn't available for this order yet.");
    } finally {
      setDownloading(null);
    }
  };

  const load = useCallback(() => {
    setStatus("loading");
    Promise.all([getOrders(), getReturns().catch(() => [])])
      .then(([o, rets]) => {
        setOrders(o);
        const map = {};
        (rets || []).forEach((r) => { if (!map[r.orderId]) map[r.orderId] = r; });
        setReturnsByOrder(map);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  // Live 1s tick so pending-payment countdowns stay current.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // While any order is awaiting payment, re-fetch every 15s so the badge flips to
  // Confirmed/Cancelled as soon as the webhook (or auto-expire) updates the order.
  const hasPending = orders.some((o) => isPaymentPending(o.status));
  useEffect(() => {
    if (!hasPending) return;
    const p = setInterval(() => { getOrders().then(setOrders).catch(() => {}); }, 15000);
    return () => clearInterval(p);
  }, [hasPending]);

  // Eligible = delivered, within the 7-day window, no return yet. Base date is
  // deliveredAt, falling back to createdAt — deliberately NOT updatedAt, which an
  // admin edit would bump to today and wrongly reopen an expired window.
  const returnEligible = (o) => {
    if (o.status !== "Delivered" || returnsByOrder[o.id]) return false;
    const base = new Date(o.deliveredAt || o.createdAt || Date.now());
    return Math.floor((Date.now() - base.getTime()) / DAY) <= RETURN_WINDOW_DAYS;
  };

  if (status === "loading") return <div className="py-16 text-center text-sm text-neutral-400">Loading your orders…</div>;
  if (status === "error") return <ErrorState message="Couldn't load your orders." onRetry={load} />;
  if (!orders.length)
    return (
      <EmptyState title="No orders yet" message="When you place an order it'll show up here.">
        <Link href="/products/laptops" className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Start shopping</Link>
      </EmptyState>
    );

  // Orders with an unseen invoice update — shown one at a time (must download to dismiss).
  const invoiceUpdate = orders.find((o) => o.invoiceUpdatedAt && !o.invoiceUpdateSeen) || null;

  return (
    <div className="space-y-4">
      {invoiceUpdate && (
        <div className="animate-panel-right fixed right-3 top-20 z-[70] w-[92vw] max-w-sm rounded-xl border-l-4 border-brand bg-white p-4 shadow-card-hover sm:right-4" role="alert">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none" aria-hidden="true">📄</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">Invoice Updated</p>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                Your invoice for Order #{invoiceUpdate.id} has been updated with serial numbers.
              </p>
              <button
                onClick={() => downloadAndDismiss(invoiceUpdate)}
                disabled={downloading === invoiceUpdate.id}
                className="mt-3 w-full rounded-full bg-brand px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {downloading === invoiceUpdate.id ? "Preparing…" : "Download Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
      {orders.map((o) => {
        const lines = o.lines || [];
        // Payment-pending lifecycle: live countdown + Pay Now until the 30-min deadline.
        const pending = isPaymentPending(o.status);
        const left = pending && o.paymentDeadline ? new Date(o.paymentDeadline).getTime() - now : 0;
        const expired = pending && left <= 0;
        const warn = left <= PAY_WARNING_MS;
        return (
          <div key={o.id} className="overflow-hidden rounded-card border border-black/5 bg-white shadow-card">
            <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left">
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">#{o.id}</p>
                <p className="text-[12px] text-neutral-400">{fmtDate(o.createdAt)} · {lines.length} item{lines.length > 1 ? "s" : ""}</p>
              </div>
              {pending && !expired ? (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums ${warn ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                  {warn ? `Pay now — ${formatCountdown(left)}` : `Pay within ${formatCountdown(left)}`}
                </span>
              ) : expired ? (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">Cancelled</span>
              ) : (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_COLOR[o.status] || "bg-neutral-100 text-neutral-600"}`}>{statusLabel(o.status)}</span>
              )}
              {pending && !expired && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); router.push(`/payment-pending?orderId=${o.id}`); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); router.push(`/payment-pending?orderId=${o.id}`); } }}
                  className="cursor-pointer rounded-full bg-brand px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-brand-dark"
                >
                  Pay Now
                </span>
              )}
              <span className="ml-auto text-sm font-bold text-ink">{formatINR(o.total)}</span>
              <ChevronDown style={{ width: 16, height: 16 }} className={`text-neutral-400 transition-transform ${open === o.id ? "rotate-180" : ""}`} />
            </button>
            {open === o.id && (
              <div className="border-t border-black/5 px-5 py-4">
                {isCancelled(o.status) && (
                  <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[12px] leading-relaxed text-neutral-500">
                    {!wasPaid(o) ? (
                      // Never paid → auto-expired from payment_pending.
                      "This order was automatically cancelled as payment was not completed within 30 minutes."
                    ) : o.cancellationReason ? (
                      // Paid + a reason recorded → show the reason to the customer.
                      <>
                        This order was cancelled.{" "}
                        <span className="font-semibold text-neutral-600">Reason: {cancellationReasonLabel(o.cancellationReason)}.</span>{" "}
                        Questions? Contact{" "}
                        <a href="tel:+918448296273" className="font-semibold text-neutral-600 hover:text-brand hover:underline">+91 8448296273</a>.
                      </>
                    ) : (
                      // Paid, no reason recorded → generic fallback.
                      <>
                        This order was cancelled. If you have questions contact{" "}
                        <a href="tel:+918448296273" className="font-semibold text-neutral-600 hover:text-brand hover:underline">+91 8448296273</a>.
                      </>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  {lines.map((it, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                        <BrokenDeviceIcon style={{ width: 22, height: 22 }} className="text-neutral-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{it.name}</p>
                        <p className="text-[12px] text-neutral-500">{variantText(it)} · Qty {it.qty}</p>
                      </div>
                      <p className="text-[13px] font-bold text-ink">{formatINR(it.unitPrice * it.qty)}</p>
                    </div>
                  ))}
                </div>
                {returnsByOrder[o.id] && (
                  <div className="mt-4 rounded-lg border border-black/5 bg-neutral-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-ink">Return {returnsByOrder[o.id].id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${RETURN_STATUS_COLOR[returnsByOrder[o.id].status] || "bg-neutral-200 text-neutral-600"}`}>{returnsByOrder[o.id].status}</span>
                    </div>
                    {returnsByOrder[o.id].status === "Requested" && (
                      <p className="mt-1 text-[12px] text-neutral-500">We&apos;ll review and respond within 2 business days.</p>
                    )}
                    {returnsByOrder[o.id].status === "Approved" && (
                      <p className="mt-1 text-[12px] text-neutral-500">Approved — refund {formatINR(returnsByOrder[o.id].refundAmount)}{returnsByOrder[o.id].deductionAmount ? ` (after ${formatINR(returnsByOrder[o.id].deductionAmount)} deduction)` : ""} once we receive the item.</p>
                    )}
                    {returnsByOrder[o.id].status === "Approved" && (
                      <RefundBankDetails
                        ret={returnsByOrder[o.id]}
                        onSubmitted={(masked) =>
                          setReturnsByOrder((m) => ({ ...m, [o.id]: { ...m[o.id], refundBankDetails: masked } }))
                        }
                      />
                    )}
                    {returnsByOrder[o.id].status === "Rejected" && returnsByOrder[o.id].adminNotes && (
                      <p className="mt-1 text-[12px] text-red-600">Reason: {returnsByOrder[o.id].adminNotes}</p>
                    )}
                    {returnsByOrder[o.id].status === "Refunded" && (
                      <p className="mt-1 text-[12px] text-brand">Refund of {formatINR(returnsByOrder[o.id].refundAmount)} processed.</p>
                    )}
                    {Array.isArray(returnsByOrder[o.id].statusHistory) && returnsByOrder[o.id].statusHistory.length > 0 && (
                      <ol className="mt-3 space-y-1.5 border-t border-black/5 pt-2.5">
                        {returnsByOrder[o.id].statusHistory.map((h, i) => {
                          const t = RETURN_TIMELINE[h.status] || { icon: "•", label: h.status };
                          return (
                            <li key={i} className="text-[12px] leading-snug">
                              <span className="font-semibold text-ink">{t.icon} {t.label}</span>
                              <span className="text-neutral-400"> — {fmtDate(h.timestamp)}</span>
                              {h.status === "Rejected" && h.note && <span className="mt-0.5 block text-red-600">Reason: {h.note}</span>}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <span className="text-[12px] text-neutral-400">Payment: {paymentMethodLabel(o.paymentMethod)}</span>
                  <div className="ml-auto flex items-center gap-2.5">
                    {returnEligible(o) && (
                      <button
                        onClick={() => setReturnFor(o)}
                        className="rounded-full border border-brand/30 px-4 py-2 text-[12px] font-bold text-brand hover:bg-brand-soft"
                      >
                        Request Return
                      </button>
                    )}
                    {o.status === "Delivered" && !returnsByOrder[o.id] && !returnEligible(o) && (
                      <span className="text-[12px] font-semibold text-neutral-400">Return window expired (7 days from delivery)</span>
                    )}
                    {INVOICE_STATUSES.includes(o.status) && (
                      <button
                        onClick={() => doDownload(o.id)}
                        disabled={downloading === o.id}
                        className="rounded-full border border-brand/30 px-4 py-2 text-[12px] font-bold text-brand hover:bg-brand-soft disabled:opacity-50"
                      >
                        {downloading === o.id ? "Preparing…" : "Download Invoice"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <CancellationHelp />

      {returnFor && (
        <RequestReturnModal
          order={returnFor}
          onClose={() => setReturnFor(null)}
          onSubmitted={(r) => { setReturnsByOrder((m) => ({ ...m, [r.orderId]: r })); setReturnFor(null); setOpen(r.orderId); }}
        />
      )}
    </div>
  );
}

/* ── Refund bank-details form ── shown inside an Approved return. Customer picks
   bank transfer OR UPI; locked once submitted (only admin can amend after). */
function RefundBankDetails({ ret, onSubmitted }) {
  const submitted = ret.refundBankDetails && ret.refundBankDetails.submittedAt;
  const [method, setMethod] = useState("bank");
  const [holder, setHolder] = useState("");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upi, setUpi] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (submitted) {
    const d = ret.refundBankDetails;
    return (
      <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-[12px]">
        <p className="font-semibold text-green-800">✅ Bank details received. Refund will be processed within 5–7 business days.</p>
        <p className="mt-1 text-green-700">
          {d.method === "upi" ? <>UPI: <b>{d.upiIdMasked}</b></> : <>{d.accountHolderName} · A/C <b>{d.accountNumberMasked}</b></>}
        </p>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (method === "upi") {
      if (!/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z][a-zA-Z0-9.\-_]{1,}$/.test(upi.trim())) { setError("Enter a valid UPI ID (e.g. name@bank)"); return; }
    } else {
      if (holder.trim().length < 2) { setError("Enter the account holder name"); return; }
      if (!/^\d{9,18}$/.test(account.replace(/\s+/g, ""))) { setError("Account number must be 9–18 digits"); return; }
      if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(ifsc.trim())) { setError("Enter a valid 11-character IFSC code"); return; }
    }
    setSaving(true);
    try {
      const payload = method === "upi"
        ? { method: "upi", upiId: upi.trim() }
        : { method: "bank", accountHolderName: holder.trim(), accountNumber: account.replace(/\s+/g, ""), ifscCode: ifsc.trim().toUpperCase() };
      const masked = await submitReturnBankDetails(ret.id, payload);
      onSubmitted(masked);
    } catch (err) {
      setError(err.message || "Couldn't submit bank details");
    } finally {
      setSaving(false);
    }
  };

  const fieldCls = "w-full rounded-lg border border-black/15 px-3 py-2 text-[13px] outline-none focus:border-brand";
  return (
    <form onSubmit={submit} className="mt-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
      {ret.bankResubmissionRequested && (
        <p className="mb-2 rounded-md bg-red-50 px-2.5 py-1.5 text-[12px] font-semibold text-red-700">
          We need you to resubmit your refund details.{ret.bankResubmissionNote ? ` Reason: ${ret.bankResubmissionNote}` : ""}
        </p>
      )}
      <p className="text-[12px] font-bold text-amber-900">Please provide your bank details for refund processing</p>
      <div className="mt-2 flex gap-4 text-[12px] font-semibold text-ink">
        <label className="flex items-center gap-1.5"><input type="radio" name={`m-${ret.id}`} checked={method === "bank"} onChange={() => setMethod("bank")} className="accent-brand" /> Bank transfer</label>
        <label className="flex items-center gap-1.5"><input type="radio" name={`m-${ret.id}`} checked={method === "upi"} onChange={() => setMethod("upi")} className="accent-brand" /> UPI</label>
      </div>
      <div className="mt-2 space-y-2">
        {method === "bank" ? (
          <>
            <input className={fieldCls} placeholder="Account holder name" value={holder} onChange={(e) => setHolder(e.target.value)} />
            <input className={fieldCls} placeholder="Bank account number" inputMode="numeric" value={account} onChange={(e) => setAccount(e.target.value)} />
            <input className={fieldCls} placeholder="IFSC code (e.g. HDFC0001234)" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} />
          </>
        ) : (
          <input className={fieldCls} placeholder="UPI ID (e.g. name@bank)" value={upi} onChange={(e) => setUpi(e.target.value)} />
        )}
      </div>
      {error && <p className="mt-2 text-[12px] font-semibold text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="mt-2.5 rounded-full bg-brand px-4 py-2 text-[12px] font-bold text-white hover:bg-brand-dark disabled:opacity-50">
        {saving ? "Submitting…" : "Submit Bank Details"}
      </button>
      <p className="mt-1.5 text-[11px] text-amber-700">Details are locked once submitted. Contact support if you need to change them.</p>
    </form>
  );
}

/* ── Request Return modal ── (reasons imported from lib/data so the admin
   override form and this form always offer the same list) */
function RequestReturnModal({ order, onClose, onSubmitted }) {
  const lines = order.lines || [];
  const [productIdx, setProductIdx] = useState(0);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const addPhotos = async (files) => {
    const list = Array.from(files || []).slice(0, 3 - photos.length);
    if (!list.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of list) { const { url } = await uploadReturnPhoto(f); if (url) urls.push(url); }
      setPhotos((p) => [...p, ...urls].slice(0, 3));
    } catch (e) {
      setError(e.message || "Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  const waDigits = whatsapp.replace(/\D/g, "");
  const submit = async () => {
    setError("");
    if (!reason) { setError("Please select a reason"); return; }
    if (description.trim().length < 20) { setError("Please describe the issue in at least 20 characters"); return; }
    if (!/^[6-9]\d{9}$/.test(waDigits)) { setError("Enter a valid 10-digit WhatsApp number (the one you sent the unboxing video from)"); return; }
    setSubmitting(true);
    try {
      const line = lines[productIdx] || lines[0] || {};
      const r = await createReturn({
        orderId: order.id,
        productId: line.productId != null ? String(line.productId) : "",
        productName: line.name || "",
        reason,
        description: description.trim(),
        whatsappNumber: waDigits,
        photos,
      });
      setDone(true);
      setTimeout(() => onSubmitted(r), 1400);
    } catch (e) {
      setError(e.message || "Couldn't submit return");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-card bg-white p-4 lg:p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base lg:text-lg font-bold text-ink">Request a return</h3>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-ink">✕</button>
        </div>
        <p className="mt-1 text-[12px] text-neutral-400">Order #{order.id}</p>

        {done ? (
          <div className="py-8 text-center">
            <p className="text-2xl">✓</p>
            <p className="mt-2 text-sm font-semibold text-ink">Return request submitted.</p>
            <p className="mt-1 text-[13px] text-neutral-500">We&apos;ll review and respond within 2 business days.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {lines.length > 1 && (
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Product</span>
                <select value={productIdx} onChange={(e) => setProductIdx(Number(e.target.value))} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-brand focus:outline-none">
                  {lines.map((l, i) => <option key={i} value={i}>{l.name}</option>)}
                </select>
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Reason</span>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-brand focus:outline-none">
                <option value="">— Select a reason —</option>
                {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Description <span className="text-red-500">*</span></span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Please describe the issue in detail…" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <span className="mt-1 block text-[11px] text-neutral-400">Minimum 20 characters.</span>
            </label>

            {/* Unboxing-video instruction — prominent, must be done before submitting */}
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="text-[13px] font-bold text-amber-900">📹 Before submitting, send your unboxing video to{" "}
                <a href="https://wa.me/918448296273" target="_blank" rel="noopener noreferrer" className="underline">+91 8448296273</a>{" "}
                on WhatsApp.</p>
              <p className="mt-1 text-[12px] text-amber-800">Returns without an unboxing video will not be accepted.</p>
            </div>

            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-neutral-600">WhatsApp number used to send the video <span className="text-red-500">*</span></span>
              <input
                type="tel"
                inputMode="numeric"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </label>
            <div>
              <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Photos (optional, up to 3)</span>
              <div className="flex flex-wrap items-center gap-2">
                {photos.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Return ${i + 1}`} className="h-14 w-14 rounded-lg object-cover ring-1 ring-black/10" />
                    <button onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">✕</button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg border border-dashed border-black/20 text-neutral-400 hover:border-brand hover:text-brand">
                    {uploading ? "…" : "+"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
                  </label>
                )}
              </div>
            </div>
            {error && <p className="text-[13px] font-semibold text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onClose} className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold text-ink hover:border-brand hover:text-brand">Cancel</button>
              <button onClick={submit} disabled={submitting || uploading} className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50">
                {submitting ? "Submitting…" : "Submit Return Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Addresses ── */
const BLANK_ADDR = { name: "", phone: "", line1: "", line2: "", city: "", state: "Delhi", pincode: "" };
const inputCls = "rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none";

function AddressesTab() {
  const [status, setStatus] = useState("loading");
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null); // address _id | "new" | null
  const [form, setForm] = useState(BLANK_ADDR);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const atMax = list.length >= 5;

  const load = useCallback(() => {
    setStatus("loading");
    getAddresses().then((a) => { setList(a); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const startAdd = () => { setForm(BLANK_ADDR); setEditingId("new"); };
  const startEdit = (a) => { setForm({ name: a.name || "", phone: a.phone || "", line1: a.line1 || "", line2: a.line2 || "", city: a.city || "", state: a.state || "Delhi", pincode: a.pincode || "" }); setEditingId(a._id); };
  const cancel = () => setEditingId(null);

  const save = async () => {
    setBusy(true);
    try {
      const next = editingId === "new" ? await addAddress(form) : await updateAddress(editingId, form);
      setList(next);
      setEditingId(null);
    } catch (e) { alert(e.message || "Couldn't save address."); }
    finally { setBusy(false); }
  };
  const del = async (id) => { try { setList(await deleteAddress(id)); } catch (e) { alert(e.message); } };
  const makeDefault = async (id) => { try { setList(await setDefaultAddress(id)); } catch (e) { alert(e.message); } };

  if (status === "loading") return <div className="py-16 text-center text-sm text-neutral-400">Loading addresses…</div>;
  if (status === "error") return <ErrorState message="Couldn't load addresses." onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((a) => (
          <div key={a._id} className="rounded-card border border-black/5 bg-white p-3.5 lg:p-5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-ink">{a.name}</p>
              {a.isDefault && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">DEFAULT</span>}
            </div>
            <p className="mt-1.5 text-[13px] text-neutral-500">{[a.line1, a.line2, a.city, a.state].filter(Boolean).join(", ")} — {a.pincode}</p>
            <p className="mt-1 text-[13px] text-neutral-500">{a.phone}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => startEdit(a)} className="rounded-full border border-black/10 px-3.5 py-1.5 text-[12px] font-bold text-ink hover:border-brand hover:text-brand">Edit</button>
              {!a.isDefault && <button onClick={() => makeDefault(a._id)} className="rounded-full border border-black/10 px-3.5 py-1.5 text-[12px] font-bold text-ink hover:border-brand hover:text-brand">Set Default</button>}
              <button onClick={() => del(a._id)} className="rounded-full border border-black/10 px-3.5 py-1.5 text-[12px] font-bold text-red-600 hover:border-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editingId ? (
        <div className="grid gap-4 rounded-card border border-black/5 bg-white p-3.5 lg:p-5 shadow-card sm:grid-cols-2">
          <input className={inputCls} placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <input className={inputCls} placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <input className={`${inputCls} sm:col-span-2`} placeholder="Address line 1" value={form.line1} onChange={(e) => set("line1", e.target.value)} />
          <input className={`${inputCls} sm:col-span-2`} placeholder="Address line 2" value={form.line2} onChange={(e) => set("line2", e.target.value)} />
          <input className={inputCls} placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
          <input className={inputCls} placeholder="Pincode" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
          <select className={`${inputCls} sm:col-span-2`} value={form.state} onChange={(e) => set("state", e.target.value)}>
            {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="flex gap-2 sm:col-span-2">
            <button onClick={save} disabled={busy} className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50">{busy ? "Saving…" : "Save Address"}</button>
            <button onClick={cancel} className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold text-ink">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={startAdd} disabled={atMax} className="rounded-full border-2 border-dashed border-brand/40 px-5 py-2.5 text-sm font-bold text-brand hover:bg-brand-softer/40 disabled:cursor-not-allowed disabled:opacity-40">
          + Add New Address
        </button>
      )}
      {atMax && <p className="text-[12px] text-neutral-400">You can save up to 5 addresses.</p>}
    </div>
  );
}

/* ── Profile ── */
function ProfileTab() {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    getUserProfile().then((u) => { setUser(u); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const startEdit = () => { setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" }); setEditing(true); };
  const save = async () => {
    setBusy(true);
    try { const u = await updateProfile({ name: form.name }); setUser(u); setEditing(false); }
    catch (e) { alert(e.message || "Couldn't save profile."); }
    finally { setBusy(false); }
  };

  if (status === "loading") return <div className="py-16 text-center text-sm text-neutral-400">Loading profile…</div>;
  if (status === "error") return <ErrorState message="Couldn't load your profile." onRetry={load} />;

  if (editing) {
    return (
      <div className="max-w-md space-y-4 rounded-card border border-black/5 bg-white p-4 lg:p-6 shadow-card">
        {/* Name — the only editable identity field */}
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Name</span>
          <input className={`${inputCls} w-full`} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
        {/* Email & Phone — verified identity (Google / OTP), not editable */}
        {[["Email", user.email], ["Phone", user.phone]].map(([label, val]) => (
          <div key={label} className="block" title={`${label} cannot be changed`}>
            <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
            <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-neutral-100 px-3.5 py-2.5 text-sm text-neutral-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <span className="flex-1 truncate">{val || "—"}</span>
            </div>
            <span className="mt-1 block text-[11px] text-neutral-400">{label} cannot be changed</span>
          </div>
        ))}
        <div className="flex gap-2">
          <button onClick={save} disabled={busy} className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
          <button onClick={() => setEditing(false)} className="rounded-full border border-black/10 px-6 py-2.5 text-sm font-bold text-ink">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-card border border-black/5 bg-white p-4 lg:p-6 shadow-card">
      <dl className="space-y-4 text-sm">
        <div><dt className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Name</dt><dd className="mt-0.5 font-semibold text-ink">{user.name || "—"}</dd></div>
        <div><dt className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Email</dt><dd className="mt-0.5 font-semibold text-ink">{user.email || "—"}</dd></div>
        <div><dt className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Phone</dt><dd className="mt-0.5 font-semibold text-ink">{user.phone || "—"}</dd></div>
      </dl>
      <button onClick={startEdit} className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Edit Profile</button>
    </div>
  );
}

export default function AccountView() {
  const { ready, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  // Clamp to a known tab so a stale URL (e.g. ?tab=coupons after the coupons tab
  // was removed) falls back to Orders instead of rendering an empty panel.
  const requestedTab = params.get("tab");
  const [tab, setTab] = useState(TABS.some((t) => t.id === requestedTab) ? requestedTab : "orders");

  useEffect(() => {
    if (ready && !isLoggedIn) router.replace("/login?next=/account");
  }, [ready, isLoggedIn, router]);

  if (!ready || !isLoggedIn) return <div className="py-24 text-center text-sm text-neutral-400">Loading…</div>;

  // logout() clears the app JWT + NextAuth session and redirects to /login itself.
  const doLogout = () => { logout(); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="section-heading">My Account</h1>

      <div className="mt-5 lg:mt-8 gap-4 lg:gap-8 lg:grid lg:grid-cols-[230px_1fr]">
        <aside className="lg:self-start">
          <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-left text-sm font-semibold transition-colors lg:rounded-lg ${tab === t.id ? "bg-brand text-white" : "text-neutral-600 hover:bg-brand-softer hover:text-brand"}`}
              >
                {t.label}
              </button>
            ))}
            <button onClick={doLogout} className="mt-2 hidden shrink-0 rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 lg:block">Logout</button>
          </nav>
        </aside>

        <div className="mt-6 lg:mt-0">
          {tab === "orders" && <OrdersTab />}
          {tab === "addresses" && <AddressesTab />}
          {tab === "profile" && <ProfileTab />}

          <button onClick={doLogout} className="mt-5 lg:mt-8 w-full rounded-full border border-red-200 py-2.5 lg:py-3 text-sm font-bold text-red-600 lg:hidden">Logout</button>
        </div>
      </div>
    </div>
  );
}
