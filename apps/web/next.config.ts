import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,

  async rewrites() {
    const goApiUrl =
      process.env.NEXT_PUBLIC_GO_API_URL || "https://odetaapi.gritcms.com";
    return [
      {
        source: "/api/:path*",
        destination: `${goApiUrl}/api/:path*`,
      },
    ];
  },

  // No COEP/COOP headers needed — Nodebox doesn't require them
};

export default nextConfig;
