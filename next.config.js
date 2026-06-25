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
      // Keyword-rich price-bucket URLs (laptops) → clean /budget route.
      { source: "/refurbished-laptops-under-20000", destination: "/budget/laptops/under-20000", permanent: true },
      { source: "/refurbished-laptops-20000-35000", destination: "/budget/laptops/20000-35000", permanent: true },
      { source: "/refurbished-laptops-35000-50000", destination: "/budget/laptops/35000-50000", permanent: true },
      { source: "/refurbished-laptops-above-50000", destination: "/budget/laptops/above-50000", permanent: true },
      // Desktops
      { source: "/refurbished-desktops-under-20000", destination: "/budget/desktops/under-20000", permanent: true },
      { source: "/refurbished-desktops-20000-35000", destination: "/budget/desktops/20000-35000", permanent: true },
      { source: "/refurbished-desktops-35000-50000", destination: "/budget/desktops/35000-50000", permanent: true },
      { source: "/refurbished-desktops-above-50000", destination: "/budget/desktops/above-50000", permanent: true },
      // Monitors
      { source: "/refurbished-monitors-under-20000", destination: "/budget/monitors/under-20000", permanent: true },
      { source: "/refurbished-monitors-20000-35000", destination: "/budget/monitors/20000-35000", permanent: true },
      { source: "/refurbished-monitors-35000-50000", destination: "/budget/monitors/35000-50000", permanent: true },
      { source: "/refurbished-monitors-above-50000", destination: "/budget/monitors/above-50000", permanent: true },
      // Servers
      { source: "/refurbished-servers-under-20000", destination: "/budget/servers/under-20000", permanent: true },
      { source: "/refurbished-servers-20000-35000", destination: "/budget/servers/20000-35000", permanent: true },
      { source: "/refurbished-servers-35000-50000", destination: "/budget/servers/35000-50000", permanent: true },
      { source: "/refurbished-servers-above-50000", destination: "/budget/servers/above-50000", permanent: true },
      // Workstations
      { source: "/refurbished-workstations-under-20000", destination: "/budget/workstations/under-20000", permanent: true },
      { source: "/refurbished-workstations-20000-35000", destination: "/budget/workstations/20000-35000", permanent: true },
      { source: "/refurbished-workstations-35000-50000", destination: "/budget/workstations/35000-50000", permanent: true },
      { source: "/refurbished-workstations-above-50000", destination: "/budget/workstations/above-50000", permanent: true },
      // Legacy URLs from the old site → current canonical paths.
      { source: "/about/warranty", destination: "/warranty", permanent: true },
      { source: "/about/return-policy", destination: "/return-policy", permanent: true },
      { source: "/about/privacy-policy", destination: "/privacy-policy", permanent: true },
      { source: "/about/terms", destination: "/terms", permanent: true },
      { source: "/blogs", destination: "/", permanent: true },
      { source: "/blogs/:path*", destination: "/", permanent: true },
    ];
  },
};

module.exports = nextConfig;
