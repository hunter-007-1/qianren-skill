import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["wechatpay-node-v3", "superagent", "formidable"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
