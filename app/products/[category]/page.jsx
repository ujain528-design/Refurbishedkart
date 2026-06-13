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
  return {
    title: `Buy ${name} in India | Best Prices`,
    description: `Shop certified ${name.toLowerCase()} with GST invoice, warranty and 7-day returns. Best prices in India.`,
    openGraph: {
      title: `${name} — RefurbishedKart`,
      description: `Certified ${name.toLowerCase()} at best prices in India.`,
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Navbar />
      <main>
        {/* page header */}
        <section className="border-b border-black/5" style={{ background: cc.light }}>
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <nav className="text-[13px] text-neutral-400" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="font-semibold text-ink">{categoryName}</span>
            </nav>
            <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.12em]" style={{ color: cc.color }}>Certified Refurbished</p>
            <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink md:text-[1.75rem]">Refurbished {categoryName} in India</h1>
            <span className="mt-2.5 block h-[3px] w-14 rounded-full" style={{ background: cc.color }} aria-hidden="true" />
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-500">{intro}</p>
          </div>
        </section>

        {/* sidebar + grid */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Suspense fallback={null}>
              <ListingClient categorySlug={params.category} categoryName={categoryName} />
            </Suspense>
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-16">
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
