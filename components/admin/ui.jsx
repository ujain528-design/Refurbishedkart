"use client";

import { createContext, useContext, useState, useCallback } from "react";

/* ── Toast notifications ── */
const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-modal-in rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-card-hover ${
              t.type === "error" ? "bg-red-600" : "bg-brand"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx) || (() => {});

/* ── Status badge ── */
const BADGE = {
  active: "bg-brand-soft text-brand", delivered: "bg-brand-soft text-brand",
  approved: "bg-brand-soft text-brand", published: "bg-brand-soft text-brand", paid: "bg-brand-soft text-brand",
  pending: "bg-amber-100 text-amber-700", new: "bg-amber-100 text-amber-700", draft: "bg-amber-100 text-amber-700",
  "in progress": "bg-amber-100 text-amber-700", quoted: "bg-indigo-100 text-indigo-700",
  shipped: "bg-sky-100 text-sky-700", packed: "bg-indigo-100 text-indigo-700", confirmed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-600", rejected: "bg-red-100 text-red-600", exhausted: "bg-red-100 text-red-600",
  expired: "bg-neutral-200 text-neutral-600", inactive: "bg-neutral-200 text-neutral-600",
  closed: "bg-neutral-200 text-neutral-600", returned: "bg-neutral-200 text-neutral-600",
  "out of stock": "bg-red-100 text-red-600", "low stock": "bg-amber-100 text-amber-700", "in stock": "bg-brand-soft text-brand",
};
export function Badge({ children }) {
  const key = String(children).toLowerCase();
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${BADGE[key] || "bg-neutral-200 text-neutral-600"}`}>{children}</span>;
}

/* ── Stat card ── */
export function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-card border border-black/5 bg-white p-5 shadow-card">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold tracking-tight ${accent || "text-ink"}`}>{value}</p>
    </div>
  );
}

/* ── Toggle switch ── */
export function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${on ? "bg-brand" : "bg-neutral-300"}`}
      title={label}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

/* ── Modal ── */
export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] animate-overlay-in" onClick={onClose}>
      <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-card bg-white p-6 shadow-card-hover animate-modal-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-ink">✕</button>
        </div>
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Tabs ── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-black/5">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${active === t ? "border-b-2 border-brand text-brand" : "text-neutral-500 hover:text-ink"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ── Shared form field styles ── */
export const inputCls = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";
export const btnPrimary = "rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark";
export const btnGhost = "rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand";

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span>}
    </label>
  );
}

/* ── Page header ── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
