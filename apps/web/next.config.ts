import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Static export in production — Go binary serves the files
  ...(isProd ? { output: "export", trailingSlash: true } : {}),

  images: { unoptimized: true },

  // Dev proxy — /api/* → Go server (ignored in production export)
  async rewrites() {
    if (isProd) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_GO_DEV_URL || "http://localhost:8080"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
