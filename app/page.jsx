import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LiveProductRow from "@/components/home/LiveProductRow";
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

export default function HomePage() {
  return (
    <>
      <Navbar />
      {/* fixed-navbar offset is handled by the spacer inside Navbar */}
      <main>
        <Hero />

        {/* PRD §4.1 default rows, now fetched live from the DB by tag.
            Catalogue tag is "student" (not "best-for-students"). */}
        <div className="pt-10">
          <LiveProductRow
            title="Bestsellers"
            subtitle="The machines our customers keep coming back for."
            tag="bestseller"
          />
        </div>

        {/* Full-width clickable Flash Sale banner → /flash-sale */}
        <FlashSaleBanner />

        <div>
          <LiveProductRow
            title="Best for Students"
            subtitle="Budget-friendly picks that survive a full semester of abuse."
            tag="student"
          />
          <LiveProductRow
            title="New Arrivals"
            subtitle="Fresh off the refurbishment line this week."
            tag="new-arrival"
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
