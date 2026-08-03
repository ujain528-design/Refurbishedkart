import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import BrandProducts from "@/components/brand/BrandProducts";

const titleCase = (s) => String(s || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* Fallback brand page for any brand that doesn't have a curated SEO entry in
   lib/brandContent — so /brands/<anything> never 404s and still lists products. */
export default function GenericBrandView({ slug }) {
  const name = titleCase(slug);
  return (
    <>
      <Navbar />
      <main>
        <section style={{ background: "#0a1a0a" }}>
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:py-20">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Refurbished {name} Products in India
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70 lg:text-lg">
              Certified refurbished {name} devices — tested, warrantied and delivered across India.
            </p>
          </div>
        </section>

        <section className="bg-brand-softer/40 py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="section-heading text-center !text-2xl lg:!text-3xl">Shop Refurbished {name} Products</h2>
            <BrandProducts brand={slug} displayName={name} />
          </div>
        </section>

        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
