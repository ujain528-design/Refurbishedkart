// SEO URL slug for a product. Pure (works on server + client). The slug is built
// from brand + model + the category's identifying specs, lowercase + hyphenated.
// Uniqueness (collision suffix) is handled DB-side in lib/server/slug.js — this
// module only produces the deterministic base slug.
import { cpuFamily } from "@/lib/generateTitle";

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* "Lenovo ThinkPad T480" → "ThinkPad T480" (brand prefix stripped). */
function modelOf(p) {
  const brand = p.brand || "";
  const name = p.model || p.name || "";
  if (!brand) return name.trim();
  return name.replace(new RegExp("^" + escapeRe(brand) + "\\s*", "i"), "").trim() || name.trim();
}

/* "1920×1080 FHD" → "FHD"; "3840×2160 4K" → "4K"; "2560×1600" → "2560x1600". */
function resShort(res) {
  if (!res) return "";
  const m = String(res).match(/\b(FHD|QHD|UHD|4K|2K|HD|WUXGA|UltraWide)\b/i);
  if (m) return m[1];
  const d = String(res).match(/(\d{3,4})\s*[x×]\s*(\d{3,4})/);
  return d ? `${d[1]}x${d[2]}` : String(res);
}

/* '24"' / "24 inch" → "24-inch". */
function sizeShort(screen) {
  if (!screen) return "";
  const m = String(screen).match(/([\d.]+)/);
  return m ? `${m[1]}-inch` : String(screen);
}

export function slugify(input) {
  return String(input ?? "")
    .toLowerCase()
    .normalize("NFKD").replace(/\p{Diacritic}/gu, "")  // strip accents
    .replace(/['’"]/g, "")                              // drop apostrophes/quotes
    .replace(/[^a-z0-9]+/g, "-")                        // non-alnum → hyphen
    .replace(/-{2,}/g, "-")                             // collapse repeats
    .replace(/^-+|-+$/g, "");                           // trim hyphens
}

/* Deterministic base slug for a product. Per-category identifying specs:
   Laptops      brand-model-processor-gen
   Desktops     brand-model-chassis-processor
   Monitors     brand-model-size-resolution
   Servers      brand-model-chassis-processor
   Workstations brand-model-processor-gpu */
export function productSlugBase(p) {
  if (!p) return "";
  const a = p.attrs || {};
  const brand = p.brand || "";
  const model = modelOf(p);
  const cpu = cpuFamily(a.processor);
  const gen = a.gen && !/apple/i.test(a.gen) ? a.gen : "";
  const formFactor = a.formFactor || a.chassis || "";
  const parts = [brand, model];

  switch (p.category) {
    case "Laptops":
      parts.push(cpu, gen);
      break;
    case "Desktops":
      parts.push(formFactor, cpu);
      break;
    case "Monitors":
      parts.push(sizeShort(a.screen), resShort(a.resolution));
      break;
    case "Servers":
      parts.push(formFactor, cpu);
      break;
    case "Workstations":
      parts.push(cpu, a.gpu || "");
      break;
    default:
      parts.push(cpu, gen);
  }

  const slug = slugify(parts.filter(Boolean).join("-"));
  // Never return empty (would break routing); fall back to brand-model, then id.
  return slug || slugify(`${brand} ${model}`) || (p.id ? `product-${p.id}` : "product");
}
