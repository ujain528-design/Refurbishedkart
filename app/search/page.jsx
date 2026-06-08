import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import SearchView from "@/components/search/SearchView";

export const metadata = { title: "Search — RefurbishedKart" };

export default function SearchPage() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={null}>
          <SearchView />
        </Suspense>
        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
