import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import Countdown from "@/components/Countdown";
import ListingClient from "@/components/ListingClient";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";

export const metadata = {
  title: "Flash Sale — RefurbishedKart",
  description:
    "Limited time deals — up to 60% off on certified refurbished laptops, desktops and monitors.",
};

export default function FlashSalePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Top banner — repeats sale message + live timer */}
        <section className="bg-[#B71C1C]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-4 py-9 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                🔥 Flash Sale
              </h1>
              <p className="mt-1 text-sm text-white/85">
                Limited time deals — prices revert when the timer hits zero.
              </p>
            </div>
            <Countdown onDark />
          </div>
        </section>

        {/* Filter sidebar + product grid + sort — same layout as listing page */}
        <section className="py-7 lg:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Suspense fallback={null}>
              <ListingClient query={{ tags: "flash-sale" }} categoryName="flash sale products" />
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
