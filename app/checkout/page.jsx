import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import CheckoutView from "@/components/checkout/CheckoutView";

export const metadata = { title: "Checkout — RefurbishedKart" };

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main>
        <CheckoutView />
        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
