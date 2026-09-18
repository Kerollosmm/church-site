import type { NextConfig } from "next";
import { ASSET_ALLOWED_HOSTS } from "../../packages/data-access/src/assets/asset-allowlist";

const nextConfig: NextConfig = {
  transpilePackages: ["@church-site/domain", "@church-site/data-access", "@church-site/ui"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      ...ASSET_ALLOWED_HOSTS.map((host) => ({
        protocol: "https" as const,
        hostname: host,
      })),
    ],
  },
};

export default nextConfig;
