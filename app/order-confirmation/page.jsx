import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";

export const metadata = { title: "Order Confirmed — RefurbishedKart", robots: { index: false, follow: false } };

export default function OrderConfirmationPage() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<div className="py-24 text-center text-sm text-neutral-400">Loading…</div>}>
          <OrderConfirmation />
        </Suspense>
        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
