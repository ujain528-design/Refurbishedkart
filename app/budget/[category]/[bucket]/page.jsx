import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import FaqAccordion from "@/components/FaqAccordion";
import BudgetProducts from "@/components/budget/BudgetProducts";
import {
  PRICE_BUCKETS, getPriceBucket, getAllBucketSlugs,
  getCategoryMeta, getAllBudgetCategorySlugs,
} from "@/lib/priceBuckets";

const SITE = "https://refurbishedkart.com";
const BRANDS = [["dell", "Dell"], ["hp", "HP"], ["lenovo", "Lenovo"], ["apple", "Apple"]];

export function generateStaticParams() {
  const params = [];
  for (const category of getAllBudgetCategorySlugs()) {
    for (const bucket of getAllBucketSlugs()) params.push({ category, bucket });
  }
  return params; // 5 categories × 4 buckets = 20
}

const withCat = (str, plural) => String(str).replace(/\[CATEGORY\]/g, plural);

export function generateMetadata({ params }) {
  const cat = getCategoryMeta(params.category);
  const bucket = getPriceBucket(params.bucket);
  if (!cat || !bucket) return { title: "Budget" };
  const canonical = `${SITE}/refurbished-${params.category}-${bucket.slug}`;
  return {
    title: `Refurbished ${cat.plural} ${bucket.label} | RefurbishedKart`,
    description: withCat(bucket.description, cat.plural),
    alternates: { canonical },
    openGraph: { title: `Refurbished ${cat.plural} ${bucket.label}`, description: withCat(bucket.description, cat.plural), url: canonical },
  };
}

function SectionHeading({ children }) {
  return <h2 className="section-heading text-center !text-2xl lg:!text-3xl">{children}</h2>;
}

export default function BudgetPage({ params }) {
  const cat = getCategoryMeta(params.category);
  const bucket = getPriceBucket(params.bucket);
  if (!cat || !bucket) notFound();

  const plural = cat.plural;
  const heading = withCat(bucket.heading, plural);
  const description = withCat(bucket.description, plural);
  const otherBuckets = getAllBucketSlugs().filter((s) => s !== bucket.slug).map((s) => PRICE_BUCKETS[s]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: bucket.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Navbar />
      <main>
        {/* 1 — Hero */}
        <section style={{ background: "#0a1a0a" }}>
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:py-20">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{heading}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70 lg:text-lg">{bucket.tagline}</p>
            <p className="mt-5 text-[13px] font-semibold uppercase tracking-wide text-brand-accent">
              Certified · GST Invoice · Free Delivery · Warranty
            </p>
            <a href="#products" className="mt-7 inline-block rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark">
              Browse {plural}
            </a>
          </div>
        </section>

        {/* 2 — Description */}
        <section className="py-10 lg:py-14">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <p className="text-[14px] leading-relaxed text-neutral-600 lg:text-[16px]">{description}</p>
          </div>
        </section>

        {/* 3 — Live products */}
        <section id="products" className="scroll-mt-24 bg-brand-softer/40 py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading>{plural} {bucket.label}</SectionHeading>
            <BudgetProducts category={params.category} minPrice={bucket.minPrice} maxPrice={bucket.maxPrice} categoryLabel={plural} />
          </div>
        </section>

        {/* 4 — Buying guide tip */}
        <section className="py-10 lg:py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="rounded-card border border-amber-200 bg-amber-50 p-5">
              <p className="flex items-start gap-2.5 text-[13px] lg:text-[14px] leading-relaxed text-amber-900">
                <span aria-hidden="true" className="mt-0.5 shrink-0 text-base">💡</span>
                <span><span className="font-bold">Pro Tip:</span> {bucket.tip}</span>
              </p>
            </div>
          </div>
        </section>

        {/* 5 — FAQ */}
        <section className="bg-brand-softer/40 py-12 lg:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading>Frequently Asked Questions</SectionHeading>
            <div className="mt-8"><FaqAccordion items={bucket.faqs} /></div>
          </div>
        </section>

        {/* 6 — Other budget ranges */}
        <section className="py-10 lg:py-14">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <p className="text-sm font-bold text-ink">Other Budget Ranges</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              {otherBuckets.map((b) => (
                <Link key={b.slug} href={`/budget/${params.category}/${b.slug}`} className="rounded-full bg-brand-soft px-4 py-2 text-[13px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white">
                  {b.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 7 — Shop by brand */}
        <section className="pb-10 lg:pb-14">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <p className="text-sm font-bold text-ink">Shop by Brand</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              {BRANDS.map(([slug, name]) => (
                <Link key={slug} href={`/brands/${slug}`} className="rounded-full border border-black/10 px-5 py-2 text-[13px] font-semibold text-neutral-600 transition-colors hover:border-brand hover:text-brand">
                  {name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 8 — CTA */}
        <section style={{ background: "#0a1a0a" }}>
          <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:py-20">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-white lg:text-3xl">Ready to buy?</h2>
            <div className="mt-7">
              <Link href={`/products/${params.category}`} className="inline-block rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark">
                Browse All {plural}
              </Link>
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
