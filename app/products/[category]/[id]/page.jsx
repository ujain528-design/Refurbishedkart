import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import ProductRow from "@/components/ProductRow";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import Gallery from "@/components/pdp/Gallery";
import PurchasePanel from "@/components/pdp/PurchasePanel";
import { ALL_PRODUCTS, CATEGORY_SLUGS } from "@/lib/data";
import ReviewsSection from "@/components/pdp/ReviewsSection";
import { variantsFor, specRowsFor, descriptionFor, reviewsFor, reviewSummary } from "@/lib/pdp";

export function generateStaticParams() {
  return ALL_PRODUCTS.map((p) => ({
    category: p.category.toLowerCase(),
    id: String(p.id),
  }));
}

const findProduct = (params) =>
  ALL_PRODUCTS.find(
    (p) => String(p.id) === params.id && p.category.toLowerCase() === params.category
  );

export function generateMetadata({ params }) {
  const p = findProduct(params);
  return {
    title: p ? `${p.name} (Refurbished) — RefurbishedKart` : "Product — RefurbishedKart",
    description: p ? `${p.name} — ${p.specs}. Certified refurbished with warranty.` : undefined,
  };
}

export default function ProductDetailPage({ params }) {
  const product = findProduct(params);
  if (!product) notFound();

  const categoryName = CATEGORY_SLUGS[params.category];
  const variants = variantsFor(product);
  const specRows = specRowsFor(product);
  const description = descriptionFor(product);
  const reviews = reviewsFor(product.id);
  // real average when reviews exist; 4.5/127 placeholder otherwise (per brief)
  const summary = reviewSummary(reviews);
  const rating = summary?.avg ?? 4.5;
  const ratingCount = summary?.total ?? 127;

  const related = ALL_PRODUCTS.filter(
    (p) => p.id !== product.id && (p.brand === product.brand || p.category === product.category)
  ).slice(0, 6);
  const alsoViewed = ALL_PRODUCTS.filter((p) => p.category !== product.category).slice(0, 6);

  return (
    <>
      <Navbar />
      <main>
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* breadcrumb */}
            <nav className="text-[13px] text-neutral-400" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand">Home</Link>
              <span className="mx-2">/</span>
              <Link href={`/products/${params.category}`} className="hover:text-brand">
                {categoryName}
              </Link>
              <span className="mx-2">/</span>
              <span className="font-semibold text-ink">{product.name}</span>
            </nav>

            {/* gallery 50% / info 50%, stacked on mobile */}
            <div className="mt-8 grid gap-10 lg:grid-cols-2">
              <Gallery images={product.images} alt={product.name} />

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
                  {product.name}
                </h1>

                {/* Unified right-column purchase area (handles variant + flat products) */}
                <PurchasePanel product={product} variants={variants} rating={rating} ratingCount={ratingCount} />
              </div>
            </div>

            {/* spec table */}
            <div className="mt-16 max-w-3xl">
              <h2 className="section-heading">Specifications</h2>
              <table className="mt-7 w-full overflow-hidden rounded-card border border-black/5 text-sm shadow-card">
                <tbody>
                  {specRows.map(([label, value], i) => (
                    <tr key={label} className={i % 2 ? "bg-white" : "bg-brand-softer/60"}>
                      <th className="w-2/5 px-5 py-3.5 text-left font-semibold text-neutral-500">
                        {label}
                      </th>
                      <td className="px-5 py-3.5 font-medium text-ink">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* description */}
            <div className="mt-16 max-w-3xl">
              <h2 className="section-heading">About this device</h2>
              <div className="mt-7 space-y-4 text-[15px] leading-relaxed text-neutral-600">
                {description.paragraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <ul className="mt-6 space-y-2.5">
                {description.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">
                      ✓
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* customer reviews — Session 4 */}
            <ReviewsSection reviews={reviews} />
          </div>
        </section>

        {/* recommendation carousels — same style as homepage rows */}
        <div className="border-t border-black/5 bg-offwhite">
          <ProductRow
            title="Related products"
            subtitle={`More from ${product.brand} and other ${product.category.toLowerCase()}.`}
            products={related}
          />
          <ProductRow
            title="Customers also viewed"
            subtitle="Popular picks from other categories."
            products={alsoViewed}
            className="pb-16"
          />
        </div>

        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
