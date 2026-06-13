import { CATEGORY_SLUGS } from "@/lib/data";
import { queryProducts } from "@/lib/server/products";

const BASE = "https://refurbishedkart.com";

/* Dynamic sitemap (Next.js App Router). Served at /sitemap.xml.
   Includes the homepage, static pages, every category, and every non-draft
   product (fetched from the DB). If the DB is unreachable at request time it
   still returns the static + category URLs rather than failing. */
export default async function sitemap() {
  const now = new Date();

  const staticUrls = [
    "",            // homepage
    "/about",
    "/contact",
    "/privacy-policy",
    "/return-policy",
    "/warranty",
    "/terms",
    "/search",
    "/flash-sale",
  ].map((path) => ({ url: `${BASE}${path}`, lastModified: now, changeFrequency: "weekly", priority: path === "" ? 1 : 0.5 }));

  const categoryUrls = Object.keys(CATEGORY_SLUGS).map((slug) => ({
    url: `${BASE}/products/${slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  let productUrls = [];
  try {
    const products = await queryProducts({});
    productUrls = products
      .filter((p) => p.status !== "Draft") // only live/active products
      .map((p) => ({
        url: `${BASE}/products/${(p.category || "laptops").toLowerCase()}/${p.slug || p.id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      }));
  } catch {
    // DB unavailable — ship the static + category sitemap rather than erroring.
  }

  return [...staticUrls, ...categoryUrls, ...productUrls];
}
