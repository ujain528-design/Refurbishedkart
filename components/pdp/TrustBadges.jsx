"use client";

import { useEffect, useState } from "react";
import { TRUST_POLICIES } from "@/lib/pdp";
import { CertifiedIcon, ReturnIcon, ShieldIcon, ClipboardIcon, EraseIcon, CloseIcon } from "@/components/Icons";

const BADGE_ICONS = {
  certified: CertifiedIcon,
  returns: ReturnIcon,
  warranty: ShieldIcon,
  gst: ClipboardIcon,
  wiped: EraseIcon,
};

export default function TrustBadges({ warranty }) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const policy = TRUST_POLICIES.find((p) => p.id === active);

  return (
    <>
      <div className="mt-7 flex flex-wrap gap-2.5">
        {TRUST_POLICIES.map((p) => {
          const Icon = BADGE_ICONS[p.id];
          const label = p.id === "warranty" && warranty ? `${warranty} Warranty` : p.label;
          return (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className="flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-2 text-[12px] font-semibold text-brand transition-all duration-200 hover:bg-brand hover:text-white"
            >
              <Icon style={{ width: 15, height: 15 }} />
              {label}
            </button>
          );
        })}
      </div>

      {/* policy modal — ESC or backdrop click to close */}
      {policy && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={policy.label}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] animate-overlay-in"
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-md rounded-card bg-white p-7 shadow-card-hover animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              onClick={() => setActive(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-ink"
            >
              <CloseIcon style={{ width: 18, height: 18 }} />
            </button>
            <h3 className="pr-8 text-lg font-extrabold tracking-tight text-ink">
              {policy.id === "warranty" && warranty ? `${warranty} Warranty` : policy.label}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{policy.body}</p>
          </div>
        </div>
      )}
    </>
  );
}
