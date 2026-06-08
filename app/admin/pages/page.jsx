"use client";

import { useState } from "react";
import { PageHeader, Tabs, Toggle, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { ADMIN_PAGES } from "@/lib/admin-data";
import { NAV_CATEGORIES } from "@/lib/data";

export default function PagesNav() {
  const toast = useToast();
  const [tab, setTab] = useState("Static Pages");
  const [pages, setPages] = useState(ADMIN_PAGES);

  const FOOTER_COLS = ["Shop", "Company", "Support", "Business"];

  return (
    <div>
      <PageHeader title="Pages & Navigation" subtitle="Manage static content, footer, and header." />
      <Tabs tabs={["Static Pages", "Footer", "Header / Navbar"]} active={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === "Static Pages" && (
          <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
            <div className="flex justify-end p-3"><button onClick={() => toast("New page form opened")} className={btnPrimary}>+ Add New Page</button></div>
            <table className="w-full text-sm">
              <thead><tr className="border-y border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400"><th className="px-4 py-3">Slug</th><th className="px-3 py-3">Title</th><th className="px-3 py-3">Visible</th><th className="px-3 py-3">Actions</th></tr></thead>
              <tbody>
                {pages.map((p, i) => (
                  <tr key={p.slug} className={i % 2 ? "bg-neutral-50/60" : ""}>
                    <td className="px-4 py-3 font-mono text-[13px] text-neutral-500">/{p.slug}</td>
                    <td className="px-3 py-3 font-semibold text-ink">{p.title} {p.core && <span className="ml-1 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">CORE</span>}</td>
                    <td className="px-3 py-3"><Toggle on={p.visible} onChange={() => setPages((l) => l.map((x, j) => j === i ? { ...x, visible: !x.visible } : x))} /></td>
                    <td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => toast(`Editing ${p.title}`)} className="text-[13px] font-bold text-brand hover:underline">Edit</button>{!p.core && <button onClick={() => { setPages((l) => l.filter((x) => x.slug !== p.slug)); toast("Page deleted", "error"); }} className="text-[13px] font-bold text-red-600 hover:underline">Delete</button>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Footer" && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {FOOTER_COLS.map((col) => (
                <div key={col} className="rounded-card border border-black/5 bg-white p-4 shadow-card">
                  <p className="text-sm font-bold text-ink">{col}</p>
                  <div className="mt-2 space-y-2">
                    {["Link label", "Another link"].map((l, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="cursor-grab text-neutral-300">⠿</span>
                        <input className={inputCls} defaultValue={l} />
                        <input className={`${inputCls} max-w-[120px]`} placeholder="/url" />
                        <button className="text-[12px] font-bold text-red-600">✕</button>
                      </div>
                    ))}
                    <button onClick={() => toast("Link added")} className="text-[13px] font-bold text-brand hover:underline">+ Add Link</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-card border border-black/5 bg-white p-4 shadow-card">
              <p className="text-sm font-bold text-ink">Footer Info</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="GSTIN"><input className={inputCls} defaultValue="00AAAAA0000A1Z0" /></Field>
                <Field label="Phone"><input className={inputCls} defaultValue="+91 98765 43210" /></Field>
                <Field label="Address"><input className={inputCls} defaultValue="402, Brigade Gateway, Bengaluru" /></Field>
                <Field label="Email"><input className={inputCls} defaultValue="support@refurbishedkart.com" /></Field>
              </div>
            </div>
          </div>
        )}

        {tab === "Header / Navbar" && (
          <div className="space-y-4">
            <div className="rounded-card border border-black/5 bg-white p-4 shadow-card">
              <p className="text-sm font-bold text-ink">Announcement Bar</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Text"><input className={inputCls} placeholder="Free delivery above ₹999" /></Field>
                <Field label="Colour"><input type="color" defaultValue="#1B5E20" className="h-9 w-full rounded border border-black/10" /></Field>
                <Field label="Link"><input className={inputCls} placeholder="/products/laptops" /></Field>
              </div>
              <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand" /> Active</label>
            </div>
            <div className="rounded-card border border-black/5 bg-white p-4 shadow-card">
              <p className="text-sm font-bold text-ink">Mega Dropdown — Categories & Brands</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {NAV_CATEGORIES.map((c) => (
                  <div key={c.name} className="rounded-lg border border-black/10 p-3">
                    <p className="text-[13px] font-bold text-ink">{c.name}</p>
                    <p className="mt-1 text-[12px] text-neutral-400">{c.brands.length} brands</p>
                    <button onClick={() => toast(`Editing ${c.name} brands`)} className="mt-1 text-[12px] font-bold text-brand hover:underline">Manage brands</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="max-w-sm rounded-card border border-black/5 bg-white p-4 shadow-card">
              <Field label="WhatsApp Number (Bulk Enquiry)"><input className={inputCls} defaultValue="919876543210" /></Field>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
