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
    serverComponentsExternalPackages: ["@react-pdf/renderer", "@react-pdf/pdfkit", "@react-pdf/font", "@react-pdf/layout", "@react-pdf/render", "fontkit", "qrcode"],
    outputFileTracingIncludes: {
      "/api/tickets/[id]/pdf": ["./node_modules/@react-pdf/**/*", "./node_modules/fontkit/**/*", "./public/logo-icon.png"],
      "/api/orders": ["./node_modules/@react-pdf/**/*", "./node_modules/fontkit/**/*", "./public/logo-icon.png"],
      "/api/orders/[id]/verify": ["./node_modules/@react-pdf/**/*", "./node_modules/fontkit/**/*", "./public/logo-icon.png"],
      "/api/webhooks/paystack": ["./node_modules/@react-pdf/**/*", "./node_modules/fontkit/**/*", "./public/logo-icon.png"]
    }
  }
};
export default nextConfig;
