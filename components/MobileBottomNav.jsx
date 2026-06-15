"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_CATEGORIES } from "@/lib/data";
import { SearchIcon, UserIcon, ShieldIcon, CloseIcon, ChevronRight } from "@/components/Icons";
import { useAuth } from "@/lib/AuthContext";

/* App-style mobile bottom navigation (below lg). Four equal tap targets:
   Products (category sheet), Policies (sheet), Account (/account | /login),
   Search (/search). CSS-only motion (reuses picker-fade-in + animate-panel-up,
   both disabled under prefers-reduced-motion). Hidden on desktop. */

const GridIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
  </svg>
);

const POLICIES = [
  { label: "Return Policy", href: "/return-policy" },
  { label: "Warranty", href: "/warranty" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
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
  const { isLoggedIn } = useAuth();
  const [sheet, setSheet] = useState(null); // "products" | "policies" | null

  // Scroll-lock + ESC while a sheet is open.
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e) => e.key === "Escape" && setSheet(null);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [sheet]);

  // Hide the bottom nav on purchase-flow pages (cart/checkout) so their fixed
  // bottom CTA (e.g. the "Place Order" bar) isn't covered by it. (After all hooks.)
  if (["/checkout", "/cart", "/payment-pending"].some((p) => pathname.startsWith(p))) return null;

  const isProducts = ["/products", "/shop", "/collections"].some((p) => pathname.startsWith(p));
  const isPolicies = POLICIES.some((p) => p.href === pathname);
  const isAccount = pathname.startsWith("/account") || pathname.startsWith("/login");
  const isSearch = pathname.startsWith("/search");

  const sheetItems = sheet === "products"
    ? NAV_CATEGORIES.map((c) => ({ label: c.name, href: `/products/${c.name.toLowerCase()}` }))
    : POLICIES;

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-[60] flex border-t border-[#E8E4DF] bg-warm-bg shadow-[0_-2px_16px_rgba(0,0,0,0.06)] lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <NavItem active={isProducts} label="Products" onClick={() => setSheet("products")}><GridIcon style={{ width: 22, height: 22 }} /></NavItem>
        <NavItem active={isPolicies} label="Policies" onClick={() => setSheet("policies")}><ShieldIcon style={{ width: 22, height: 22 }} /></NavItem>
        <NavItem active={isAccount} label="Account" href={isLoggedIn ? "/account" : "/login"}><UserIcon style={{ width: 22, height: 22 }} /></NavItem>
        <NavItem active={isSearch} label="Search" href="/search"><SearchIcon style={{ width: 22, height: 22 }} /></NavItem>
      </nav>

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
    </>
  );
}
