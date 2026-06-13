"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getAnnouncement } from "@/lib/api";

/* Announcement strip from Settings. Sits above the fixed navbar by setting a
   --ann-h CSS variable the navbar reads for its top offset + spacer. Hidden on
   the admin panel, which has its own chrome (AdminShell), so no customer-facing
   promo bar bleeds onto admin pages. */
export default function AnnouncementBar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [ann, setAnn] = useState(null);

  useEffect(() => { getAnnouncement().then(setAnn).catch(() => {}); }, []);

  useEffect(() => {
    const active = ann?.active && ann?.text && !isAdmin;
    document.documentElement.style.setProperty("--ann-h", active ? "36px" : "0px");
    return () => document.documentElement.style.setProperty("--ann-h", "0px");
  }, [ann, isAdmin]);

  if (isAdmin) return null;
  if (!ann?.active || !ann?.text) return null;

  const Item = ({ k }) => (
    <span key={k} className="flex items-center">
      {ann.link
        ? <Link href={ann.link} className="px-5 hover:underline">{ann.text}</Link>
        : <span className="px-5">{ann.text}</span>}
      <span className="px-1 text-white/50" aria-hidden="true">·</span>
    </span>
  );

  return (
    <div className="ticker-wrap fixed inset-x-0 top-0 z-[60] flex h-9 items-center overflow-hidden bg-brand text-[13px] font-semibold text-white">
      {/* Two identical halves; the -50% keyframe loops seamlessly. Pauses on hover. */}
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
