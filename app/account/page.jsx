import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import AccountView from "@/components/account/AccountView";

export const metadata = { title: "My Account — RefurbishedKart" };

export default function AccountPage() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={null}>
          <AccountView />
        </Suspense>
        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
