import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import PDPClient from "@/components/pdp/PDPClient";
import { getProduct } from "@/lib/server/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  try {
    const p = await getProduct(params.id);
    return {
      title: p ? `${p.name} (Refurbished) — RefurbishedKart` : "Product — RefurbishedKart",
      description: p ? `${p.name} — ${p.specs}. Certified refurbished with warranty.` : undefined,
    };
  } catch {
    return { title: "Product — RefurbishedKart" };
  }
}

export default function ProductDetailPage({ params }) {
  return (
    <>
      <Navbar />
      <main>
        <PDPClient category={params.category} id={params.id} />
        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
