"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/* Thin green top progress bar that animates on route changes (GitHub/YouTube
   style). App Router has no real navigation start/stop events, so this is an
   approximation: on pathname change the bar fills then fades. GPU width/opacity. */
export default function TopLoader() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; } // skip initial mount
    setActive(true);
    const t = setTimeout(() => setActive(false), 650);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]" aria-hidden="true">
      <div
        className={`h-full bg-brand shadow-[0_0_8px_rgba(27,94,32,0.6)] transition-all ease-out ${
          active ? "w-full opacity-100 duration-700" : "w-0 opacity-0 duration-200"
        }`}
      />
    </div>
  );
}
