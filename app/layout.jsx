import "./globals.css";
import Script from "next/script";
import { Fraunces, Inter } from "next/font/google";
import Providers from "@/lib/Providers";
import AnnouncementBar from "@/components/AnnouncementBar";
import TopLoader from "@/components/TopLoader";

// Body/UI sans — self-hosted via next/font (App Router-correct; no <link> to
// Google Fonts, which would trip the no-page-custom-font / _document path).
// Exposed as --font-inter; globals.css `body` uses it.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

// Elegant display serif — headings only. Exposed as a CSS variable so Tailwind's
// `font-display` and the .section-heading class can use it.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata = {
  // metadataBase lets relative OG/Twitter image paths (e.g. /og-image.jpg) resolve
  // to absolute URLs — required by Next for social-card images.
  metadataBase: new URL("https://refurbishedkart.com"),
  title: {
    default: "RefurbishedKart — Certified Refurbished Laptops & Computers in India",
    template: "%s | RefurbishedKart",
  },
  description:
    "Buy certified refurbished laptops, desktops, monitors and servers in India. GST invoice, 7-day returns, warranty on every order. Best prices guaranteed.",
  keywords: [
    "refurbished laptops",
    "used laptops india",
    "certified refurbished computers",
    "second hand laptops",
    "refurbished desktops india",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://refurbishedkart.com",
    siteName: "RefurbishedKart",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", site: "@refurbishedkart" },
  robots: { index: true, follow: true },
  verification: { google: "add-google-search-console-code-here" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <TopLoader />
        <AnnouncementBar />
        <Providers>{children}</Providers>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
