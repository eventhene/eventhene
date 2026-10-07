// Files the PDF generator reads from disk at runtime (fonts etc). Vercel's file tracing cannot see
// these dynamic requires, so list them explicitly or the ticket PDF fails with "Cannot find module".
const PDF_FILES = [
  "./node_modules/pdfkit/**/*",
  "./node_modules/fontkit/**/*",
  "./node_modules/@react-pdf/**/*",
  "./node_modules/linebreak/**/*",
  "./node_modules/unicode-trie/**/*",
  "./node_modules/restructure/**/*",
  "./node_modules/brotli/**/*",
  "./node_modules/png-js/**/*",
  "./node_modules/jay-peg/**/*",
  "./public/logo-icon.png",
  "./public/logo-full.png",
  "./public/fonts/**/*"
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    // PDF generation loads font/data files from disk; keep it out of the webpack bundle so
    // those files exist at runtime on Vercel.
    serverComponentsExternalPackages: ["@react-pdf/renderer", "pdfkit", "fontkit", "qrcode"],
    outputFileTracingIncludes: {
      "/api/tickets/[id]/pdf": PDF_FILES,
      "/api/orders": PDF_FILES,
      "/api/orders/[id]/verify": PDF_FILES,
      "/api/webhooks/paystack": PDF_FILES
    }
  }
};
export default nextConfig;
