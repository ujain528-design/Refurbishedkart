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
  const paid = Number(ret.paidAmount) || 0;
  const [form, setForm] = useState({
    status: ret.status,
    adminNotes: ret.adminNotes || "",
    deductionAmount: ret.deductionAmount ?? 0,
    deductionReason: ret.deductionReason || "",
    refundAmount: ret.refundAmount ?? Math.max(0, paid),
    addToStock: false,
  });
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Refund auto-tracks paid − deduction unless the admin has typed a custom value.
  const autoRefund = Math.max(0, paid - (Number(form.deductionAmount) || 0));
  const onDeduction = (v) => setForm((f) => ({ ...f, deductionAmount: v, refundAmount: Math.max(0, paid - (Number(v) || 0)) }));

  const showRefund = ["Approved", "Received", "Refunded"].includes(form.status);

  // Current status + the steps it may move to (workflow-enforced in the dropdown).
  const statusOptions = [ret.status, ...(NEXT[ret.status] || [])];

  const save = async (overrideStatus) => {
    const status = overrideStatus || form.status;
    // A rejection must carry a reason — it's shown to the customer.
    if (status === "Rejected" && !form.adminNotes.trim()) {
      toast("Admin note is required to reject a return", "error");
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
            <button onClick={() => save("Refunded")} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Mark as Refunded"}</button>
          ) : (
            <button onClick={() => save()} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button>
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
          <span className="text-neutral-500">Amount paid</span><span className="text-right font-semibold text-ink">{formatINR(paid)}</span>
        </div>

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
            <p className="mt-1 text-[11px] text-neutral-400">Auto = paid − deduction ({formatINR(autoRefund)}). Refunds are processed manually; mark Refunded once done.</p>
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
