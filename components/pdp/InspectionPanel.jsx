"use client";

import { useEffect, useState } from "react";
import { inspectionFor } from "@/lib/pdp";
import { WHATSAPP_NUMBER } from "@/lib/data";
import { ShieldIcon, CloseIcon, ChevronDown, WhatsAppIcon, COMPONENT_ICONS } from "@/components/Icons";

const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi, I have a question about the inspection report on a RefurbishedKart device."
)}`;

/* Device Condition Panel — controlled slide-in drawer. Triggered externally
   (checkpoint cards / promise row). ESC + backdrop close, scroll lock.
   Right drawer on desktop, bottom sheet on mobile. */
export default function InspectionPanel({ product, warranty, open, onClose }) {
  // Buyer-facing: non-applicable components are HIDDEN entirely (not greyed).
  const rows = inspectionFor(product).filter((r) => r.applicable);
  const [expanded, setExpanded] = useState(rows[0]?.key ?? "display");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const setOpen = (v) => { if (!v) onClose(); };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Inspection report">
          {/* backdrop */}
          <div className="absolute inset-0 bg-ink/50 animate-overlay-in" onClick={() => setOpen(false)} />

          {/* panel: bottom sheet (mobile) / right drawer (desktop) */}
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-white animate-panel-up md:inset-y-0 md:left-auto md:right-0 md:bottom-auto md:h-full md:max-h-none md:w-[35%] md:min-w-[420px] md:rounded-none md:animate-panel-right">
            {/* header */}
            <div className="flex items-start justify-between gap-3 border-b border-black/5 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-bold text-ink">{product.name}</h2>
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand">
                  <ShieldIcon style={{ width: 13, height: 13 }} /> Professionally Inspected
                </span>
              </div>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-ink"
              >
                <CloseIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* component accordion */}
            <div className="flex-1 overflow-y-auto">
              {rows.map((c) => {
                const isOpen = expanded === c.key;
                const Icon = COMPONENT_ICONS[c.key];
                return (
                  <div key={c.key} className={`border-b border-black/5 ${isOpen ? "bg-brand-softer/50" : ""}`}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : c.key)}
                      disabled={!c.applicable}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left disabled:cursor-default"
                    >
                      {Icon && <Icon style={{ width: 19, height: 19 }} className={`shrink-0 ${c.applicable ? "text-brand" : "text-neutral-300"}`} />}
                      <span className={`text-sm font-bold ${c.applicable ? "text-ink" : "text-neutral-400"}`}>{c.name}</span>
                      {c.applicable ? (
                        <span className="ml-auto flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                              <path d="m5 13 4 4L19 7" />
                            </svg>
                          </span>
                          <ChevronDown style={{ width: 15, height: 15 }} className={`text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </span>
                      ) : (
                        <span className="ml-auto rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-500">N/A</span>
                      )}
                    </button>
                    {isOpen && c.applicable && (
                      <p className="px-5 pb-4 pl-[3.25rem] text-[13px] leading-relaxed text-neutral-600">{c.text}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* footer */}
            <div className="border-t border-black/5 p-4">
              <div className="rounded-lg bg-brand px-4 py-3 text-center text-[13px] font-bold text-white">
                All devices carry a {warranty || "6-month"} warranty
              </div>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 text-[13px] font-semibold text-brand hover:text-brand-dark"
              >
                <WhatsAppIcon style={{ width: 16, height: 16 }} />
                Still have questions? Chat with us
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
