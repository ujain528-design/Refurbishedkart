"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MenuIcon, CloseIcon } from "@/components/Icons";
import { adminGetReturns } from "@/lib/api";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/bulk-upload", label: "Bulk Upload" },
  { href: "/admin/banners", label: "Hero Banners" },
  { href: "/admin/tags", label: "Tags & Collections" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/pricing", label: "Pricing Control" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/enquiries", label: "Bulk Enquiries" },
  { href: "/admin/pages", label: "Pages & Navigation", comingSoon: true },
  { href: "/admin/master-data", label: "Master Data" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const [checking, setChecking] = useState(true);
  const [pendingReturns, setPendingReturns] = useState(0);

  // The login page renders WITHOUT the admin chrome or the session check.
  const isLoginPage = pathname === "/admin/login";

  // Verify the admin session (full JWT verification server-side). Middleware
  // already gates page access; this catches a forged/expired-by-signature cookie
  // and powers the header identity + logout.
  useEffect(() => {
    if (isLoginPage) { setChecking(false); return; }
    let alive = true;
    fetch("/api/admin/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (alive) { setAdminId(d.adminId || "admin"); setChecking(false); } })
      .catch(() => { if (alive) router.replace("/admin/login"); });
    return () => { alive = false; };
  }, [isLoginPage, pathname, router]);

  useEffect(() => setDrawer(false), [pathname]);

  // Pending-returns count for the sidebar badge. Refreshes on route change so it
  // updates after an admin processes a return. (Non-blocking; failure → no badge.)
  useEffect(() => {
    if (isLoginPage) return;
    let alive = true;
    adminGetReturns({ status: "Requested" })
      .then((r) => { if (alive) setPendingReturns(Array.isArray(r) ? r.length : 0); })
      .catch(() => { if (alive) setPendingReturns(0); });
    return () => { alive = false; };
  }, [isLoginPage, pathname]);

  const logout = async () => {
    try { await fetch("/api/admin/auth/logout", { method: "POST" }); } catch {}
    window.location.assign("/admin/login");
  };

  if (isLoginPage) return <>{children}</>;

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400">Loading admin…</div>;
  }

  const isActive = (href) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const SidebarLinks = () => (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map((item) =>
        item.comingSoon ? (
          <div
            key={item.href}
            aria-disabled="true"
            title="Coming soon — not yet available"
            className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-white/30"
          >
            <span>{item.label}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/50">Coming Soon</span>
          </div>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(item.href) ? "bg-brand text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>{item.label}</span>
            {item.href === "/admin/returns" && pendingReturns > 0 && (
              <span className="ml-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-white">{pendingReturns}</span>
            )}
          </Link>
        )
      )}
    </nav>
  );

  return (
    <div className="admin-shell min-h-screen bg-neutral-50">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] overflow-y-auto bg-[#1A1A1A] lg:block">
        <Link href="/admin" className="flex items-center px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_rk.webp" alt="RefurbishedKart" className="h-auto w-40 max-w-full" />
        </Link>
        <p className="px-5 text-[11px] font-semibold uppercase tracking-wider text-white/30">Admin Panel</p>
        <SidebarLinks />
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] overflow-y-auto bg-[#1A1A1A] animate-modal-in">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-extrabold uppercase tracking-wide text-white">Admin</span>
              <button onClick={() => setDrawer(false)} className="rounded-full p-2 text-white/60 hover:text-white">
                <CloseIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <SidebarLinks />
          </aside>
        </div>
      )}

      {/* top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-black/5 bg-white px-4 lg:left-[240px]">
        <div className="flex items-center gap-3">
          <button onClick={() => setDrawer(true)} className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden">
            <MenuIcon style={{ width: 20, height: 20 }} />
          </button>
          <span className="text-sm font-bold text-ink">RefurbishedKart Admin</span>
        </div>
        <div className="flex items-center gap-3">
          {adminId && (
            <span className="hidden text-sm text-neutral-500 sm:block">
              {adminId} <span className="text-[11px] font-bold uppercase text-brand">· admin</span>
            </span>
          )}
          <a href="/" target="_blank" rel="noopener noreferrer" className="hidden rounded-full bg-brand px-4 py-2 text-[13px] font-bold text-white hover:bg-brand-dark sm:inline-block">
            View Store ↗
          </a>
          <button onClick={logout} className="rounded-full border border-black/10 px-4 py-2 text-[13px] font-bold text-neutral-600 hover:bg-neutral-100">
            Logout
          </button>
        </div>
      </header>

      {/* content */}
      <main className="px-4 pb-16 pt-20 sm:px-6 lg:ml-[240px]">{children}</main>
    </div>
  );
}
