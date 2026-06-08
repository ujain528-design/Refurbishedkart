"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { LogoMark, MenuIcon, CloseIcon } from "@/components/Icons";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/bulk-upload", label: "Bulk Upload" },
  { href: "/admin/banners", label: "Hero Banners" },
  { href: "/admin/tags", label: "Tags & Collections" },
  { href: "/admin/pricing", label: "Pricing Control" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/enquiries", label: "Bulk Enquiries" },
  { href: "/admin/pages", label: "Pages & Navigation" },
  { href: "/admin/master-data", label: "Master Data" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminShell({ children }) {
  const { ready, isLoggedIn, isAdmin, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (ready && (!isLoggedIn || !isAdmin)) router.replace("/login?next=/admin");
  }, [ready, isLoggedIn, isAdmin, router]);

  useEffect(() => setDrawer(false), [pathname]);

  if (!ready || !isLoggedIn || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400">Loading admin…</div>;
  }

  const isActive = (href) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const SidebarLinks = () => (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive(item.href) ? "bg-brand text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] overflow-y-auto bg-[#1A1A1A] lg:block">
        <Link href="/admin" className="flex items-center gap-2 px-5 py-5">
          <LogoMark className="h-7 w-7 text-brand-accent" />
          <span className="text-sm font-extrabold uppercase tracking-wide text-white">RefurbishedKart</span>
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
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-neutral-500 sm:block">
            {user?.name} <span className="text-[11px] font-bold uppercase text-brand">· {user?.role}</span>
          </span>
          <a href="/" target="_blank" rel="noopener noreferrer" className="rounded-full bg-brand px-4 py-2 text-[13px] font-bold text-white hover:bg-brand-dark">
            View Store ↗
          </a>
        </div>
      </header>

      {/* content */}
      <main className="px-4 pb-16 pt-20 sm:px-6 lg:ml-[240px]">{children}</main>
    </div>
  );
}
