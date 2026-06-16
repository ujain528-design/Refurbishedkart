"use client";

import { useEffect, useState } from "react";

/* Live countdown to a real end time (the admin-set flash-sale end date/time).

   variant:
     "page"    — large DD:HH:MM:SS hero timer (amber → red under 1 hour)
     "compact" — small inline DD:HH:MM:SS for the homepage section
     "inline"  — bare "DD:HH:MM:SS" text for the announcement bar (inherits colour)

   When the timer reaches zero it renders "Sale Ended" (page/compact) or "Ended"
   (inline). `endsAt` is a datetime-local string or any Date-parseable value. */

const HOUR_MS = 60 * 60 * 1000;

function parts(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(t / 86400),
    h: Math.floor((t % 86400) / 3600),
    m: Math.floor((t % 3600) / 60),
    s: t % 60,
  };
}
const pad = (n) => String(n).padStart(2, "0");

export default function FlashCountdown({ endsAt, variant = "page" }) {
  const [now, setNow] = useState(null); // null until mounted → avoids hydration mismatch
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const end = endsAt ? new Date(endsAt).getTime() : NaN;
  const valid = !Number.isNaN(end);
  const left = valid && now != null ? end - now : null;
  const ended = left != null && left <= 0;
  const warn = left != null && left > 0 && left <= HOUR_MS; // red under 1 hour
  const p = left != null ? parts(left) : null;

  if (variant === "inline") {
    if (now == null || !valid) return null;
    return <span className="font-mono font-bold tabular-nums">{ended ? "Ended" : `${pad(p.d)}:${pad(p.h)}:${pad(p.m)}:${pad(p.s)}`}</span>;
  }

  const big = variant === "page";
  const ended_ = ended;

  if (ended_) {
    return (
      <div className={`font-display font-extrabold tracking-tight text-red-600 ${big ? "text-3xl sm:text-4xl" : "text-xl"}`}>
        Sale Ended
      </div>
    );
  }

  // Loading (pre-mount) or invalid date → render a neutral placeholder of the same size.
  const units = [
    { label: "Days", v: p ? pad(p.d) : "--" },
    { label: "Hrs", v: p ? pad(p.h) : "--" },
    { label: "Min", v: p ? pad(p.m) : "--" },
    { label: "Sec", v: p ? pad(p.s) : "--" },
  ];
  const tone = warn ? "text-red-600" : "text-amber-600";
  const box = warn ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50";

  return (
    <div className={`flex items-center ${big ? "gap-2 sm:gap-3" : "gap-1.5"}`} aria-label="Time left in the flash sale">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center">
          <div className={`flex flex-col items-center rounded-lg border ${box} ${big ? "min-w-[58px] px-2 py-1.5 sm:min-w-[72px] sm:px-3 sm:py-2.5" : "min-w-[40px] px-1.5 py-1"}`}>
            <span className={`font-mono font-extrabold tabular-nums ${tone} ${big ? "text-2xl sm:text-4xl" : "text-base"}`}>{u.v}</span>
            <span className={`font-semibold uppercase tracking-wide text-neutral-400 ${big ? "text-[10px] sm:text-[11px]" : "text-[9px]"}`}>{u.label}</span>
          </div>
          {i < units.length - 1 && <span className={`px-0.5 font-bold ${tone} ${big ? "text-xl sm:text-2xl" : "text-sm"}`}>:</span>}
        </div>
      ))}
    </div>
  );
}
