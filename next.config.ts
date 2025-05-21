import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    eslint: {
    // This setting will completely ignore ESLint during the build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
