"use client";

import { useState } from "react";
import { PageHeader, Badge, Toggle, useToast, inputCls, btnPrimary } from "@/components/admin/ui";
import { ADMIN_TAGS, HOMEPAGE_ROWS } from "@/lib/admin-data";

export default function TagsCollections() {
  const toast = useToast();
  const [tags, setTags] = useState(ADMIN_TAGS);
  const [rows, setRows] = useState(HOMEPAGE_ROWS);
  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (!newTag.trim()) return;
    setTags((t) => [...t, { name: newTag.trim(), type: "custom", count: 0, visible: true }]);
    setNewTag(""); toast("Tag created");
  };

  return (
    <div>
      <PageHeader title="Tags & Collections" subtitle="Curate homepage rows by tagging products." />
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tags */}
        <div className="rounded-card border border-black/5 bg-white shadow-card">
          <div className="border-b border-black/5 px-5 py-3.5"><h2 className="text-sm font-bold text-ink">Tags</h2></div>
          <div className="divide-y divide-black/5">
            {tags.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3 px-5 py-3">
                <span className="flex-1 text-sm font-semibold text-ink">{t.name}</span>
                <Badge>{t.type}</Badge>
                <span className="text-[12px] text-neutral-400">{t.count} products</span>
                <Toggle on={t.visible} onChange={() => setTags((l) => l.map((x, j) => j === i ? { ...x, visible: !x.visible } : x))} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-black/5 p-3">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New custom tag…" className={inputCls} />
            <button onClick={addTag} className={btnPrimary}>Add</button>
          </div>
        </div>

        {/* Homepage Rows */}
        <div className="rounded-card border border-black/5 bg-white shadow-card">
          <div className="border-b border-black/5 px-5 py-3.5"><h2 className="text-sm font-bold text-ink">Homepage Rows</h2></div>
          <div className="divide-y divide-black/5">
            {rows.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3 px-5 py-3">
                <span className="cursor-grab text-neutral-300">⠿</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{r.name}</p>
                  <p className="text-[12px] text-neutral-400">tag: {r.tag} · {r.count} products</p>
                </div>
                <Toggle on={r.visible} onChange={() => setRows((l) => l.map((x, j) => j === i ? { ...x, visible: !x.visible } : x))} />
              </div>
            ))}
          </div>
          <p className="border-t border-black/5 px-5 py-3 text-[12px] text-neutral-400">Drag rows to reorder — updates homepage instantly.</p>
        </div>
      </div>
    </div>
  );
}
