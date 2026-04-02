import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Note: COEP/COOP headers removed — they block cross-origin API calls
  // to odetaapi.gritcms.com. WebContainers will use credentialless mode
  // or we'll add them back with proper CORS handling later.
};

export default nextConfig;
