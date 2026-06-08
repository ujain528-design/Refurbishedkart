"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const inputCls = "w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

  if (sent) {
    return (
      <div className="rounded-card bg-brand-soft px-5 py-8 text-center">
        <p className="text-[15px] font-bold text-brand">Thanks — we've got your message.</p>
        <p className="mt-1 text-sm text-neutral-600">Our team will reply within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
      <input required className={inputCls} placeholder="Your name" />
      <input required type="email" className={inputCls} placeholder="Email address" />
      <textarea required rows={5} className={inputCls} placeholder="How can we help?" />
      <button type="submit" className="rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark">
        Send
      </button>
    </form>
  );
}
