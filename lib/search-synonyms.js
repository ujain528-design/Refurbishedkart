// Search synonym map — plain module, safe on server and client.
// Each key is a lowercase search term; value maps to a category and optional
// formFactor / brand filter. Seeded into MasterData (tableName: search_synonyms)
// and used by /api/products/search before falling back to fuzzy text search.

export const SEARCH_SYNONYMS = {
  tft: { category: "Monitors" },
  lcd: { category: "Monitors" },
  display: { category: "Monitors" },
  pc: { category: "Desktops" },
  computer: { category: "Desktops" },
  "desktop computer": { category: "Desktops" },
  tower: { category: "Desktops", formFactor: "Tower" },
  aio: { category: "Desktops", formFactor: "All-in-One" },
  "all-in-one": { category: "Desktops", formFactor: "All-in-One" },
  notebook: { category: "Laptops" },
  macbook: { category: "Laptops", brand: "Apple" },
  "server rack": { category: "Servers" },
  "rack server": { category: "Servers" },
  "workstation pc": { category: "Workstations" },
};

export function matchSynonym(q) {
  const key = String(q || "").trim().toLowerCase();
  return SEARCH_SYNONYMS[key] || null;
}

// Row form for the MasterData collection.
export const synonymRows = () =>
  Object.entries(SEARCH_SYNONYMS).map(([term, m]) => ({ term, ...m }));
