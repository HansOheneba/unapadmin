import type { NextConfig } from "next";
import path from "path";

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8083";

// Vercel sets VERCEL=1 at build time and uses its own runtime/adapter —
// "standalone" output is only needed for self-hosted Node servers
// (cPanel Node.js Selector / Passenger, Docker, etc). Skipping it on Vercel
// avoids bundling a redundant Node runtime into the build.
const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(isVercel
    ? {}
    : {
        output: "standalone" as const,
        outputFileTracingRoot: path.join(__dirname),
      }),
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
