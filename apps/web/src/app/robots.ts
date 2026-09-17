import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

// src/app/robots.ts
// robots.txt for the parish portal.
//
// STATIC ON PURPOSE: nothing here depends on a request. `getSiteUrl()` reads the build/deploy-time
// environment (with a working localhost fallback), so the route is prerendered once — there is no
// per-visitor variation to serve and no reason to pay for a dynamic render.
//
// WHAT IS DISALLOWED AND WHY:
//   * `/admin` (and `/admin/` to cover the bare path) — the staff area, never indexable.
//   * `/api/` — the route handlers, which speak JSON/iCal rather than pages.
// Everything else is open: the public parish pages are meant to be found.

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
