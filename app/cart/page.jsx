import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import ProductRow from "@/components/ProductRow";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import CartView from "@/components/cart/CartView";
import { BESTSELLERS } from "@/lib/data";

export const metadata = {
  title: "Your Cart — RefurbishedKart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  const recommended = BESTSELLERS.slice(0, 4);

  return (
    <>
      <Navbar />
      <main>
        <CartView />

        {/* Frequently bought together — reuses ProductRow / ProductCard */}
        <div className="border-t border-black/5 bg-offwhite">
          <ProductRow
            title="Frequently bought together"
            subtitle="Pairs well with what's in your cart."
            products={recommended}
            className="py-7 lg:py-14"
          />
        </div>

        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
