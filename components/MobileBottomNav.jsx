"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_CATEGORIES } from "@/lib/data";
import { SearchIcon, UserIcon, ShieldIcon, CloseIcon, ChevronRight } from "@/components/Icons";
import { useAuth } from "@/lib/AuthContext";

/* App-style mobile bottom navigation (below lg). Five equal tap targets:
   Home (/), Products (category sheet), Search (frosted overlay above the navbar),
   Policies (sheet), Account (/account | /login). CSS-only motion (picker-fade-in +
   animate-panel-up, disabled under prefers-reduced-motion). Hidden on desktop. */

const HomeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </svg>
);

const GridIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
  </svg>
);

const POLICIES = [
  { label: "Warranty", href: "/warranty" },
  { label: "Returns", href: "/return-policy" },
  { label: "Shipping", href: "/shipping" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

function NavItem({ active, label, onClick, href, children }) {
  const cls = `relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors ${active ? "text-[#1C1C1E]" : "text-neutral-500"}`;
  const inner = (
    <>
      {active && <span className="absolute top-0 h-[2px] w-9 rounded-full bg-[#B8860B]" aria-hidden="true" />}
      <span className="flex h-[22px] w-[22px] items-center justify-center">{children}</span>
      <span className="leading-none">{label}</span>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-current={active ? "page" : undefined} className={cls}>{inner}</button>
  ) : (
    <Link href={href} aria-current={active ? "page" : undefined} className={cls}>{inner}</Link>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [sheet, setSheet] = useState(null); // "products" | "policies" | null
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navRef = useRef(null);
  const [navH, setNavH] = useState(64); // measured navbar height → search panel rests just above it

  const anyOpen = !!sheet || searchOpen;

  // Measure the bottom navbar so the search panel can sit flush on top of it
  // (accounts for the safe-area inset, which varies by device).
  useEffect(() => {
    const measure = () => setNavH(navRef.current?.offsetHeight || 64);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Scroll-lock + ESC while any overlay is open.
  useEffect(() => {
    if (!anyOpen) return;
    const onKey = (e) => { if (e.key === "Escape") { setSheet(null); setSearchOpen(false); } };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [anyOpen]);

  // Auto-focus the search field when the overlay opens.
  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  const openSearch = () => { setSheet(null); setSearchOpen(true); };
  const closeSearch = () => { setSearchOpen(false); setQuery(""); };
  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    closeSearch();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  // Hide the bottom nav on purchase-flow pages (cart/checkout) so their fixed
  // bottom CTA (e.g. the "Place Order" bar) isn't covered by it. (After all hooks.)
  if (["/checkout", "/cart", "/payment-pending"].some((p) => pathname.startsWith(p))) return null;

  const isHome = pathname === "/";
  const isProducts = ["/products", "/shop", "/collections"].some((p) => pathname.startsWith(p));
  const isPolicies = POLICIES.some((p) => p.href === pathname);
  const isAccount = pathname.startsWith("/account") || pathname.startsWith("/login");
  const isSearch = searchOpen || pathname.startsWith("/search");

  const sheetItems = sheet === "products"
    ? NAV_CATEGORIES.map((c) => ({ label: c.name, href: `/products/${c.name.toLowerCase()}` }))
    : POLICIES;

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-[60] flex border-t border-[#E8E4DF] bg-warm-bg shadow-[0_-2px_16px_rgba(0,0,0,0.06)] lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <NavItem active={isHome} label="Home" href="/"><HomeIcon style={{ width: 22, height: 22 }} /></NavItem>
        <NavItem active={isProducts} label="Products" onClick={() => setSheet("products")}><GridIcon style={{ width: 22, height: 22 }} /></NavItem>
        <NavItem active={isSearch} label="Search" onClick={openSearch}><SearchIcon style={{ width: 22, height: 22 }} /></NavItem>
        <NavItem active={isPolicies} label="Policies" onClick={() => setSheet("policies")}><ShieldIcon style={{ width: 22, height: 22 }} /></NavItem>
        <NavItem active={isAccount} label="Account" href={isLoggedIn ? "/account" : "/login"}><UserIcon style={{ width: 22, height: 22 }} /></NavItem>
      </nav>

      {/* Category / Policies bottom sheet */}
      {sheet && (
        <div className="picker-fade-in fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={sheet === "products" ? "Browse categories" : "Policies and info"}>
          <div className="absolute inset-0 bg-ink/50" onClick={() => setSheet(null)} />
          <div className="animate-panel-up absolute inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-card-hover" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="flex items-center justify-between border-b border-warm-border px-5 py-4">
              <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-dark">{sheet === "products" ? "Shop by Category" : "Policies & Info"}</h2>
              <button aria-label="Close" onClick={() => setSheet(null)} className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-ink">
                <CloseIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              {sheetItems.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setSheet(null)}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-brand-softer hover:text-brand"
                >
                  {it.label}
                  <ChevronRight style={{ width: 18, height: 18 }} className="text-neutral-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search overlay — frosted panel that slides up from just above the navbar */}
      {searchOpen && (
        <div className="picker-fade-in fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Search products">
          <div className="absolute inset-0 bg-ink/50" onClick={closeSearch} />
          <div
            className="animate-panel-up absolute inset-x-0 rounded-t-2xl border-t border-white/60 bg-white/90 shadow-[0_-8px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl"
            style={{ bottom: navH }}
          >
            {/* decorative drag handle */}
            <div className="flex justify-center pt-2.5"><span className="h-1 w-10 rounded-full bg-neutral-300" aria-hidden="true" /></div>
            <button
              type="button"
              aria-label="Close search"
              onClick={closeSearch}
              className="absolute right-2 top-1.5 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-ink"
            >
              <CloseIcon style={{ width: 18, height: 18 }} />
            </button>
            <form onSubmit={submitSearch} className="flex items-center gap-2 px-4 py-3">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search laptops, desktops..."
                enterKeyHint="search"
                className="w-full rounded-full border border-black/10 bg-[#f5f5f5] px-5 py-3 text-[15px] text-neutral-800 placeholder:text-neutral-400 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <button
                type="submit"
                disabled={!query.trim()}
                className="shrink-0 rounded-full bg-brand px-5 py-3 text-[14px] font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
