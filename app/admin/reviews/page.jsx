"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, Badge, Toggle, useToast } from "@/components/admin/ui";
import { adminGetReviews, adminApproveReview, adminRejectReview, adminFeatureReview } from "@/lib/api";

const Stars = ({ n }) => <span className="text-amber-400">{"★".repeat(n)}<span className="text-neutral-300">{"★".repeat(5 - n)}</span></span>;

export default function Reviews() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [status, setStatus] = useState("loading");
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    setStatus("loading");
    adminGetReviews().then((r) => { setList(r); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = list.filter((r) => filter === "all" || r.status === filter).sort((a) => (a.status === "pending" ? -1 : 1));
  const patch = (id, fields) => setList((l) => l.map((r) => (r.id === id ? { ...r, ...fields } : r)));

  const approve = async (id) => { try { await adminApproveReview(id); patch(id, { status: "approved" }); toast("Approved"); } catch (e) { toast(e.message, "error"); } };
  const reject = async (id) => { try { await adminRejectReview(id); patch(id, { status: "rejected", featured: false }); toast("Rejected", "error"); } catch (e) { toast(e.message, "error"); } };
  const feature = async (id, v) => { try { await adminFeatureReview(id, v); patch(id, { featured: v }); } catch (e) { toast(e.message, "error"); } };

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate customer reviews — pending first." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-[13px] font-semibold capitalize ${filter === f ? "bg-brand text-white" : "border border-black/10 text-ink"}`}>{f}</button>
        ))}
      </div>

      {status === "loading" ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading reviews…</p>
      ) : status === "error" ? (
        <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-neutral-600">Couldn't load reviews.</p>
          <button onClick={load} className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Retry</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Product</th><th className="px-3 py-3">Reviewer</th><th className="px-3 py-3">Rating</th><th className="px-3 py-3">Review</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Featured</th><th className="px-3 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-neutral-400">No reviews.</td></tr>}
              {rows.map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                  <td className="px-4 py-3 font-semibold text-ink">{r.productName}</td>
                  <td className="px-3 py-3 text-neutral-600">{r.reviewer}</td>
                  <td className="px-3 py-3"><Stars n={r.rating} /></td>
                  <td className="px-3 py-3 max-w-[220px] text-[12px] text-neutral-500">
                    {r.title && <p className="font-semibold text-ink">{r.title}</p>}
                    <p className="truncate" title={r.text}>{r.text}</p>
                    {Array.isArray(r.images) && r.images.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {r.images.map((src, k) => (
                          <a key={k} href={src} target="_blank" rel="noopener noreferrer" className="block h-12 w-12 overflow-hidden rounded border border-black/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Review photo ${k + 1}`} className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3"><Badge>{r.status}</Badge></td>
                  <td className="px-3 py-3">{r.status === "approved" ? <Toggle on={!!r.featured} onChange={(v) => feature(r.id, v)} /> : <span className="text-neutral-300">—</span>}</td>
                  <td className="px-3 py-3">
                    {r.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => approve(r.id)} className="text-[13px] font-bold text-brand hover:underline">Approve</button>
                        <button onClick={() => reject(r.id)} className="text-[13px] font-bold text-red-600 hover:underline">Reject</button>
                      </div>
                    ) : <span className="text-[12px] text-neutral-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
