import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { getEventFeed } from "@/lib/events/feed";
import { listWindowRange } from "@/lib/events/format";

// src/app/sitemap.ts
// The public sitemap: the parish's static pages plus every event a visitor can currently reach.
//
// WHY DYNAMIC: the events half of the map is the published feed, which changes the moment a member of
// staff publishes, cancels or reschedules something in the admin — exactly the same reason the events
// pages themselves are dynamic. The static routes below are constant; they are cheap to re-emit.
//
// A STORE FAILURE MUST NOT BREAK THE SITEMAP: if the feed cannot be read, the static routes are still
// correct and complete, so the error is logged (server-side only) and the map is returned without the
// event URLs. A 500 here would take the whole site's discovery down for one store hiccup.

export const dynamic = "force-dynamic";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

interface StaticRoute {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

/**
 * Every static page of the portal, with the crawl hint each one deserves: the home page and the
 * schedule surfaces change daily, everything else is reference material.
 */
const STATIC_ROUTES: readonly StaticRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/about/history", changeFrequency: "monthly", priority: 0.6 },
  { path: "/about/altars", changeFrequency: "monthly", priority: 0.6 },
  { path: "/about/clergy", changeFrequency: "monthly", priority: 0.6 },
  { path: "/masses", changeFrequency: "daily", priority: 0.8 },
  { path: "/clinics", changeFrequency: "weekly", priority: 0.7 },
  { path: "/clinics/specialties", changeFrequency: "monthly", priority: 0.6 },
  { path: "/meetings", changeFrequency: "monthly", priority: 0.6 },
  { path: "/education", changeFrequency: "monthly", priority: 0.6 },
  { path: "/activities", changeFrequency: "weekly", priority: 0.6 },
  { path: "/services", changeFrequency: "monthly", priority: 0.6 },
  { path: "/condolence", changeFrequency: "monthly", priority: 0.6 },
  { path: "/condolence/track", changeFrequency: "monthly", priority: 0.5 },
  { path: "/live", changeFrequency: "daily", priority: 0.7 },
  { path: "/bible", changeFrequency: "monthly", priority: 0.6 },
  { path: "/donations", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/events", changeFrequency: "daily", priority: 0.8 },
  { path: "/ministries", changeFrequency: "monthly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // NOTE: the `[slug]` content routes of the static directories (meetings, activities, services,
  // programs) are intentionally NOT enumerated here in this step — their slugs are not exposed by a
  // single reader yet. Only the events detail pages, whose slugs the feed already carries, are added.
  try {
    const items = await getEventFeed(listWindowRange());
    const seenSlugs = new Set<string>();

    for (const item of items) {
      const slug = item.detailSlug.trim();
      // One URL per series: many occurrences share a detail page, so the feed is deduplicated by slug.
      if (slug.length === 0 || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      entries.push({
        url: `${base}/events/${slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error("[events] sitemap feed failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  return entries;
}
