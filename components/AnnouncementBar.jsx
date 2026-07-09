"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getAnnouncement, getFlashSale } from "@/lib/api";
import FlashCountdown from "@/components/flash/FlashCountdown";

/* Sitewide bar — flash-sale-aware.

   Precedence: an active Flash Sale bar (sale ON + bar ON) wins over the generic
   announcement ticker. The flash bar carries its own colours, position, live
   countdown, click-through to the sale page, and a session-only dismiss (X). When
   nothing is active the component renders nothing and reserves no space.

   Layout offsets (so content never hides behind the bar):
     • top          → sets --ann-h (the navbar already offsets by this)
     • below-navbar → sets --flashbar-belownav-h (an extra navbar spacer reserves it)
     • bottom       → fixed to the viewport bottom; no top offset needed
   Hidden entirely on /admin (admin has its own chrome). */

const DISMISS_KEY = "rk_flashbar_dismissed";

export default function AnnouncementBar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/admin");

  const [ann, setAnn] = useState(null);
  const [flash, setFlash] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getAnnouncement().then(setAnn).catch(() => {});
    getFlashSale().then(setFlash).catch(() => {});
    try { setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1"); } catch {}
  }, []);

  const flashBarOn = !isAdmin && !!flash?.active && !!flash?.bar?.active && !dismissed;
  const genericOn = !isAdmin && !flashBarOn && !!ann?.active && !!ann?.text;

  const flashPos = flash?.bar?.position || "top";

  // Drive the layout-offset CSS variables off whatever bar is showing.
  useEffect(() => {
    const root = document.documentElement.style;
    const topBarShowing = genericOn || (flashBarOn && flashPos === "top");
    root.setProperty("--ann-h", topBarShowing ? "40px" : "0px");
    root.setProperty("--flashbar-belownav-h", flashBarOn && flashPos === "below-navbar" ? "40px" : "0px");
    return () => {
      root.setProperty("--ann-h", "0px");
      root.setProperty("--flashbar-belownav-h", "0px");
    };
  }, [genericOn, flashBarOn, flashPos]);

  if (isAdmin) return null;

  // ── Flash bar ──
  if (flashBarOn) {
    const { bar, timer, slug } = flash;
    const href = `/${slug || "flash-sale"}`;
    const dismiss = (e) => {
      e.stopPropagation();
      try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
      setDismissed(true);
    };

    const posCls =
      flashPos === "bottom"
        ? "fixed inset-x-0 bottom-[60px] z-[55] lg:bottom-0"
        : flashPos === "below-navbar"
        ? "fixed inset-x-0 top-[68px] z-40 lg:top-[113px]"
        : "fixed inset-x-0 top-0 z-[60]"; // top (above navbar)

    return (
      <div
        role="link"
        tabIndex={0}
        aria-label="Go to the flash sale"
        onClick={() => router.push(href)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(href); }}
        className={`flex h-10 cursor-pointer items-center justify-center gap-2 px-10 text-center text-[13px] font-bold ${posCls}`}
        style={{ background: bar.bg, color: bar.textColor }}
      >
        <span className="truncate">{bar.text}</span>
        {timer?.active && timer?.endsAt && (
          <span className="shrink-0">· <FlashCountdown endsAt={timer.endsAt} variant="inline" /></span>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-current opacity-80 hover:opacity-100"
          style={{ lineHeight: 1 }}
        >
          ✕
        </button>
      </div>
    );
  }

  // ── Generic announcement ticker (unchanged behaviour) ──
  if (!genericOn) return null;

  const Item = ({ k }) => (
    <span key={k} className="flex items-center">
      {ann.link
        ? <Link href={ann.link} className="px-5 hover:underline">{ann.text}</Link>
        : <span className="px-5">{ann.text}</span>}
      <span className="px-1 opacity-50" aria-hidden="true">·</span>
    </span>
  );

  return (
    <div
      className="ticker-wrap fixed inset-x-0 top-0 z-[60] flex h-9 items-center overflow-hidden text-[13px] font-semibold"
      style={{ background: ann.announcementBg || "#2D5016", color: ann.announcementTextColor || "#ffffff" }}
    >
      <div className="ticker-track">
        {[0, 1].map((half) => (
          <span key={half} className="flex items-center" aria-hidden={half === 1}>
            {[0, 1, 2, 3].map((j) => <Item key={`${half}-${j}`} k={`${half}-${j}`} />)}
          </span>
        ))}
      </div>
    </div>
  );
}
