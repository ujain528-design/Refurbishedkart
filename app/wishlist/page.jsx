import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import WishlistView from "@/components/wishlist/WishlistView";

export const metadata = { title: "My Wishlist — RefurbishedKart" };

export default function WishlistPage() {
  return (
    <>
      <Navbar />
      <main>
        <WishlistView />
        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
