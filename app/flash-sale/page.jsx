import { redirect, permanentRedirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import FlashSaleView from "@/components/flash/FlashSaleView";
import { getFlashConfig } from "@/lib/server/flashSale";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Flash Sale — RefurbishedKart",
  description: "Limited-time deals on certified refurbished laptops, desktops and monitors.",
};

/* Canonical flash-sale route.
   - Sale OFF                 → redirect to home (no trace).
   - Custom slug set (≠ flash-sale) → 308 to /<slug> so the old URL doesn't duplicate.
   - Otherwise                → render the sale. */
export default async function FlashSalePage() {
  const config = await getFlashConfig();
  if (!config.active) redirect("/");
  if (config.slug && config.slug !== "flash-sale") permanentRedirect(`/${config.slug}`);

  return (
    <>
      <Navbar />
      <main>
        <FlashSaleView config={config} />
        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
