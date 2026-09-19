import type { NextConfig } from "next";
import { TRUSTED_EMBED_ORIGINS, TURNSTILE_ORIGIN } from "./src/lib/security/trusted-embeds";
import { ASSET_ALLOWED_HOSTS } from "../../packages/data-access/src/assets/asset-allowlist";

/** True for `next build` / `next start`, false under `next dev`. */
const isProduction = process.env.NODE_ENV === "production";

const externalImageOrigins = ASSET_ALLOWED_HOSTS.map((host) => `https://${host}`);

/**
 * Content-Security-Policy for the whole portal.
 *
 * Every allowance below is traced to an observed requirement of the built output:
 *   - `'unsafe-inline'` in `script-src`: Next.js bootstraps hydration with inline
 *     `self.__next_f.push(...)` scripts (22 of them in the generated `contact.html`).
 *   - `'unsafe-inline'` in `style-src`: the layout/components emit inline `style` attributes.
 *   - Turnstile: `challenges.cloudflare.com` serves the challenge script and renders it in an
 *     iframe; the siteverify call is server-side (no browser allowance needed).
 *   - Supabase: the project origin is only known at deploy time (`NEXT_PUBLIC_SUPABASE_URL`), so
 *     the hosted-project domain is allowlisted instead of one pinned host.
 *   - YouTube / Facebook: the only origins accepted for the live-stream embed, taken from
 *     `TRUSTED_EMBED_HOSTS` so the header and the runtime check cannot drift.
 *
 * No `upgrade-insecure-requests` in development: the dev server is plain HTTP on localhost.
 */
function contentSecurityPolicy(): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", TURNSTILE_ORIGIN];
  const connectSrc = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    TURNSTILE_ORIGIN,
  ];

  if (!isProduction) {
    // React Refresh and the dev overlay evaluate code, and HMR talks over a websocket.
    scriptSrc.push("'unsafe-eval'");
    connectSrc.push("ws:", "wss:");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://*.supabase.co ${externalImageOrigins.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src 'self' ${TURNSTILE_ORIGIN} ${TRUSTED_EMBED_ORIGINS.join(" ")}`,
    "media-src 'self' https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

/**
 * Conservative default: the portal needs none of these features itself, and disabling them here
 * also removes them from the embedded live stream. Media-related features (`autoplay`,
 * `encrypted-media`, `fullscreen`, `picture-in-picture`) are deliberately NOT restricted, because
 * the YouTube/Facebook player iframes legitimately request them.
 */
const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "midi=()",
  "magnetometer=()",
  "serial=()",
].join(", ");

const nextConfig: NextConfig = {
  transpilePackages: ["@church-site/domain", "@church-site/data-access", "@church-site/ui"],
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
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
  async headers() {
    const csp = contentSecurityPolicy();

    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            // Takes effect only over HTTPS (the deployment target is HTTPS-only); browsers ignore
            // it for plain-HTTP dev servers. 180 days, subdomains included.
            key: "Strict-Transport-Security",
            value: "max-age=15552000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "Permissions-Policy",
            value: PERMISSIONS_POLICY,
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
