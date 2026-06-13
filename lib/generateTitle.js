// Auto-generated SEO product titles. Pure (no imports) so it works on both the
// server (metadata, JSON-LD) and the client (alt text). Admin can override via
// product.seoTitle — if set, it wins.
//
// NOTE on data completeness: laptops/desktops/workstations carry structured
// attrs (processor, gen, screen, os, formFactor). Monitors currently only have
// `screen` (resolution/panel live in the free-text specs string, not as fields),
// and servers lack a chassis/os field. The generator SKIPS any missing part, so
// those categories produce shorter titles until structured attrs are added — the
// seoTitle override exists exactly for that case.

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Model = product name with the brand prefix stripped (e.g. "Lenovo ThinkPad
// T480" → "ThinkPad T480"). Falls back to the full name.
function modelOf(product) {
  const brand = product.brand || "";
  const name = product.model || product.name || "";
  if (!brand) return name.trim();
  return name.replace(new RegExp("^" + escapeRe(brand) + "\\s*", "i"), "").trim() || name.trim();
}

// "Intel i7" → "Core i7"; "AMD Ryzen 5" → "Ryzen 5"; "Apple M1"/"Xeon Silver"/
// "Xeon W" pass through. Produces the "Core i5" form the spec asks for.
export function cpuFamily(processor) {
  if (!processor) return "";
  const p = String(processor).trim();
  const m = p.match(/\bi([3579])\b/i);
  if (m) return `Core i${m[1]}`;
  return p.replace(/^AMD\s+/i, "").trim();
}

// "[CPU Family] [Gen]" e.g. "Core i5 8th Gen". Drops a redundant Apple gen
// (processor "Apple M1" already carries the generation).
function cpuGen(a = {}) {
  const fam = cpuFamily(a.processor);
  const gen = a.gen && !/apple/i.test(a.gen) && a.gen !== fam ? a.gen : "";
  return [fam, gen].filter(Boolean).join(" ");
}

// Screen + optional "Touch". Skips Touch when touchscreen is false/undefined.
function screenTouch(a = {}) {
  return [a.screen, a.touchscreen ? "Touch" : ""].filter(Boolean).join(" ");
}

// Append a category word ("Monitor"/"Server"/"Workstation") only if the name
// doesn't already contain it, to avoid "... Monitor Monitor".
function withWord(base, word) {
  return new RegExp("\\b" + word + "\\b", "i").test(base) ? base : `${base} ${word}`;
}

const osOf = (a = {}) => (a.os && a.os !== "No OS" ? a.os : "");

// "1920×1080 FHD" → "FHD"; "3440×1440 UltraWide QHD" → "UltraWide QHD";
// "2560×1600" (no label) → "2560×1600". Used for compact monitor titles.
function resShort(res) {
  if (!res) return "";
  const m = String(res).match(/^\s*\d+\s*[x×]\s*\d+\s*(.*)$/i);
  return (m && m[1].trim()) || String(res).trim();
}

/* Returns the SEO title for a product. seoTitle override wins; otherwise builds
   a "Refurbished …" pipe-delimited title per category, skipping missing parts. */
export function generateProductTitle(product) {
  if (!product) return "";
  if (product.seoTitle && String(product.seoTitle).trim()) return String(product.seoTitle).trim();

  const a = product.attrs || {};
  const brand = product.brand || "";
  const model = modelOf(product);
  const base = `Refurbished ${brand} ${model}`.replace(/\s+/g, " ").trim();
  const cg = cpuGen(a);
  const os = osOf(a);
  const parts = [];

  switch (product.category) {
    case "Laptops":
      parts.push(base, cg, screenTouch(a), os);
      break;
    case "Desktops":
      parts.push(base, cg, a.formFactor || "", os);
      break;
    case "Monitors":
      parts.push(withWord(base, "Monitor"), [a.screen, resShort(a.resolution)].filter(Boolean).join(" "), a.panel || "");
      break;
    case "Servers":
      parts.push(withWord(base, "Server"), cpuFamily(a.processor), a.formFactor || a.chassis || "", os);
      break;
    case "Workstations": {
      // Desktop workstation: chassis/model + processor + RAM(+ECC) + GPU. NO screen.
      // e.g. "Refurbished HP Z440 Workstation | Xeon E5-1620 | 32GB ECC | Quadro K2200"
      const cap = product.defaultRam?.capacity || (a.ram ? `${a.ram}GB` : "");
      const ecc = /ecc/i.test(a.ramType || "") ? " ECC" : "";
      const ramStr = cap ? `${cap}${ecc}` : "";
      parts.push(withWord(base, "Workstation"), a.processor || cpuFamily(a.processor), ramStr, a.gpu || "");
      break;
    }
    default:
      parts.push(base, cg, os);
  }

  return parts.filter((p) => p && String(p).trim()).join(" | ");
}
