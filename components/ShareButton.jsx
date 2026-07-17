"use client";

import { useEffect, useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/Icons";

/* Share control — no external libs.
   - Uses the native Web Share API when available (mobile + supporting desktops).
   - Falls back on desktop to: a popup (variant="pdp") with Copy Link + WhatsApp,
     or a direct clipboard copy (variant="card").
   Clipboard has an execCommand fallback for older/insecure contexts. */

const ShareIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
  </svg>
);
const LinkIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
  </svg>
);

export default function ShareButton({ title = "", url = "", variant = "pdp", className = "" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  const resolveUrl = () => {
    if (typeof window === "undefined") return url || "";
    if (!url) return window.location.href;
    return url.startsWith("/") ? window.location.origin + url : url;
  };

  const copy = async (u) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(u);
      } else {
        const ta = document.createElement("textarea");
        ta.value = u; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore — nothing else to do if copy is blocked */ }
  };

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const u = resolveUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      // URL only (+ title) — passing `text` too makes some apps paste the message
      // and the URL as one blob, breaking the link.
      try { await navigator.share({ title, url: u }); } catch { /* user cancelled */ }
      return;
    }
    if (variant === "card") { copy(u); return; }
    setOpen((o) => !o);
  };

  // Close the pdp popup on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (ev) => { if (ref.current && !ref.current.contains(ev.target)) setOpen(false); };
    const onKey = (ev) => { if (ev.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const waHref = () => `https://wa.me/?text=${encodeURIComponent("Check out this product: " + resolveUrl())}`;

  // ── Card variant: icon-only, direct copy + "Copied!" tooltip ──
  if (variant === "card") {
    return (
      <div ref={ref} className={className || "relative"}>
        <button
          type="button"
          aria-label="Share"
          onClick={onClick}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-400 shadow-card transition-all duration-200 hover:scale-110 hover:text-brand"
        >
          <ShareIcon style={{ width: 16, height: 16 }} />
        </button>
        {copied && (
          <span className="pointer-events-none absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[10px] font-bold text-white">Copied!</span>
        )}
      </div>
    );
  }

  // ── PDP variant: icon + "Share" label, popup on desktop ──
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label="Share"
        aria-expanded={open}
        onClick={onClick}
        className="flex h-12 items-center justify-center gap-2 rounded-card border border-warm-border px-4 text-neutral-500 transition-colors hover:border-brand hover:text-brand"
      >
        <ShareIcon style={{ width: 18, height: 18 }} />
        <span className="hidden text-sm font-bold sm:inline">Share</span>
      </button>

      {open && (
        <div className="picker-fade-in absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-black/10 bg-white shadow-card-hover">
          <button
            type="button"
            onClick={() => { copy(resolveUrl()); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-ink transition-colors hover:bg-neutral-50"
          >
            <LinkIcon style={{ width: 17, height: 17 }} /> Copy Link
          </button>
          <a
            href={waHref()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 border-t border-black/5 px-4 py-3 text-sm font-semibold text-[#0e7a4f] transition-colors hover:bg-[#25D366]/10"
          >
            <WhatsAppIcon style={{ width: 17, height: 17 }} /> WhatsApp
          </a>
        </div>
      )}

      {copied && (
        <span className="pointer-events-none absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-[11px] font-bold text-white">Link copied!</span>
      )}
    </div>
  );
}
