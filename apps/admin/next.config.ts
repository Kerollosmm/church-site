import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@church-site/domain", "@church-site/data-access", "@church-site/ui"],
  reactStrictMode: true,
};

export default nextConfig;
