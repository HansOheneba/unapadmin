import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Admin surfaces product/media URLs from the API, uploads, and CDNs —
  // hostnames aren't known at build time, so allow any http(s) remote.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
