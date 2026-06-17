import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

// Official manufacturer domains — results from these sort to the front.
const MANUFACTURER_DOMAINS = [
  "dell.com", "hp.com", "lenovo.com", "asus.com", "acer.com",
  "samsung.com", "lg.com", "microsoft.com",
];
const isManufacturer = (domain) => {
  const d = String(domain || "").toLowerCase();
  return MANUFACTURER_DOMAINS.some((m) => d === m || d.endsWith(`.${m}`));
};
const domainOf = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/* One DuckDuckGo image search → up to ~50 normalised results. Self-contained and
   never throws (returns [] on any failure) so Promise.all over several queries is
   resilient to a single query being blocked. */
async function ddgSearch(query) {
  try {
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      { headers: { "User-Agent": UA, Accept: "text/html" }, cache: "no-store" }
    );
    const html = await tokenRes.text();
    const vqd = html.match(/vqd=['"]([^'"]+)['"]/)?.[1] || html.match(/vqd=([\d-]+)/)?.[1];
    if (!vqd) return [];

    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(vqd)}&f=,,,,,&p=1&v7exp=a`,
      { headers: { "User-Agent": UA, Referer: "https://duckduckgo.com/", Accept: "application/json" }, cache: "no-store" }
    );
    if (!imgRes.ok) return [];
    const data = await imgRes.json().catch(() => null);
    if (!data || !Array.isArray(data.results)) return [];

    return data.results.slice(0, 50).map((r) => ({
      url: r.image,
      thumbnail: r.thumbnail || r.image,
      title: r.title || "",
      source: domainOf(r.url),
    })).filter((x) => x.url);
  } catch {
    return [];
  }
}

/* Interleave by source so no single domain dominates consecutive slots — gives
   "variety of sources" ordering within a group. */
function diversifyBySource(list) {
  const bySource = new Map();
  for (const x of list) {
    const k = x.source || "";
    if (!bySource.has(k)) bySource.set(k, []);
    bySource.get(k).push(x);
  }
  const queues = [...bySource.values()];
  const out = [];
  let added = true;
  while (added) {
    added = false;
    for (const q of queues) { if (q.length) { out.push(q.shift()); added = true; } }
  }
  return out;
}

/* POST { modelName } — runs five angle-specific DuckDuckGo searches in parallel,
   merges + de-duplicates them, and returns up to 20 varied images. Admin-only.
   Always returns { images: [...] }; never throws. */
export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;

  try {
    const { modelName } = await req.json();
    const model = String(modelName || "").trim();
    if (!model) return NextResponse.json({ images: [] });

    // Different angles → genuinely different shots, not the same image repeated.
    const queries = [
      `${model} front view`,
      `${model} side ports`,
      `${model} official product`,
      `${model} keyboard touchpad`,
      `${model} white background`,
    ];

    const batches = await Promise.all(queries.map((q) => ddgSearch(q)));
    const combined = batches.flat();

    // De-duplicate by exact URL, then by source+title (drops near-identical re-uploads).
    const seenUrl = new Set();
    const seenKey = new Set();
    const unique = [];
    for (const img of combined) {
      const key = `${img.source}|${img.title.trim().toLowerCase()}`;
      if (seenUrl.has(img.url)) continue;
      if (img.title && seenKey.has(key)) continue;
      seenUrl.add(img.url);
      if (img.title) seenKey.add(key);
      unique.push(img);
    }

    // Manufacturer domains first; source variety within each group.
    const manufacturers = diversifyBySource(unique.filter((x) => isManufacturer(x.source)));
    const others = diversifyBySource(unique.filter((x) => !isManufacturer(x.source)));
    const images = [...manufacturers, ...others].slice(0, 20);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
