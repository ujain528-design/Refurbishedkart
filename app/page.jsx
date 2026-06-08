import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductRow from "@/components/ProductRow";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import BrandStrip from "@/components/BrandStrip";
import BudgetCards from "@/components/BudgetCards";
import WhyRefurbished from "@/components/WhyRefurbished";
import Reviews from "@/components/Reviews";
import BulkBanner from "@/components/BulkBanner";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import Faq from "@/components/Faq";
import PolicyStrip from "@/components/PolicyStrip";
import Footer from "@/components/Footer";
import { BESTSELLERS, STUDENT_PICKS, NEW_ARRIVALS } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      <Navbar />
      {/* fixed-navbar offset is handled by the spacer inside Navbar */}
      <main>
        <Hero />

        {/* PRD §4.1 default rows: Bestsellers, Flash Sale, Best for Students, New Arrivals */}
        <div className="pt-10">
          <ProductRow
            title="Bestsellers"
            subtitle="The machines our customers keep coming back for."
            products={BESTSELLERS}
          />
        </div>

        {/* Full-width clickable Flash Sale banner → /flash-sale */}
        <FlashSaleBanner />

        <div>
          <ProductRow
            title="Best for Students"
            subtitle="Budget-friendly picks that survive a full semester of abuse."
            products={STUDENT_PICKS}
          />
          <ProductRow
            title="New Arrivals"
            subtitle="Fresh off the refurbishment line this week."
            products={NEW_ARRIVALS}
            className="pb-20"
          />
        </div>

        <BrandStrip />
        <BudgetCards />
        <WhyRefurbished />
        <Reviews />
        <BulkBanner />
        <Faq />
        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
