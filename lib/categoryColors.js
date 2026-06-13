// Category color identity for the storefront. Keyed by category — accepts either
// the slug ("laptops") or the display name ("Laptops"); non-alpha is stripped so
// "Workstations" / "work-stations" both resolve. Admin panel never uses this.
export const CATEGORY_COLORS = {
  laptops: { color: "#2D5016", light: "#EDF2E8" }, // forest green
  desktops: { color: "#1E4A6D", light: "#E6EEF4" }, // deep blue
  monitors: { color: "#5B3A7E", light: "#EFE9F4" }, // plum purple
  servers: { color: "#B5532A", light: "#F7EAE3" }, // burnt orange
  workstations: { color: "#1A6B5E", light: "#E5F0ED" }, // teal
};

const FALLBACK = { color: "#2D5016", light: "#EDF2E8" };

export function categoryColor(catSlugOrName) {
  if (!catSlugOrName) return FALLBACK;
  const k = String(catSlugOrName).toLowerCase().replace(/[^a-z]/g, "");
  return CATEGORY_COLORS[k] || FALLBACK;
}

// Rotating palette for accents that aren't tied to a single category
// (trust stats, eyebrows, footer social, budget cards).
export const PALETTE = [
  { color: "#2D5016", light: "#EDF2E8" }, // green
  { color: "#1E4A6D", light: "#E6EEF4" }, // blue
  { color: "#5B3A7E", light: "#EFE9F4" }, // purple
  { color: "#B5532A", light: "#F7EAE3" }, // orange
  { color: "#1A6B5E", light: "#E5F0ED" }, // teal
];

export const paletteAt = (i) => PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length];
