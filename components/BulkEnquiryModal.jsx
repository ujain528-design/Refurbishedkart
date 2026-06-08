"use client";

import { useEffect, useState } from "react";
import { BULK_CATEGORIES, WHATSAPP_NUMBER, WHATSAPP_MESSAGE } from "@/lib/data";
import { submitBulkEnquiry } from "@/lib/api";
import { OPEN_BULK_MODAL_EVENT } from "@/components/BulkEnquiryTrigger";
import { ClipboardIcon, WhatsAppIcon, CloseIcon, ShieldIcon, ArrowRight } from "@/components/Icons";

const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-neutral-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

/* PRD §4.2 — modal shows two clearly labelled options side by side. */
function OptionsView({ onForm }) {
  return (
    <>
      <h3 className="text-xl font-extrabold tracking-tight text-ink">
        Need 5+ units? Get a custom quote.
      </h3>
      <p className="mt-1.5 text-sm text-neutral-500">
        Pick whichever works for you — both reach the same team.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          onClick={onForm}
          className="group flex flex-col items-start gap-3 rounded-card border border-black/10 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card-hover"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            <ClipboardIcon style={{ width: 22, height: 22 }} />
          </span>
          <span className="text-[15px] font-bold text-ink">Fill a Form</span>
          <span className="text-[13px] leading-relaxed text-neutral-500">
            Structured enquiry with email follow-up. We respond within 24 hours.
          </span>
          <span className="mt-auto flex items-center gap-1 text-[13px] font-bold text-brand">
            Start <ArrowRight style={{ width: 14, height: 14 }} className="transition-transform group-hover:translate-x-1" />
          </span>
        </button>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-start gap-3 rounded-card border border-black/10 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card-hover"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            <WhatsAppIcon style={{ width: 22, height: 22 }} />
          </span>
          <span className="text-[15px] font-bold text-ink">Chat on WhatsApp</span>
          <span className="text-[13px] leading-relaxed text-neutral-500">
            Instant response from the sales team, pre-filled message included.
          </span>
          <span className="mt-auto flex items-center gap-1 text-[13px] font-bold text-brand">
            Open chat <ArrowRight style={{ width: 14, height: 14 }} className="transition-transform group-hover:translate-x-1" />
          </span>
        </a>
      </div>
    </>
  );
}

/* PRD §4.2 Option A fields — submits to POST /api/bulk-enquiry. */
function FormView({ onBack, onDone }) {
  const [form, setForm] = useState({
    name: "", org: "", email: "", phone: "",
    category: BULK_CATEGORIES[0], quantity: "", budget: "", message: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await submitBulkEnquiry(form); // keeps all fields on error
      onDone();
    } catch (err) {
      setError(err.message || "Couldn't submit. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={onBack} className="text-[13px] font-semibold text-brand hover:text-brand-dark">
        ← Back to options
      </button>
      <h3 className="mt-3 text-xl font-extrabold tracking-tight text-ink">Bulk enquiry form</h3>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">{error}</p>}
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Full Name" required>
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Utkarsh Jain" />
        </Field>
        <Field label="Organisation Name" required>
          <input required value={form.org} onChange={(e) => set("org", e.target.value)} className={inputCls} placeholder="Acme School / Co." />
        </Field>
        <Field label="Email" required>
          <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="you@org.com" />
        </Field>
        <Field label="Phone" required>
          <input type="tel" required pattern="[0-9+ -]{10,}" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} placeholder="+91 …" />
        </Field>
        <Field label="Product Category">
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
            {BULK_CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
          </select>
        </Field>
        <Field label="Approximate Quantity" required>
          <input type="number" min="5" required value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className={inputCls} placeholder="5+" />
        </Field>
        <Field label="Budget per Unit (optional)">
          <input value={form.budget} onChange={(e) => set("budget", e.target.value)} className={inputCls} placeholder="₹20,000" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Additional Requirements">
            <textarea rows={3} value={form.message} onChange={(e) => set("message", e.target.value)} className={inputCls} placeholder="Specs, delivery timeline, location…" />
          </Field>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50 sm:col-span-2 sm:justify-self-start"
        >
          {busy ? "Submitting…" : "Submit Enquiry"}
        </button>
      </form>
    </>
  );
}

function DoneView({ onClose }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <ShieldIcon style={{ width: 26, height: 26 }} />
      </span>
      <h3 className="mt-5 text-xl font-extrabold tracking-tight text-ink">Enquiry received</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
        Our team will get back to you within 24 hours with a custom quote.
        A confirmation has been sent to your email.
      </p>
      <button
        onClick={onClose}
        className="mt-7 rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
      >
        Done
      </button>
    </div>
  );
}

export default function BulkEnquiryModal() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("options"); // options | form | done

  useEffect(() => {
    const onOpen = () => {
      setView("options");
      setOpen(true);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener(OPEN_BULK_MODAL_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_BULK_MODAL_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bulk enquiry"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] animate-overlay-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-card bg-white p-7 shadow-card-hover animate-modal-in md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-ink"
        >
          <CloseIcon style={{ width: 18, height: 18 }} />
        </button>

        {view === "options" && <OptionsView onForm={() => setView("form")} />}
        {view === "form" && <FormView onBack={() => setView("options")} onDone={() => setView("done")} />}
        {view === "done" && <DoneView onClose={() => setOpen(false)} />}
      </div>
    </div>
  );
}
