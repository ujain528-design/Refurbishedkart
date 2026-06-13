import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import PDPClient from "@/components/pdp/PDPClient";
import { permanentRedirect } from "next/navigation";
import { getProduct, productReviews } from "@/lib/server/products";
import { generateProductTitle } from "@/lib/generateTitle";
import { generateMetaDescription } from "@/lib/generateMetaDescription";

export const dynamic = "force-dynamic";

const SITE = "https://refurbishedkart.com";

// Canonical PDP path: /products/<category-slug>/<seo-slug | id>. Falls back to the
// numeric id until the product's slug is backfilled.
const canonicalPath = (p) => `/products/${String(p.category || "laptops").toLowerCase()}/${p.slug || p.id}`;

export async function generateMetadata({ params }) {
  try {
    const p = await getProduct(params.id);
    if (!p) return { title: "Product" };
    const title = generateProductTitle(p);
    const description = generateMetaDescription(p);
    const image = (Array.isArray(p.images) && p.images[0]) || p.image || undefined;
    return {
      title,
      description,
      alternates: { canonical: `${SITE}${canonicalPath(p)}` },
      openGraph: { title, description, url: `${SITE}${canonicalPath(p)}`, images: image ? [{ url: image }] : undefined },
    };
  } catch {
    return { title: "Product" };
  }
}

/* Product JSON-LD (schema.org) for rich results. Built server-side from the DB
   product + approved-review summary. aggregateRating is included only when there
   is at least one approved review (Google rejects rating with reviewCount 0). */
async function productJsonLd(params) {
  try {
    const p = await getProduct(params.id);
    if (!p) return null;
    const { summary } = await productReviews(params.id);
    const image = (Array.isArray(p.images) && p.images[0]) || p.image || undefined;
    const stock = p.chassisStock ?? p.stock ?? 0;

    const ld = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: generateProductTitle(p),
      brand: { "@type": "Brand", name: p.brand || "RefurbishedKart" },
      description: generateMetaDescription(p),
      ...(image ? { image: image.startsWith("http") ? image : `${SITE}${image}` } : {}),
      offers: {
        "@type": "Offer",
        url: `${SITE}${canonicalPath(p)}`,
        priceCurrency: "INR",
        price: String(p.listedPrice ?? p.price ?? 0),
        availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/RefurbishedCondition",
        seller: { "@type": "Organization", name: "RefurbishedKart" },
      },
    };

    if (summary?.total > 0 && summary.avg > 0) {
      ld.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: String(summary.avg),
        reviewCount: String(summary.total),
      };
    }
    return ld;
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({ params }) {
  // 301/permanent-redirect legacy numeric URLs (and wrong-category URLs) to the
  // canonical slug URL so old /products/laptops/32 links keep working for SEO.
  const product = await getProduct(params.id).catch(() => null);
  if (product) {
    const want = canonicalPath(product);
    const have = `/products/${params.category}/${params.id}`;
    if (decodeURIComponent(have) !== want) permanentRedirect(want);
  }

  const jsonLd = await productJsonLd(params);
  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <Navbar />
      <main>
        <PDPClient category={params.category} id={params.id} />
        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
