"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/Icons";

/* Navbar search — Enter or the icon navigates to /search?q=… */
export default function SearchBar({ className = "", iconSize = 18, placeholder = "Search ThinkPad, MacBook, OptiPlex…", onNavigate }) {
  const [q, setQ] = useState("");
  const router = useRouter();

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
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-ink placeholder:text-neutral-400 focus:outline-none"
      />
    </div>
  );
}
