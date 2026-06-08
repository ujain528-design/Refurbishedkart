"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { formatINR, INDIAN_STATES } from "@/lib/data";
import { MOCK_ORDERS, STATUS_STYLES, MOCK_COUPONS, MOCK_ADDRESSES, MOCK_PROFILE } from "@/lib/account-data";
import { ChevronDown, BrokenDeviceIcon } from "@/components/Icons";

// Wishlist moved to its own public /wishlist page — no longer an account tab.
const TABS = [
  { id: "orders", label: "My Orders" },
  { id: "coupons", label: "Coupons" },
  { id: "addresses", label: "Addresses" },
  { id: "profile", label: "My Profile" },
];

const variantText = (it) =>
  it.ram ? `${it.ram}GB${it.ssd ? ` · ${it.ssd} SSD` : ""}` : it.ssd ? it.ssd : "";

/* ── Orders ── */
function OrdersTab() {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-4">
      {MOCK_ORDERS.map((o) => (
        <div key={o.id} className="overflow-hidden rounded-card border border-black/5 bg-white shadow-card">
          <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left">
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">#{o.id}</p>
              <p className="text-[12px] text-neutral-400">{o.date} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[o.status]}`}>{o.status}</span>
            <span className="ml-auto text-sm font-bold text-ink">{formatINR(o.total)}</span>
            <ChevronDown style={{ width: 16, height: 16 }} className={`text-neutral-400 transition-transform ${open === o.id ? "rotate-180" : ""}`} />
          </button>
          {open === o.id && (
            <div className="border-t border-black/5 px-5 py-4">
              <div className="space-y-3">
                {o.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                      {it.image ? <img src={it.image} alt="" className="h-full w-full object-contain p-1" /> : <BrokenDeviceIcon style={{ width: 22, height: 22 }} className="text-neutral-300" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{it.name}</p>
                      <p className="text-[12px] text-neutral-500">{variantText(it)} · Qty {it.qty}</p>
                    </div>
                    <p className="text-[13px] font-bold text-ink">{formatINR(it.price * it.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <span className="text-[12px] text-neutral-400">Tracking: <span className="text-brand">RK{o.id.replace(/\D/g, "")}IN</span></span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button className="rounded-full border border-black/10 px-4 py-2 text-[12px] font-bold text-ink hover:border-brand hover:text-brand">Download Invoice</button>
                {o.status === "Delivered" && (
                  <button className="rounded-full border border-black/10 px-4 py-2 text-[12px] font-bold text-ink hover:border-brand hover:text-brand">Write a Review</button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Coupons ── */
function CouponsTab() {
  const [copied, setCopied] = useState(null);
  return (
    <div className="space-y-3">
      {MOCK_COUPONS.map((c) => {
        const inactive = c.state !== "active";
        return (
          <div key={c.code} className={`flex flex-wrap items-center gap-4 rounded-card border border-dashed p-4 ${inactive ? "border-black/10 bg-neutral-50 opacity-60" : "border-brand/40 bg-brand-softer/40"}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-ink">{c.code}</span>
                {c.state === "expired" && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">EXPIRED</span>}
                {c.state === "used" && <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600">USED</span>}
              </div>
              <p className="mt-0.5 text-[13px] text-neutral-600">{c.desc}</p>
              <p className="text-[12px] text-neutral-400">Min order {c.min ? formatINR(c.min) : "—"} · Expires {c.expiry}</p>
            </div>
            {!inactive && (
              <button
                onClick={() => { navigator.clipboard?.writeText(c.code); setCopied(c.code); setTimeout(() => setCopied(null), 1500); }}
                className="rounded-full bg-brand px-4 py-2 text-[12px] font-bold text-white hover:bg-brand-dark"
              >
                {copied === c.code ? "Copied ✓" : "Copy Code"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Addresses ── */
function AddressesTab() {
  const [list, setList] = useState(MOCK_ADDRESSES);
  const [adding, setAdding] = useState(false);
  const atMax = list.length >= 5;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((a) => (
          <div key={a.id} className="rounded-card border border-black/5 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-ink">{a.name}</p>
              {a.default && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">DEFAULT</span>}
            </div>
            <p className="mt-1.5 text-[13px] text-neutral-500">{a.line1}, {a.line2}, {a.city}, {a.state} — {a.pincode}</p>
            <p className="mt-1 text-[13px] text-neutral-500">{a.phone}</p>
            <div className="mt-3 flex gap-2">
              <button className="rounded-full border border-black/10 px-3.5 py-1.5 text-[12px] font-bold text-ink hover:border-brand hover:text-brand">Edit</button>
              <button onClick={() => setList((l) => l.filter((x) => x.id !== a.id))} className="rounded-full border border-black/10 px-3.5 py-1.5 text-[12px] font-bold text-red-600 hover:border-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="grid gap-4 rounded-card border border-black/5 bg-white p-5 shadow-card sm:grid-cols-2">
          <input className="rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none" placeholder="Full name" />
          <input className="rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none" placeholder="Phone" />
          <input className="rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none sm:col-span-2" placeholder="Address line 1" />
          <input className="rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none sm:col-span-2" placeholder="Address line 2" />
          <input className="rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none" placeholder="City" />
          <input className="rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none" placeholder="Pincode" />
          <select className="rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none sm:col-span-2" defaultValue="Karnataka">
            {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="flex gap-2 sm:col-span-2">
            <button onClick={() => setAdding(false)} className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Save Address</button>
            <button onClick={() => setAdding(false)} className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold text-ink">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          disabled={atMax}
          className="rounded-full border-2 border-dashed border-brand/40 px-5 py-2.5 text-sm font-bold text-brand hover:bg-brand-softer/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add New Address
        </button>
      )}
      {atMax && <p className="text-[12px] text-neutral-400">You can save up to 5 addresses.</p>}
    </div>
  );
}

/* ── Profile ── */
function ProfileTab({ onLogout }) {
  return (
    <div className="max-w-md rounded-card border border-black/5 bg-white p-6 shadow-card">
      <dl className="space-y-4 text-sm">
        <div><dt className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Name</dt><dd className="mt-0.5 font-semibold text-ink">{MOCK_PROFILE.name}</dd></div>
        <div><dt className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Email</dt><dd className="mt-0.5 font-semibold text-ink">{MOCK_PROFILE.email}</dd></div>
        <div><dt className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Phone</dt><dd className="mt-0.5 font-semibold text-ink">{MOCK_PROFILE.phone}</dd></div>
      </dl>
      <button className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Edit Profile</button>
    </div>
  );
}

export default function AccountView() {
  const { ready, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") || "orders");

  // gate: redirect to login if not authenticated
  useEffect(() => {
    if (ready && !isLoggedIn) router.replace("/login?next=/account");
  }, [ready, isLoggedIn, router]);

  if (!ready || !isLoggedIn) return <div className="py-24 text-center text-sm text-neutral-400">Loading…</div>;

  const doLogout = () => { logout(); router.push("/"); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="section-heading">My Account</h1>

      <div className="mt-8 gap-8 lg:grid lg:grid-cols-[230px_1fr]">
        {/* sidebar (desktop) / horizontal scroll (mobile) */}
        <aside className="lg:self-start">
          <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-left text-sm font-semibold transition-colors lg:rounded-lg ${
                  tab === t.id ? "bg-brand text-white" : "text-neutral-600 hover:bg-brand-softer hover:text-brand"
                }`}
              >
                {t.label}
              </button>
            ))}
            <button onClick={doLogout} className="mt-2 hidden shrink-0 rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 lg:block">
              Logout
            </button>
          </nav>
        </aside>

        {/* content */}
        <div className="mt-6 lg:mt-0">
          {tab === "orders" && <OrdersTab />}
          {tab === "coupons" && <CouponsTab />}
          {tab === "addresses" && <AddressesTab />}
          {tab === "profile" && <ProfileTab onLogout={doLogout} />}

          {/* mobile logout */}
          <button onClick={doLogout} className="mt-8 w-full rounded-full border border-red-200 py-3 text-sm font-bold text-red-600 lg:hidden">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
