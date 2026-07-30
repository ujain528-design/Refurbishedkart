import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ShopByCategory from "@/components/ShopByCategory";
import HeroCarousel from "@/components/HeroCarousel";
import PromoSlot from "@/components/PromoSlot";
import Reveal from "@/components/Reveal";
import HomepageZone from "@/components/home/HomepageZone";
import FlashSaleHomeSection from "@/components/flash/FlashSaleHomeSection";
import BrandStrip from "@/components/BrandStrip";
import BudgetCards from "@/components/BudgetCards";
import WhyRefurbished from "@/components/WhyRefurbished";
import Reviews from "@/components/Reviews";
import BulkBanner from "@/components/BulkBanner";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import Faq from "@/components/Faq";
import PolicyStrip from "@/components/PolicyStrip";
import Footer from "@/components/Footer";
import { FAQS } from "@/lib/data";

const SITE = "https://refurbishedkart.com";

export const metadata = {
  title: "RefurbishedKart | Buy Certified Refurbished Laptops & Desktops in India",
  description:
    "Shop certified refurbished laptops, desktops, monitors & servers. Up to 60% off vs new. GST invoice, 1-year warranty, 7-day returns. Free delivery across India.",
  alternates: { canonical: SITE },
};

// Sitewide identity + sitelinks searchbox + local-business + homepage FAQ schema.
const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "147, Patparganj Industrial Area, Near Anand Vihar",
  addressLocality: "Delhi",
  postalCode: "110092",
  addressCountry: "IN",
};

const homeJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RefurbishedKart",
    url: SITE,
    logo: `${SITE}/logo_rk.webp`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-8448296273",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
    address: ADDRESS,
    sameAs: [],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RefurbishedKart",
    url: SITE,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "RefurbishedKart",
    image: `${SITE}/og-image.jpg`,
    telephone: "+91-8448296273",
    email: "support@refurbishedkart.com",
    url: SITE,
    address: ADDRESS,
    geo: { "@type": "GeoCoordinates", latitude: 28.6469, longitude: 77.3063 },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "11:00",
      closes: "18:00",
    },
    priceRange: "₹₹",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <Navbar />
      {/* fixed-navbar offset is handled by the spacer inside Navbar */}
      <main>
        <Hero />

        {/* Flash Sale band — position: After Hero (self-hides unless admin-set here) */}
        <FlashSaleHomeSection slot="after-hero" />

        {/* Shop by Category — 5 colour-coded category cards */}
        <ShopByCategory />

        {/* Promo slot: After Categories */}
        <PromoSlot placement="after-categories" />

        {/* DB-driven homepage zone — admin-managed sections (product rows, banners,
            category grids, announcements) replace the old hardcoded product rows.
            Managed at /admin/homepage. Everything else on this page stays fixed. */}
        <div className="pt-10">
          <HomepageZone />
        </div>

        {/* Promo slot: After Bestsellers */}
        <PromoSlot placement="after-bestsellers" />

        {/* Flash Sale band — position: After Featured Products */}
        <FlashSaleHomeSection slot="after-featured" />

        {/* Hero carousel — hero-placement banners only. Self-hides when empty. */}
        <HeroCarousel />

        <Reveal><BrandStrip /></Reveal>

        {/* Flash Sale band — position: Before Shop by Budget */}
        <FlashSaleHomeSection slot="before-budget" />

        <Reveal><BudgetCards /></Reveal>

        {/* Promo slot: After Shop by Budget */}
        <PromoSlot placement="after-budget" />

        <Reveal><WhyRefurbished /></Reveal>

        {/* Promo slot: Before Reviews */}
        <PromoSlot placement="before-reviews" />

        <Reveal><Reviews /></Reveal>
        <BulkBanner />
        <Faq />
        <PolicyStrip />

        {/* Promo slot: Above Footer */}
        <PromoSlot placement="footer-top" />

        {/* Flash Sale band — position: Before Footer */}
        <FlashSaleHomeSection slot="before-footer" />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
