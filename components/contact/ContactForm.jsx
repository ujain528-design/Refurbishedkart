"use client";

import { useState } from "react";

const SUBJECTS = ["General Enquiry", "Order Related", "Warranty Claim", "Return Request", "Bulk Order", "Other"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputCls = "w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "General Enquiry", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Please enter your full name.");
    if (!EMAIL_RE.test(form.email.trim())) return setError("Please enter a valid email address.");
    if (form.phone.replace(/\D/g, "").length < 10) return setError("Please enter a valid 10-digit phone number.");
    if (!form.message.trim()) return setError("Please enter a message.");

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setStatus("error"); setError(data.error || "Something went wrong. Please try again."); return; }
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Couldn't reach the server. Please try again.");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-card border border-brand/15 bg-brand-soft px-5 py-10 text-center">
        <p className="text-[15px] font-bold text-brand">Thank you! We&apos;ll get back to you within 24 hours.</p>
        <p className="mt-1 text-sm text-neutral-600">Your message has been sent to our team.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-[12px] font-semibold text-neutral-600">Full Name <span className="text-red-500">*</span></label>
        <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" autoComplete="name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-neutral-600">Email <span className="text-red-500">*</span></label>
          <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" autoComplete="email" />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-neutral-600">Phone <span className="text-red-500">*</span></label>
          <input type="tel" inputMode="numeric" maxLength={10} className={inputCls} value={form.phone}
            onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" autoComplete="tel" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[12px] font-semibold text-neutral-600">Subject <span className="text-red-500">*</span></label>
        <select className={inputCls} value={form.subject} onChange={(e) => set("subject", e.target.value)}>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[12px] font-semibold text-neutral-600">Message <span className="text-red-500">*</span></label>
        <textarea rows={5} className={inputCls} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="How can we help?" />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">{error}</p>}
      <button type="submit" disabled={status === "sending"} className="rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50">
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
