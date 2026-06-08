"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="rounded-full bg-brand/20 px-6 py-3 text-sm font-semibold text-brand-accent">
        You're in. Deals land in your inbox before they go live. ✓
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true); // mock only — no backend
      }}
      className="flex w-full max-w-md items-center gap-2 rounded-full bg-white/10 p-1.5 ring-1 ring-white/15 focus-within:ring-brand-accent/60"
    >
      <input
        type="email"
        required
        placeholder="Your email address"
        className="w-full bg-transparent px-4 text-sm text-white placeholder:text-white/40 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-mid"
      >
        Subscribe
      </button>
    </form>
  );
}
