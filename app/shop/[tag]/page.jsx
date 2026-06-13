import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import ListingClient from "@/components/ListingClient";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";

// Friendly titles per tag; unknown tags fall back to a title-cased slug.
const TITLES = {
  bestseller: "Bestsellers",
  student: "Best for Students",
  "new-arrival": "New Arrivals",
  recommended: "Recommended",
  "best-for-wfh": "Best for WFH",
  "flash-sale": "Flash Sale",
};

const titleCase = (slug) =>
  String(slug || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const titleFor = (tag) => TITLES[tag] || titleCase(tag);

export function generateMetadata({ params }) {
  const name = titleFor(params.tag);
  return {
    title: `${name} — RefurbishedKart`,
    description: `Browse all ${name.toLowerCase()} — certified refurbished tech with GST invoice, warranty and 7-day returns.`,
  };
}

export default function ShopByTagPage({ params }) {
  const name = titleFor(params.tag);
  return (
    <>
      <Navbar />
      <main>
        {/* header */}
        <section className="border-b border-black/5 bg-offwhite">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <nav className="text-[13px] text-neutral-400" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand">Home</Link>
              <span className="mx-2">/</span>
              <span className="font-semibold text-ink">{name}</span>
            </nav>
            <p className="mt-3 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-[#B8860B]">
              <span className="inline-block h-px w-5 shrink-0 bg-[#B8860B]" aria-hidden="true" />
              Browse
            </p>
            <h1 className="mt-1.5 font-display text-[2rem] font-bold tracking-[-0.02em] text-ink">{name}</h1>
          </div>
        </section>

        {/* full catalogue for this tag — same listing UI (filters + sort), no limit */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Suspense fallback={null}>
              <ListingClient query={{ tags: params.tag }} categoryName={name.toLowerCase()} />
            </Suspense>
          </div>
        </section>

        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
