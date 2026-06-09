import "./globals.css";
import Providers from "@/lib/Providers";
import AnnouncementBar from "@/components/AnnouncementBar";

export const metadata = {
  title: "RefurbishedKart — Certified Refurbished Laptops, Desktops & More",
  description:
    "India's trusted store for certified refurbished laptops, desktops, monitors, servers and workstations. Tested, warrantied, data-wiped.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AnnouncementBar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
