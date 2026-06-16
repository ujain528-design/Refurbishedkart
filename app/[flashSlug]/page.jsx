import { redirect, permanentRedirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import FlashSaleView from "@/components/flash/FlashSaleView";
import { getFlashConfig } from "@/lib/server/flashSale";

export const dynamic = "force-dynamic";

/* Catch-all single-segment route that serves the flash sale at its ADMIN-SET slug
   (e.g. /sale, /offers). Static routes (/cart, /search, …) always take precedence,
   so this only fires for otherwise-unmatched top-level paths.

   - here === current slug          → render the sale (or redirect to / if off, or
                                       back to canonical /flash-sale if slug reset).
   - here === previous slug (moved)  → 308 to the new /<slug>.
   - anything else                   → 404. */
export async function generateMetadata({ params }) {
  const config = await getFlashConfig();
  if (params.flashSlug === config.slug && config.active) {
    return { title: "Flash Sale — RefurbishedKart", description: config.subtitle || "Limited-time deals." };
  }
  return {};
}

export default async function FlashSlugPage({ params }) {
  const here = decodeURIComponent(params.flashSlug || "");
  const config = await getFlashConfig();

  // Old slug after a rename → permanent redirect to the new public URL.
  if (config.prevSlug && here === config.prevSlug && config.prevSlug !== config.slug) {
    permanentRedirect(`/${config.slug}`);
  }

  // Not the flash-sale slug → let Next render the 404.
  if (here !== config.slug) notFound();

  // It IS the flash slug. If the admin reset to the default, send to the canonical route.
  if (config.slug === "flash-sale") redirect("/flash-sale");
  if (!config.active) redirect("/");

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
