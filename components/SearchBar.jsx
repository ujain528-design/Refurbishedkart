"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/Icons";

const TYPED = ["ThinkPad T480", "MacBook Pro", "Dell OptiPlex", "HP EliteBook"];

/* Navbar search — Enter or the icon navigates to /search?q=… */
export default function SearchBar({ className = "", iconSize = 18, placeholder = "Search ThinkPad, MacBook, OptiPlex…", onNavigate }) {
  const [q, setQ] = useState("");
  const [typed, setTyped] = useState("");
  const router = useRouter();

  // Typing placeholder: types each phrase out, pauses, deletes, next. Pure timers;
  // disabled under reduced-motion (falls back to the static placeholder).
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    let phrase = 0, char = 0, deleting = false, timer;
    const tick = () => {
      const word = TYPED[phrase];
      char += deleting ? -1 : 1;
      setTyped(`Search ${word.slice(0, char)}…`);
      if (!deleting && char === word.length) { deleting = true; timer = setTimeout(tick, 2000); return; }
      if (deleting && char === 0) { deleting = false; phrase = (phrase + 1) % TYPED.length; timer = setTimeout(tick, 400); return; }
      timer = setTimeout(tick, deleting ? 40 : 80);
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, []);

  const go = () => {
    const term = q.trim();
    if (!term) return;
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button aria-label="Search" onClick={go} className="shrink-0 text-neutral-400 hover:text-brand">
        <SearchIcon style={{ width: iconSize, height: iconSize }} />
      </button>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        type="text"
        placeholder={typed || placeholder}
        className="w-full bg-transparent text-sm text-ink placeholder:text-neutral-400 focus:outline-none"
      />
    </div>
  );
}
