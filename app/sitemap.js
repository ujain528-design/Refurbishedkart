import { CATEGORY_SLUGS } from "@/lib/data";
import { queryProducts } from "@/lib/server/products";
import { dbConnect } from "@/lib/server/mongoose";
import { Collection } from "@/lib/server/models";
import { getAllBrandSlugs } from "@/lib/brandContent";

const BASE = "https://refurbishedkart.com";

// Homepage curated rows that have crawlable /shop/[tag] pages.
const SHOP_TAGS = ["bestseller", "student", "new-arrival"];

/* Dynamic sitemap (Next.js App Router). Served at /sitemap.xml.
   Includes the homepage, all indexable static + policy pages, every category,
   every active collection, the curated shop-tag pages, and every non-draft
   product (from the DB). Private pages (cart/checkout/account/search/etc.) are
   intentionally excluded — they're noindexed. If the DB is unreachable it still
   returns the static + category URLs rather than failing. */
export default async function sitemap() {
  const now = new Date();

  const staticUrls = [
    "",            // homepage
    "/about",
    "/contact",
    "/privacy-policy",
    "/return-policy",
    "/warranty",
    "/shipping",
    "/terms",
    "/flash-sale",
  ].map((path) => ({ url: `${BASE}${path}`, lastModified: now, changeFrequency: "weekly", priority: path === "" ? 1 : 0.5 }));

  const categoryUrls = Object.keys(CATEGORY_SLUGS).map((slug) => ({
    url: `${BASE}/products/${slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const shopTagUrls = SHOP_TAGS.map((tag) => ({
    url: `${BASE}/shop/${tag}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  // Brand SEO landing pages (/brands/dell etc.).
  const brandUrls = getAllBrandSlugs().map((slug) => ({
    url: `${BASE}/brands/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
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

  let collectionUrls = [];
  try {
    await dbConnect();
    const collections = await Collection.find({ active: true }).select("slug updatedAt").lean();
    collectionUrls = collections
      .filter((c) => c.slug)
      .map((c) => ({
        url: `${BASE}/collections/${c.slug}`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.6,
      }));
  } catch {
    // DB unavailable — skip collections.
  }

  return [...staticUrls, ...categoryUrls, ...brandUrls, ...shopTagUrls, ...collectionUrls, ...productUrls];
}
