import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginView from "@/components/auth/LoginView";

export const metadata = { title: "Sign In — RefurbishedKart", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="bg-offwhite">
        <Suspense fallback={null}>
          <LoginView />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
