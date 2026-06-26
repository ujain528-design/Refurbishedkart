"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { formatINR, INDIAN_STATES, paymentMethodLabel } from "@/lib/data";
import { MOCK_COUPONS } from "@/lib/account-data";
import {
  getOrders, downloadInvoice,
  getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
  getUserProfile, updateProfile,
  getReturns, createReturn, uploadReturnPhoto, getReturnReasons, getPublicSettings,
} from "@/lib/api";
import { ErrorState, EmptyState } from "@/components/ui/States";
import { ChevronDown, BrokenDeviceIcon } from "@/components/Icons";
import { isPaymentPending, isCancelled, cancellationReasonLabel, formatCountdown, PAY_WARNING_MS } from "@/lib/orderStatus";

const TABS = [
  { id: "orders", label: "My Orders" },
  { id: "coupons", label: "Coupons" },
  { id: "addresses", label: "Addresses" },
  { id: "profile", label: "My Profile" },
];

const STATUS_COLOR = {
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Shipped: "bg-indigo-100 text-indigo-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-neutral-200 text-neutral-600",
};
// Self-serve cancel disabled — cancellations handled by support team only.
// An order counts as "paid" if any payment signal is present (online capture or
// COD advance). A cancelled order with no such signal was never paid — i.e. it
// auto-expired from payment_pending after the 30-minute window.
const wasPaid = (o) => !!(o?.paidAt || o?.razorpayPaymentId || o?.codAdvancePaid);
// Invoice exists only once payment is confirmed (not for pending_payment / cancelled).
const INVOICE_STATUSES = ["Confirmed", "Packed", "Shipped", "Delivered", "Returned"];
const variantText = (it) => (it.ram ? `${it.ram}GB${it.ssd ? ` · ${it.ssd} SSD` : ""}` : it.ssd ? it.ssd : "");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

/* ── Orders ── */
const DAY = 24 * 60 * 60 * 1000;
const RETURN_STATUS_COLOR = {
  Requested: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-600",
  Received: "bg-indigo-100 text-indigo-700",
  Refunded: "bg-brand-soft text-brand",
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
  const [returnDays, setReturnDays] = useState(7);
  const [reasons, setReasons] = useState([]);
  const [open, setOpen] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [returnFor, setReturnFor] = useState(null); // order object whose modal is open
  const [now, setNow] = useState(Date.now());       // ticks every second for live countdowns

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

  const load = useCallback(() => {
    setStatus("loading");
    Promise.all([getOrders(), getReturns().catch(() => []), getPublicSettings().catch(() => ({}))])
      .then(([o, rets, s]) => {
        setOrders(o);
        const map = {};
        (rets || []).forEach((r) => { if (!map[r.orderId]) map[r.orderId] = r; });
        setReturnsByOrder(map);
        if (s?.returnDays) setReturnDays(Number(s.returnDays));
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    getReturnReasons().then(setReasons).catch(() => setReasons([]));
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

  // Eligible = delivered, within window (deliveredAt → updatedAt → createdAt), no return yet.
  const returnEligible = (o) => {
    if (o.status !== "Delivered" || returnsByOrder[o.id]) return false;
    const base = new Date(o.deliveredAt || o.updatedAt || o.createdAt || Date.now());
    return Math.floor((Date.now() - base.getTime()) / DAY) <= returnDays;
  };

  if (status === "loading") return <div className="py-16 text-center text-sm text-neutral-400">Loading your orders…</div>;
  if (status === "error") return <ErrorState message="Couldn't load your orders." onRetry={load} />;
  if (!orders.length)
    return (
      <EmptyState title="No orders yet" message="When you place an order it'll show up here.">
        <Link href="/products/laptops" className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Start shopping</Link>
      </EmptyState>
    );

  return (
    <div className="space-y-4">
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
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_COLOR[o.status] || "bg-neutral-100 text-neutral-600"}`}>{o.status}</span>
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
                    {returnsByOrder[o.id].status === "Rejected" && returnsByOrder[o.id].adminNotes && (
                      <p className="mt-1 text-[12px] text-red-600">Reason: {returnsByOrder[o.id].adminNotes}</p>
                    )}
                    {returnsByOrder[o.id].status === "Refunded" && (
                      <p className="mt-1 text-[12px] text-brand">Refund of {formatINR(returnsByOrder[o.id].refundAmount)} processed.</p>
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
                      <span className="text-[12px] font-semibold text-neutral-400">Return window closed</span>
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
          reasons={reasons}
          onClose={() => setReturnFor(null)}
          onSubmitted={(r) => { setReturnsByOrder((m) => ({ ...m, [r.orderId]: r })); setReturnFor(null); setOpen(r.orderId); }}
        />
      )}
    </div>
  );
}

/* ── Request Return modal ── */
function RequestReturnModal({ order, reasons, onClose, onSubmitted }) {
  const lines = order.lines || [];
  const [productIdx, setProductIdx] = useState(0);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
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

  const submit = async () => {
    setError("");
    if (!reason) { setError("Please select a reason"); return; }
    if (!description.trim()) { setError("Please describe the issue"); return; }
    setSubmitting(true);
    try {
      const line = lines[productIdx] || lines[0] || {};
      const r = await createReturn({
        orderId: order.id,
        productId: line.productId != null ? String(line.productId) : "",
        productName: line.name || "",
        reason,
        description: description.trim(),
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
                {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Description <span className="text-red-500">*</span></span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Tell us what's wrong…" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
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
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Coupons (mock — no coupons-list endpoint specified) ── */
function CouponsTab() {
  const [copied, setCopied] = useState(null);
  return (
    <div className="space-y-3">
      {MOCK_COUPONS.map((c) => {
        const inactive = c.state !== "active";
        return (
          <div key={c.code} className={`flex flex-wrap items-center gap-4 rounded-card border border-dashed p-4 ${inactive ? "border-black/10 bg-neutral-50 opacity-60" : "border-brand/40 bg-brand-softer/40"}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-ink">{c.code}</span>
                {c.state === "expired" && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">EXPIRED</span>}
                {c.state === "used" && <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600">USED</span>}
              </div>
              <p className="mt-0.5 text-[13px] text-neutral-600">{c.desc}</p>
              <p className="text-[12px] text-neutral-400">Min order {c.min ? formatINR(c.min) : "—"} · Expires {c.expiry}</p>
            </div>
            {!inactive && (
              <button onClick={() => { navigator.clipboard?.writeText(c.code); setCopied(c.code); setTimeout(() => setCopied(null), 1500); }} className="rounded-full bg-brand px-4 py-2 text-[12px] font-bold text-white hover:bg-brand-dark">
                {copied === c.code ? "Copied ✓" : "Copy Code"}
              </button>
            )}
          </div>
        );
      })}
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
  const [tab, setTab] = useState(params.get("tab") || "orders");

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
          {tab === "coupons" && <CouponsTab />}
          {tab === "addresses" && <AddressesTab />}
          {tab === "profile" && <ProfileTab />}

          <button onClick={doLogout} className="mt-5 lg:mt-8 w-full rounded-full border border-red-200 py-2.5 lg:py-3 text-sm font-bold text-red-600 lg:hidden">Logout</button>
        </div>
      </div>
    </div>
  );
}
