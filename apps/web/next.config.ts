import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,

  async rewrites() {
    const goApiUrl =
      process.env.NEXT_PUBLIC_GO_API_URL || "https://odetaapi.gritcms.com";
    return [
      {
        // Proxy /api/* to the Go backend — same origin for COEP compatibility
        source: "/api/:path*",
        destination: `${goApiUrl}/api/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        // COEP/COOP on all routes — required for WebContainers
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
