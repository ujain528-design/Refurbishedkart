import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ShopByCategory from "@/components/ShopByCategory";
import HeroCarousel from "@/components/HeroCarousel";
import PromoSlot from "@/components/PromoSlot";
import Reveal from "@/components/Reveal";
import LiveProductRow from "@/components/home/LiveProductRow";
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

export default function HomePage() {
  return (
    <>
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

        {/* PRD §4.1 default rows, now fetched live from the DB by tag.
            Catalogue tag is "student" (not "best-for-students"). */}
        <div className="pt-10">
          <LiveProductRow
            eyebrow="Handpicked for you"
            title="Bestsellers"
            subtitle="The machines our customers keep coming back for."
            tag="bestseller"
            viewAllHref="/shop/bestseller"
          />
        </div>

        {/* Promo slot: After Bestsellers */}
        <PromoSlot placement="after-bestsellers" />

        {/* Flash Sale band — position: After Featured Products */}
        <FlashSaleHomeSection slot="after-featured" />

        {/* Hero carousel — hero-placement banners only. Self-hides when empty. */}
        <HeroCarousel />

        {/* soft green-tint band for the curated rows */}
        <div style={{ background: "#EDF2E8" }}>
          <LiveProductRow
            eyebrow="On a budget"
            title="Best for Students"
            subtitle="Budget-friendly picks that survive a full semester of abuse."
            tag="student"
            viewAllHref="/shop/student"
          />
          <LiveProductRow
            eyebrow="Just in"
            title="New Arrivals"
            subtitle="Fresh off the refurbishment line this week."
            tag="new-arrival"
            className="pb-20"
            viewAllHref="/shop/new-arrival"
          />
        </div>

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
