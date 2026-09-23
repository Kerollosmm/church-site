import type { NextConfig } from "next";
import { ASSET_ALLOWED_HOSTS } from "../../packages/data-access/src/assets/asset-allowlist";

const isProduction = process.env.NODE_ENV === "production";

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
  experimental: {
    serverActions: {
      allowedOrigins: [
        ...(isProduction ? [] : ["*.trycloudflare.com"]),
        "localhost:3000",
        "localhost:3001",
      ],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Keep-Alive",
            value: "timeout=65",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
