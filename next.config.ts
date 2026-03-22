import type { NextConfig } from "next";
export const dynamic = "force-dynamic";
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;