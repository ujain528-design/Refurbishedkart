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
};

export default nextConfig;
