// Auto-generated 155-char meta descriptions. Pure (no imports) so it runs on
// server + client. Admin override via product.seoDescription.
import { cpuFamily } from "@/lib/generateTitle";

const inr = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");

// Normalize "6 Months" → "6-month", "1 Year" → "12-month", "2 Years" → "24-month".
function warrantyPhrase(w) {
  if (!w) return "";
  const s = String(w);
  const num = parseInt(s, 10);
  if (!num) return "";
  const months = /year|yr/i.test(s) ? num * 12 : num;
  return `${months}-month warranty`;
}

function shortSpecs(a = {}) {
  const fam = cpuFamily(a.processor);
  const cg = [fam, a.gen && !/apple/i.test(a.gen) && a.gen !== fam ? a.gen : ""].filter(Boolean).join(" ");
  const screen = [a.screen, a.touchscreen ? "Touch" : ""].filter(Boolean).join(" ");
  return [cg, screen].filter(Boolean).slice(0, 2).join(", ");
}

function truncate(str, max = 155) {
  if (str.length <= max) return str;
  const cut = str.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max - 25 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/* Returns a ≤155-char meta description. seoDescription override wins; otherwise
   builds "Buy Refurbished [Brand] [Model] at ₹[price]. [specs]. GST invoice |
   7-day returns | [warranty]. Free delivery across India." */
export function generateMetaDescription(product) {
  if (!product) return "";
  if (product.seoDescription && String(product.seoDescription).trim()) {
    return truncate(String(product.seoDescription).trim());
  }

  const a = product.attrs || {};
  const brand = product.brand || "";
  const name = product.model || product.name || "";
  const model = brand ? name.replace(new RegExp("^" + brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*", "i"), "").trim() || name : name;
  const shortTitle = `Refurbished ${brand} ${model}`.replace(/\s+/g, " ").trim();
  const price = inr(product.listedPrice ?? product.price);
  const specs = shortSpecs(a);
  const warranty = warrantyPhrase(a.warranty);

  let desc = `Buy ${shortTitle} at ${price}.`;
  if (specs) desc += ` ${specs}.`;
  desc += ` GST invoice | 7-day returns${warranty ? ` | ${warranty}` : ""}. Free delivery across India.`;
  return truncate(desc, 155);
}
