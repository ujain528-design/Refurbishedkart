import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import ListingClient from "@/components/ListingClient";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import { CATEGORY_SLUGS } from "@/lib/data";

export function generateStaticParams() {
  return Object.keys(CATEGORY_SLUGS).map((category) => ({ category }));
}

export function generateMetadata({ params }) {
  const name = CATEGORY_SLUGS[params.category];
  return {
    title: name
      ? `Refurbished ${name} — RefurbishedKart`
      : "Products — RefurbishedKart",
    description: `Certified refurbished ${name?.toLowerCase() ?? "electronics"} with warranty, GST invoice and PAN India delivery.`,
  };
}

export default function CategoryListingPage({ params }) {
  const categoryName = CATEGORY_SLUGS[params.category];
  if (!categoryName) notFound();

  // Products are fetched client-side from the API inside ListingClient
  // (with skeleton/error/empty + filters). Recommendations live on the PDP only.

  return (
    <>
      <Navbar />
      <main>
        {/* page header */}
        <section className="border-b border-black/5 bg-offwhite">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <nav className="text-[13px] text-neutral-400" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="font-semibold text-ink">{categoryName}</span>
            </nav>
            <h1 className="section-heading mt-3">Refurbished {categoryName}</h1>
            <p className="mt-3 text-sm text-neutral-500">
              Certified, warrantied and data-wiped — every unit inspected before listing.
            </p>
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

        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
