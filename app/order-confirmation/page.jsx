import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";

export const metadata = { title: "Order Confirmed — RefurbishedKart" };

export default function OrderConfirmationPage() {
  return (
    <>
      <Navbar />
      <main>
        <OrderConfirmation />
        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
