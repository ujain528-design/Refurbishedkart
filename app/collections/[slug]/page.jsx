import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import ProductCard from "@/components/ProductCard";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import { getCollectionBySlug } from "@/lib/server/collections";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const data = await getCollectionBySlug(params.slug);
  if (!data) return { title: "Collection not found — RefurbishedKart" };
  const { collection } = data;
  return {
    title: `${collection.name} — RefurbishedKart`,
    description: collection.description || `Shop the ${collection.name} collection of certified refurbished tech at RefurbishedKart.`,
  };
}

export default async function CollectionPage({ params }) {
  const data = await getCollectionBySlug(params.slug);

  return (
    <>
      <Navbar />
      <main>
        {!data ? (
          <section className="mx-auto max-w-2xl px-4 py-24 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">Collection not found</h1>
            <p className="mt-3 text-sm text-neutral-500">This collection may have been removed or is no longer active.</p>
            <Link href="/products/laptops" className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark">
              Browse the shop
            </Link>
          </section>
        ) : (
          <>
            {/* header */}
            <section className="border-b border-black/5 bg-offwhite">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                <nav className="text-[13px] text-neutral-400" aria-label="Breadcrumb">
                  <Link href="/" className="hover:text-brand">Home</Link>
                  <span className="mx-2">/</span>
                  <span className="font-semibold text-ink">{data.collection.name}</span>
                </nav>
                <h1 className="section-heading mt-3">{data.collection.name}</h1>
                {data.collection.description && (
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-500">{data.collection.description}</p>
                )}
              </div>
            </section>

            {/* curated grid — same ProductCard + grid as the listing page */}
            <section className="py-6 lg:py-12">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {data.products.length === 0 ? (
                  <div className="rounded-card border border-dashed border-black/10 bg-neutral-50 p-6 lg:p-12 text-center text-sm text-neutral-500">
                    No products in this collection yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 items-stretch gap-4 lg:gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {data.products.map((p) => (
                      <ProductCard key={p.id} product={p} className="w-full" />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <PolicyStrip />
          </>
        )}
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
