// Search synonym/abbreviation mapping + query logic (Session 8 FIX 1).
// Before text-matching, an abbreviation can expand a query to a whole category
// (optionally narrowed by brand or form factor).

import { ALL_PRODUCTS } from "@/lib/data";

/* Each synonym maps to: { category, brand?, formFactor? }
   Keys are matched case-insensitively against the full trimmed query. */
export const SYNONYMS = {
  // monitors
  tft: { category: "Monitors" },
  lcd: { category: "Monitors" },
  display: { category: "Monitors" },
  // desktops — category level
  pc: { category: "Desktops" },
  computer: { category: "Desktops" },
  "desktop computer": { category: "Desktops" },
  aio: { category: "Desktops", formFactor: "All-in-One" },
  "all-in-one": { category: "Desktops", formFactor: "All-in-One" },
  "all in one": { category: "Desktops", formFactor: "All-in-One" },
  tower: { category: "Desktops", formFactor: "Tower" },
  // laptops
  notebook: { category: "Laptops" },
  macbook: { category: "Laptops", brand: "Apple" },
  // servers
  "server rack": { category: "Servers" },
  "rack server": { category: "Servers" },
  // workstations
  "workstation pc": { category: "Workstations" },
};

const textMatch = (product, tokens) => {
  const hay = [product.name, product.brand, product.category, product.specs, product.attrs.processor, product.attrs.gen]
    .filter(Boolean).join(" ").toLowerCase();
  return tokens.every((t) => hay.includes(t));
};

const synonymMatch = (product, syn) =>
  product.category === syn.category &&
  (!syn.brand || product.brand === syn.brand) &&
  (!syn.formFactor || product.attrs.formFactor === syn.formFactor);

/* Returns { results, synonym } — synonym is the matched mapping (or null),
   useful for showing a "showing Monitors for TFT" note. */
export function searchProducts(query) {
  const q = (query || "").trim();
  if (!q) return { results: [], synonym: null };

  const syn = SYNONYMS[q.toLowerCase()] || null;
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  // Category+formFactor synonyms (AIO, Tower) are EXCLUSIVE — only the filtered
  // set, never unioned with text matches (e.g. a "…Tower" workstation must not
  // leak into a Tower-desktop search). Category-level synonyms union with text.
  const exclusive = !!syn?.formFactor;

  const seen = new Set();
  const results = [];
  for (const p of ALL_PRODUCTS) {
    const match = exclusive
      ? synonymMatch(p, syn)
      : (syn && synonymMatch(p, syn)) || textMatch(p, tokens);
    if (match && !seen.has(p.id)) {
      seen.add(p.id);
      results.push(p);
    }
  }
  return { results, synonym: syn };
}
