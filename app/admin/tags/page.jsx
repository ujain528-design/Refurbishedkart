"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, Badge, Toggle, useToast, inputCls, btnPrimary } from "@/components/admin/ui";
import { HOMEPAGE_ROWS } from "@/lib/admin-data";
import { adminGetTags, adminCreateTag, adminUpdateTag } from "@/lib/api";

export default function TagsCollections() {
  const toast = useToast();
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState("loading");
  const [rows, setRows] = useState(HOMEPAGE_ROWS); // homepage rows stay local (no endpoint)
  const [newTag, setNewTag] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    adminGetTags().then((t) => { setTags(t); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const addTag = async () => {
    if (!newTag.trim()) return;
    setBusy(true);
    try { const t = await adminCreateTag({ name: newTag.trim(), type: "custom" }); setTags((l) => [...l, t]); setNewTag(""); toast("Tag created"); }
    catch (e) { toast(e.message || "Couldn't create tag", "error"); }
    finally { setBusy(false); }
  };
  const toggleVisible = async (t) => {
    try { await adminUpdateTag(t.id, { visible: !t.visible }); setTags((l) => l.map((x) => (x.id === t.id ? { ...x, visible: !t.visible } : x))); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <PageHeader title="Tags & Collections" subtitle="Curate homepage rows by tagging products." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-black/5 bg-white shadow-card">
          <div className="border-b border-black/5 px-5 py-3.5"><h2 className="text-sm font-bold text-ink">Tags</h2></div>
          {status === "loading" ? (
            <p className="px-5 py-10 text-center text-sm text-neutral-400">Loading…</p>
          ) : status === "error" ? (
            <div className="px-5 py-10 text-center"><p className="text-sm text-neutral-500">Couldn't load tags.</p><button onClick={load} className="mt-3 rounded-full bg-brand px-5 py-2 text-[13px] font-bold text-white">Retry</button></div>
          ) : (
            <div className="divide-y divide-black/5">
              {tags.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex-1 text-sm font-semibold text-ink">{t.name}</span>
                  <Badge>{t.type}</Badge>
                  <Toggle on={t.visible} onChange={() => toggleVisible(t)} />
                </div>
              ))}
              {tags.length === 0 && <p className="px-5 py-8 text-center text-sm text-neutral-400">No tags yet.</p>}
            </div>
          )}
          <div className="flex gap-2 border-t border-black/5 p-3">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New custom tag…" className={inputCls} />
            <button onClick={addTag} disabled={busy} className={btnPrimary}>{busy ? "…" : "Add"}</button>
          </div>
        </div>

        <div className="rounded-card border border-black/5 bg-white shadow-card">
          <div className="border-b border-black/5 px-5 py-3.5"><h2 className="text-sm font-bold text-ink">Homepage Rows</h2></div>
          <div className="divide-y divide-black/5">
            {rows.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3 px-5 py-3">
                <span className="cursor-grab text-neutral-300">⠿</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{r.name}</p>
                  <p className="text-[12px] text-neutral-400">tag: {r.tag}</p>
                </div>
                <Toggle on={r.visible} onChange={() => setRows((l) => l.map((x, j) => (j === i ? { ...x, visible: !x.visible } : x)))} />
              </div>
            ))}
          </div>
          <p className="border-t border-black/5 px-5 py-3 text-[12px] text-neutral-400">Homepage-row config is local for now (no dedicated endpoint yet).</p>
        </div>
      </div>
    </div>
  );
}
