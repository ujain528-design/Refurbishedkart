import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import ListingClient from "@/components/ListingClient";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import FaqAccordion from "@/components/FaqAccordion";
import { CATEGORY_SLUGS } from "@/lib/data";
import { categoryIntro, categoryFaq } from "@/lib/categorySeo";
import { categoryColor } from "@/lib/categoryColors";
import { PRICE_BUCKETS } from "@/lib/priceBuckets";

export function generateStaticParams() {
  return Object.keys(CATEGORY_SLUGS).map((category) => ({ category }));
}

export function generateMetadata({ params }) {
  const categoryNames = {
    laptops: "Refurbished Laptops",
    desktops: "Refurbished Desktops",
    monitors: "Refurbished Monitors",
    servers: "Refurbished Servers",
    workstations: "Refurbished Workstations",
  };
  const name = categoryNames[params.category] || `Refurbished ${CATEGORY_SLUGS[params.category] || params.category}`;
  const canonical = `https://refurbishedkart.com/products/${params.category}`;
  return {
    title: `Buy ${name} in India | Best Prices`,
    description: `Shop certified ${name.toLowerCase()} with GST invoice, warranty and 7-day returns. Best prices in India.`,
    // Canonical to the clean category URL so faceted filter/sort params
    // (?ram=8gb&sort=price) don't get indexed as duplicate pages.
    alternates: { canonical },
    openGraph: {
      title: `${name} — RefurbishedKart`,
      description: `Certified ${name.toLowerCase()} at best prices in India.`,
      url: canonical,
    },
  };
}

export default function CategoryListingPage({ params }) {
  const categoryName = CATEGORY_SLUGS[params.category];
  if (!categoryName) notFound();

  const intro = categoryIntro(params.category);
  const faq = categoryFaq(params.category);
  const cc = categoryColor(params.category);

  // FAQPage JSON-LD (rich results) built from the same FAQ shown on-page.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  // BreadcrumbList: Home › <Category>.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://refurbishedkart.com" },
      { "@type": "ListItem", position: 2, name: `Refurbished ${categoryName}`, item: `https://refurbishedkart.com/products/${params.category}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <main>
        {/* page header */}
        <section className="border-b border-black/5" style={{ background: cc.light }}>
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            <nav className="text-[13px] text-neutral-400" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="font-semibold text-ink">{categoryName}</span>
            </nav>
            <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.12em]" style={{ color: cc.color }}>Certified Refurbished</p>
            <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink lg:text-[1.75rem]">Refurbished {categoryName} in India</h1>
            <span className="mt-2.5 block h-[3px] w-14 rounded-full" style={{ background: cc.color }} aria-hidden="true" />
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-500">{intro}</p>
            {/* Laptop-only battery-backup promise (not shown on other categories). */}
            {params.category === "laptops" && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3.5 py-1.5 text-[12px] font-bold text-brand">
                🔋 1.5hr+ Battery Backup Tested
              </span>
            )}
            {/* Shop by Budget — chips apply a price filter on THIS listing (same
                as the homepage budget popup). The /budget/[cat]/[bucket] SEO
                landing pages still exist for Google; chips just don't link there. */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Shop by budget:</span>
              {Object.values(PRICE_BUCKETS).map((b) => {
                const qs = new URLSearchParams();
                if (b.minPrice > 0) qs.set("minPrice", String(b.minPrice));
                if (b.maxPrice < 999999) qs.set("maxPrice", String(Math.ceil(b.maxPrice / 1000) * 1000));
                const query = qs.toString();
                return (
                  <Link key={b.slug} href={`/products/${params.category}${query ? `?${query}` : ""}`} className="rounded-full bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold text-ink shadow-sm ring-1 ring-black/5 transition-colors hover:bg-brand hover:text-white">
                    {b.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* sidebar + grid */}
        <section className="py-6 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Suspense fallback={null}>
              <ListingClient categorySlug={params.category} categoryName={categoryName} />
            </Suspense>
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-8 lg:pb-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="section-heading mb-5">Frequently Asked Questions</h2>
            <FaqAccordion items={faq} />
          </div>
        </section>

        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
