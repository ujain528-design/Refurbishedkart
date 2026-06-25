/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit loads its .afm font metrics from node_modules at RUNTIME (relative to its
  // own __dirname). If webpack bundles pdfkit, those font files aren't traced into the
  // bundle and `new PDFDocument()` throws ENOENT — which is why invoice generation was
  // silently failing in the best-effort try/catch. Marking it external makes Next
  // require() it from node_modules instead of bundling it. Applies to dev AND prod.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
  // Canonical host: redirect www → non-www (308) so the two hostnames don't split
  // ranking signals. Keep consistent with metadataBase + canonicals (non-www).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.refurbishedkart.com" }],
        destination: "https://refurbishedkart.com/:path*",
        permanent: true,
      },
      // Keyword-rich brand URLs → clean /brands/[brand] route (canonical points back).
      { source: "/refurbished-dell-laptops", destination: "/brands/dell", permanent: true },
      { source: "/refurbished-hp-laptops", destination: "/brands/hp", permanent: true },
      { source: "/refurbished-lenovo-laptops", destination: "/brands/lenovo", permanent: true },
      { source: "/refurbished-apple-laptops", destination: "/brands/apple", permanent: true },
    ];
  },
};

module.exports = nextConfig;
