"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingScreen, { randomQuote } from "@/components/LoadingScreen";

const LATENCY_THRESHOLD = 300; // ms — only slow transitions reveal the screen

// Admin + API routes never show the storefront loading overlay.
const isExempt = (path) => !path || path.startsWith("/admin") || path.startsWith("/api");

/* App Router has no real navigation start/stop events, so we approximate:
   - "navigation start"  = a click on an internal <a> (or a back/forward popstate)
   - "navigation done"   = usePathname() changes (route committed + rendered)
   On start we arm a 300ms timer; if the route hasn't committed by then, the
   overlay appears. On done we clear the timer and hide it. Fast navigations
   never cross the 300ms gate, so the screen stays hidden. */
export default function TransitionWrapper({ children }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [quote, setQuote] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    const arm = (targetPath) => {
      // Skip when leaving from, or navigating into, an exempt area.
      if (isExempt(targetPath) || isExempt(window.location.pathname)) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setQuote(randomQuote()); // fresh quote per slow navigation
        setVisible(true);
      }, LATENCY_THRESHOLD);
    };

    const onClick = (e) => {
      // Ignore non-primary / modified clicks (new tab, etc.) and prevented ones.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a");
      if (!a || a.hasAttribute("download")) return;
      if (a.target && a.target !== "_self") return; // opens elsewhere
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let url;
      try { url = new URL(a.href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return; // external
      if (url.pathname === window.location.pathname) return; // same page / hash only
      arm(url.pathname);
    };

    const onPop = () => arm(window.location.pathname);

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // Route committed → cancel any pending timer and hide the overlay.
  useEffect(() => {
    clearTimeout(timer.current);
    setVisible(false);
    return () => clearTimeout(timer.current);
  }, [pathname]);

  return (
    <>
      {children}
      <LoadingScreen visible={visible} quote={quote} />
    </>
  );
}
