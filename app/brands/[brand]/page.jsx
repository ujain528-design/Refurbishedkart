import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import BulkEnquiryTrigger from "@/components/BulkEnquiryTrigger";
import FaqAccordion from "@/components/FaqAccordion";
import BrandProducts from "@/components/brand/BrandProducts";
import BRANDS, { getBrand, getAllBrandSlugs } from "@/lib/brandContent";

const SITE = "https://refurbishedkart.com";

export function generateStaticParams() {
  return getAllBrandSlugs().map((brand) => ({ brand }));
}

export function generateMetadata({ params }) {
  const brand = getBrand(params.brand);
  if (!brand) return { title: "Brand" };
  return {
    title: brand.metaTitle,
    description: brand.metaDescription,
    // Canonical points to the keyword-rich URL (which 308-redirects here).
    alternates: { canonical: `${SITE}/refurbished-${brand.slug}-laptops` },
    openGraph: { title: brand.metaTitle, description: brand.metaDescription, url: `${SITE}/refurbished-${brand.slug}-laptops` },
  };
}

function SectionHeading({ children }) {
  return <h2 className="section-heading text-center !text-2xl lg:!text-3xl">{children}</h2>;
}

export default function BrandPage({ params }) {
  const brand = getBrand(params.brand);
  if (!brand) notFound();

  const name = brand.displayName;
  const others = getAllBrandSlugs().filter((s) => s !== brand.slug).map((s) => BRANDS[s]);

  // FAQPage JSON-LD from this brand's FAQs.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: brand.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Navbar />
      <main>
        {/* 1 — Hero */}
        <section style={{ background: "#0a1a0a" }}>
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:py-20">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Refurbished {name} Laptops &amp; Desktops in India
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70 lg:text-lg">{brand.tagline}</p>
            <p className="mt-5 text-[13px] font-semibold uppercase tracking-wide text-brand-accent">
              Up to 60% off · GST Invoice · Free Delivery · Warranty Included
            </p>
            <a href="#products" className="mt-7 inline-block rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark">
              Shop {name} Products
            </a>
          </div>
        </section>

        {/* 2 — Hero description */}
        <section className="py-10 lg:py-14">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <p className="text-[14px] leading-relaxed text-neutral-600 lg:text-[16px]">{brand.heroDescription}</p>
          </div>
        </section>

        {/* 3 — Why buy */}
        <section className="bg-brand-softer/40 py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading>Why Buy {name} Refurbished?</SectionHeading>
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {brand.whyBuy.map((c) => (
                <div key={c.title} className="rounded-card border border-black/5 bg-white p-5 shadow-card lg:p-6">
                  <span className="text-3xl" aria-hidden="true">{c.icon}</span>
                  <h3 className="mt-3 text-sm font-bold text-ink lg:text-base">{c.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-600 lg:text-[13px]">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 — Popular models */}
        <section className="py-10 lg:py-14">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <p className="text-sm font-bold text-ink">Popular {name} Models</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              {brand.popularModels.map((m) => (
                <Link key={m} href={`/search?q=${encodeURIComponent(m)}`} className="rounded-full bg-brand-soft px-4 py-2 text-[13px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white">
                  {m}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 5 — Live products */}
        <section id="products" className="scroll-mt-24 bg-brand-softer/40 py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading>Shop Refurbished {name} Products</SectionHeading>
            <BrandProducts brand={brand.slug} displayName={name} />
          </div>
        </section>

        {/* 6 — Buying guide */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading>Which {name} Device Is Right for You?</SectionHeading>
            <div className="mt-8 grid gap-5 md:grid-cols-3 lg:gap-7">
              {brand.buyingGuide.map((g) => (
                <div key={g.budget} className="rounded-card border border-black/5 bg-white p-6 shadow-card">
                  <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-[12px] font-bold text-brand">{g.budget}</span>
                  <p className="mt-3 text-sm font-bold text-ink">{g.recommendation}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">{g.useCase}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7 — FAQ */}
        <section className="bg-brand-softer/40 py-12 lg:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading>Frequently Asked Questions</SectionHeading>
            <div className="mt-8"><FaqAccordion items={brand.faqs} /></div>
          </div>
        </section>

        {/* 8 — Compare with other brands */}
        <section className="py-10 lg:py-14">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <p className="text-sm font-bold text-ink">Also consider</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              {others.map((b) => (
                <Link key={b.slug} href={`/brands/${b.slug}`} className="rounded-full border border-black/10 px-5 py-2 text-[13px] font-semibold text-neutral-600 transition-colors hover:border-brand hover:text-brand">
                  Refurbished {b.displayName}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 9 — CTA */}
        <section style={{ background: "#0a1a0a" }}>
          <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:py-20">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-white lg:text-3xl">
              Ready to buy a refurbished {name} device?
            </h2>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href={`/products/laptops?brand=${brand.slug}`} className="rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark">
                Browse All {name} Products
              </Link>
              <BulkEnquiryTrigger className="rounded-full border border-white/25 px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                Bulk Enquiry
              </BulkEnquiryTrigger>
            </div>
          </div>
        </section>

        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
