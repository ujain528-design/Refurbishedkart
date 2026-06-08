"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader, Toggle, Field, Modal, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { ADMIN_USERS } from "@/lib/admin-data";

export default function Settings() {
  const toast = useToast();
  const { isSuperAdmin } = useAuth();
  const [cod, setCod] = useState(true);
  const [users, setUsers] = useState(ADMIN_USERS);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Store configuration." />

      <div className="max-w-2xl space-y-6">
        {/* store settings */}
        <div className="rounded-card border border-black/5 bg-white p-5 shadow-card">
          <h2 className="text-sm font-bold text-ink">Store</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Store Name"><input className={inputCls} defaultValue="RefurbishedKart" /></Field>
            <Field label="GSTIN"><input className={inputCls} defaultValue="00AAAAA0000A1Z0" /></Field>
            <Field label="Phone"><input className={inputCls} defaultValue="+91 98765 43210" /></Field>
            <Field label="Email"><input className={inputCls} defaultValue="support@refurbishedkart.com" /></Field>
            <div className="sm:col-span-2"><Field label="Address"><input className={inputCls} defaultValue="402, Brigade Gateway, Rajajinagar, Bengaluru, KA — 560055" /></Field></div>
            <Field label="Default GST Rate (%)"><input type="number" className={inputCls} defaultValue={18} /></Field>
            <Field label="Free Delivery Threshold (₹)"><input type="number" className={inputCls} defaultValue={999} /></Field>
            <Field label="Delivery Charge Below Threshold (₹)"><input type="number" className={inputCls} defaultValue={99} /></Field>
            <Field label="Low Stock Threshold"><input type="number" className={inputCls} defaultValue={5} /></Field>
          </div>
          <div className="mt-4 grid gap-4 rounded-lg bg-neutral-50 p-4 sm:grid-cols-2">
            <div className="flex items-center justify-between sm:col-span-2"><span className="text-sm font-semibold text-ink">Cash on Delivery</span><Toggle on={cod} onChange={setCod} /></div>
            <Field label="COD Max Order Value (₹)"><input type="number" className={inputCls} defaultValue={29999} disabled={!cod} /></Field>
            <Field label="COD Advance Amount (₹)"><input type="number" className={inputCls} defaultValue={500} disabled={!cod} /></Field>
          </div>
          <button onClick={() => toast("Settings saved")} className={`${btnPrimary} mt-4`}>Save Settings</button>
        </div>

        {/* admin users (superadmin only) */}
        {isSuperAdmin && (
          <div className="rounded-card border border-black/5 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Admin Users</h2>
              <button onClick={() => setAdding(true)} className={btnPrimary}>+ Add Admin</button>
            </div>
            <div className="mt-3 divide-y divide-black/5">
              {users.map((u) => (
                <div key={u.email} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{u.name}</p><p className="text-[12px] text-neutral-400">{u.email}</p></div>
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold uppercase text-brand">{u.role}</span>
                  {u.role !== "superadmin" && <button onClick={() => { setUsers((l) => l.filter((x) => x.email !== u.email)); toast("Admin removed", "error"); }} className="text-[13px] font-bold text-red-600 hover:underline">Remove</button>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {adding && (
        <Modal title="Add Admin" onClose={() => setAdding(false)}
          footer={<><button onClick={() => setAdding(false)} className={btnGhost}>Cancel</button><button onClick={() => { setAdding(false); toast("Admin added"); }} className={btnPrimary}>Add</button></>}>
          <div className="space-y-3">
            <Field label="Name"><input className={inputCls} /></Field>
            <Field label="Email"><input type="email" className={inputCls} /></Field>
            <Field label="Role"><select className={inputCls}><option>admin</option><option>superadmin</option></select></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
