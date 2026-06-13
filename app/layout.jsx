import "./globals.css";
import Script from "next/script";
import { Fraunces } from "next/font/google";
import Providers from "@/lib/Providers";
import AnnouncementBar from "@/components/AnnouncementBar";
import TopLoader from "@/components/TopLoader";

// Elegant display serif — headings only (body/UI stays Inter). Exposed as a CSS
// variable so Tailwind's `font-display` and the .section-heading class can use it.
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
    <html lang="en" className={fraunces.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TopLoader />
        <AnnouncementBar />
        <Providers>{children}</Providers>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
