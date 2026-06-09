"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader, Toggle, Field, useToast, inputCls, btnPrimary } from "@/components/admin/ui";
import { adminGetSettings, adminSaveSettings } from "@/lib/api";

export default function Settings() {
  const toast = useToast();
  const { isSuperAdmin, user } = useAuth();
  const [s, setS] = useState(null);
  const [status, setStatus] = useState("loading");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    adminGetSettings().then((d) => { setS(d); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setSaving(true);
    try { const next = await adminSaveSettings(s); setS(next); toast("Settings saved"); }
    catch (e) { toast(e.message || "Save failed", "error"); }
    finally { setSaving(false); }
  };

  if (status === "loading") return <div><PageHeader title="Settings" subtitle="Store configuration." /><p className="py-16 text-center text-sm text-neutral-400">Loading…</p></div>;
  if (status === "error") return (
    <div><PageHeader title="Settings" subtitle="Store configuration." />
      <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card"><p className="text-sm font-semibold text-neutral-600">Couldn't load settings.</p><button onClick={load} className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Retry</button></div>
    </div>
  );

  const cod = s.codEnabled !== false;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Store configuration." />
      <div className="max-w-2xl space-y-6">
        <div className="rounded-card border border-black/5 bg-white p-5 shadow-card">
          <h2 className="text-sm font-bold text-ink">Store</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Store Name"><input className={inputCls} value={s.storeName || ""} onChange={(e) => set("storeName", e.target.value)} /></Field>
            <Field label="GSTIN"><input className={inputCls} value={s.gstin || ""} onChange={(e) => set("gstin", e.target.value)} /></Field>
            <Field label="Support Phone"><input className={inputCls} value={s.supportPhone || ""} onChange={(e) => set("supportPhone", e.target.value)} /></Field>
            <Field label="Support Email"><input className={inputCls} value={s.supportEmail || ""} onChange={(e) => set("supportEmail", e.target.value)} /></Field>
            <Field label="WhatsApp Number"><input className={inputCls} value={s.whatsappNumber || ""} onChange={(e) => set("whatsappNumber", e.target.value)} /></Field>
            <Field label="Low Stock Threshold"><input type="number" className={inputCls} value={s.lowStockThreshold ?? 5} onChange={(e) => set("lowStockThreshold", Number(e.target.value))} /></Field>
            <Field label="Free Delivery Above (₹)"><input type="number" className={inputCls} value={s.freeDeliveryAbove ?? 999} onChange={(e) => set("freeDeliveryAbove", Number(e.target.value))} /></Field>
            <Field label="Delivery Fee Below (₹)"><input type="number" className={inputCls} value={s.deliveryFee ?? 99} onChange={(e) => set("deliveryFee", Number(e.target.value))} /></Field>
          </div>
          <div className="mt-4 grid gap-4 rounded-lg bg-neutral-50 p-4 sm:grid-cols-2">
            <div className="flex items-center justify-between sm:col-span-2"><span className="text-sm font-semibold text-ink">Cash on Delivery</span><Toggle on={cod} onChange={(v) => set("codEnabled", v)} /></div>
            <Field label="COD Max Order Value (₹)"><input type="number" className={inputCls} value={s.codLimit ?? 29999} onChange={(e) => set("codLimit", Number(e.target.value))} disabled={!cod} /></Field>
          </div>
          <div className="mt-4 rounded-lg bg-neutral-50 p-4">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-ink">Announcement bar</span><Toggle on={s.announcementActive !== false} onChange={(v) => set("announcementActive", v)} /></div>
            <Field label="Announcement Text"><input className={`${inputCls} mt-2`} value={s.announcementText || ""} onChange={(e) => set("announcementText", e.target.value)} /></Field>
          </div>
          <button onClick={save} disabled={saving} className={`${btnPrimary} mt-4`}>{saving ? "Saving…" : "Save Settings"}</button>
        </div>

        {isSuperAdmin && (
          <div className="rounded-card border border-black/5 bg-white p-5 shadow-card">
            <h2 className="text-sm font-bold text-ink">Admin Access</h2>
            <p className="mt-2 text-[13px] text-neutral-500">Admin role is granted to the email set in <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-[12px]">ADMIN_EMAIL</code> (.env) on Google sign-in. You're signed in as <span className="font-semibold text-ink">{user?.email || "—"}</span> ({user?.role || "—"}). Managing additional admins from the UI needs a users-admin endpoint (not built yet).</p>
          </div>
        )}
      </div>
    </div>
  );
}
