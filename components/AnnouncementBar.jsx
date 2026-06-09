"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAnnouncement } from "@/lib/api";

/* Announcement strip from Settings. Sits above the fixed navbar by setting a
   --ann-h CSS variable the navbar reads for its top offset + spacer. */
export default function AnnouncementBar() {
  const [ann, setAnn] = useState(null);

  useEffect(() => { getAnnouncement().then(setAnn).catch(() => {}); }, []);

  useEffect(() => {
    const active = ann?.active && ann?.text;
    document.documentElement.style.setProperty("--ann-h", active ? "36px" : "0px");
    return () => document.documentElement.style.setProperty("--ann-h", "0px");
  }, [ann]);

  if (!ann?.active || !ann?.text) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex h-9 items-center justify-center bg-brand px-4 text-center text-[13px] font-semibold text-white">
      {ann.link
        ? <Link href={ann.link} className="truncate hover:underline">{ann.text}</Link>
        : <span className="truncate">{ann.text}</span>}
    </div>
  );
}
