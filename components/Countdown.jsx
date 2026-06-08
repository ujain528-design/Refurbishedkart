"use client";

import { useEffect, useState } from "react";

const SALE_DURATION_MS = 6 * 60 * 60 * 1000; // mock: 6h from first render

export default function Countdown({ onDark = false }) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    const end = Date.now() + SALE_DURATION_MS;
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  const h = left === null ? "--" : pad(Math.floor(left / 3.6e6));
  const m = left === null ? "--" : pad(Math.floor((left % 3.6e6) / 6e4));
  const s = left === null ? "--" : pad(Math.floor((left % 6e4) / 1e3));

  const label = onDark ? "text-white/60" : "text-neutral-500";
  const digit = onDark ? "bg-white text-ink" : "bg-ink text-white";
  const colon = onDark ? "text-white/40" : "text-neutral-400";

  return (
    <div className="flex items-center gap-2" aria-label="Flash sale ends in">
      <span className={`text-[13px] font-medium ${label}`}>Ends in</span>
      {[h, m, s].map((v, i) => (
        <span key={i} className="flex items-center gap-2">
          <span
            className={`min-w-[42px] rounded-lg px-2 py-1.5 text-center font-mono text-sm font-bold tabular-nums ${digit}`}
          >
            {v}
          </span>
          {i < 2 && <span className={`font-bold ${colon}`}>:</span>}
        </span>
      ))}
    </div>
  );
}
