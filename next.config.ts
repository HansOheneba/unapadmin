import type { NextConfig } from "next";

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8083";

const nextConfig: NextConfig = {
  // Lean production artifact for cPanel Node.js Selector / Passenger.
  output: "standalone",
  poweredByHeader: false,
  // Admin surfaces product/media URLs from the API, uploads, and CDNs —
  // hostnames aren't known at build time, so allow any http(s) remote.
  //
  // unoptimized: true — skip Vercel Image Optimization entirely.
  // This is an internal admin tool (thumbnails, pickers, logos). Routing
  // every unique remote URL through /_next/image burns Image Cache Writes
  // on the Hobby plan. Storefront (unapologetic) should keep optimization;
  // admin should not.
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  /**
   * Same-origin media upload proxy (Edge rewrite, not a Serverless Function).
   * Browser POSTs to /media-upload/... → forwarded to the API origin.
   * Avoids CORS on the API and avoids the Vercel Function 4.5MB body limit
   * that hits /api/backend/* route handlers.
   */
  async rewrites() {
    return [
      {
        source: "/media-upload/:path*",
        destination: `${API_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
