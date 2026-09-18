// src/lib/queries.ts
// Unified typed data fetching layer with ISR/SSG caching tags and zero-downtime offline/seed fallback.
//
// TWO RULES GOVERN THIS MODULE:
//
//  1. NOTHING IS EVER SILENT. The seeded dataset is a deliberate offline/SSG strategy (the portal
//     must build and serve with no environment variables), but every fallback is reported through
//     `logQueryEvent()` with the query name attached, so a production database failure can never
//     masquerade as normal operation again. A missing environment is reported once per process;
//     a real query error or an unexpected throw is reported on every occurrence.
//
//  2. CACHED CALLBACKS AVOID DYNAMIC APIS. `unstable_cache` callbacks run outside the request
//     scope, so the public reads below use the cookie-independent anon client from
//     `src/lib/supabase/public.ts`. Calling `cookies()` there (as the session client does) throws
//     inside the cache scope, which used to be swallowed and turned into a cached copy of the seed.
//     Session-scoped reads (`getCondolenceBookings`) are the exception: they need `cookies()`,
//     therefore they are NOT cached and only run from the dynamic `/admin` area.

import { unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "./supabase/public";
import { createSupabaseServerClient } from "./supabase/server";
import { hasSupabaseEnv } from "./env";
import { REVALIDATION_TAGS } from "./tags";
import type { Tables } from "@church-site/domain";

// ============================================================================
// 1. COMPREHENSIVE IN-MEMORY SEED DATA (Parish Production Baseline)
export * from "./data/seed-data";
import {
  SEED_ALTARS,
  SEED_CLERGY,
  SEED_MASS_SCHEDULES,
  SEED_CHURCH_MEETINGS,
  SEED_SCHOOLS,
  SEED_ACTIVITIES,
  SEED_PUBLIC_SERVICES,
  SEED_NEWS_ARTICLES,
  SEED_DONATION_ACCOUNTS,
  SEED_STREAM_EVENTS,
  SEED_SITE_ALERTS,
  SEED_BIBLE_BOOKS,
  SEED_BIBLE_VERSES,
  type WeeklyMassRow,
} from "./data/seed-data";

// ============================================================================
// 2. OBSERVABLE SEED FALLBACK
// ============================================================================

/** Every public read talks to this cookie-free client (see the header). */
type PublicClient = ReturnType<typeof createPublicSupabaseClient>;

/** Minimal shape of a PostgREST error â€” enough to identify it in a log line. */
interface PostgrestErrorLike {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
}

interface QueryOutcome<T> {
  data: T[] | null;
  error: PostgrestErrorLike | null;
}

/**
 * Why the seeded dataset was served instead of database rows. Kept as a closed set so log
 * aggregation does not depend on free-form strings.
 */
type FallbackReason = "environment_not_configured" | "query_error" | "empty_result" | "unexpected_error";

/** The missing-environment notice is emitted once per process (a no-env build has ~14 queries). */
let reportedMissingEnv = false;

/**
 * Structured, greppable report of a query that did not return database rows.
 * `query` is always present so a log line can be traced back to one function in this file.
 */
function logQueryEvent(
  level: "warn" | "error",
  queryName: string,
  reason: FallbackReason,
  detail: Record<string, unknown> = {}
) {
  const payload = { query: queryName, served: "seed-data", reason, ...detail };
  if (level === "error") {
    console.error("[queries] database read failed", payload);
  } else {
    console.warn("[queries] database read skipped", payload);
  }
}

/**
 * Runs a public read and falls back to the seeded rows when the environment is absent (zero-env build).
 *
 * PRODUCTION INTEGRITY INVARIANT:
 * When NODE_ENV === "production" AND Supabase is configured (hasSupabaseEnv()), any query error or
 * empty result THROWS immediately. Serving fake seed data on a live parish site during a DB outage
 * or misconfiguration is strictly prohibited.
 *
 * In dev/test, or when no Supabase environment is configured, seed data is served as fallback.
 */
export async function readOrSeed<T>(
  queryName: string,
  seed: readonly T[],
  read: (supabase: PublicClient) => Promise<QueryOutcome<T>>
): Promise<T[]> {
  if (!hasSupabaseEnv()) {
    if (!reportedMissingEnv) {
      reportedMissingEnv = true;
      logQueryEvent("warn", queryName, "environment_not_configured");
    }
    return [...seed];
  }

  const isProduction = process.env.NODE_ENV === "production";

  try {
    const { data, error } = await read(createPublicSupabaseClient());

    if (error) {
      logQueryEvent("error", queryName, "query_error", {
        code: error.code ?? null,
        message: error.message,
      });

      if (isProduction) {
        throw new Error(
          `[data-access] ${queryName}: live query failed or returned no rows in production — refusing to serve seed data; check DB connectivity.`
        );
      }

      return [...seed];
    }

    if (!data || data.length === 0) {
      logQueryEvent("warn", queryName, "empty_result");

      if (isProduction) {
        throw new Error(
          `[data-access] ${queryName}: live query failed or returned no rows in production — refusing to serve seed data; check DB connectivity.`
        );
      }

      return [...seed];
    }

    return data;
  } catch (err) {
    if (isProduction) {
      if (
        err instanceof Error &&
        err.message.startsWith(`[data-access] ${queryName}: live query failed or returned no rows in production`)
      ) {
        throw err;
      }

      logQueryEvent("error", queryName, "unexpected_error", {
        message: err instanceof Error ? err.message : String(err),
      });

      throw new Error(
        `[data-access] ${queryName}: live query failed or returned no rows in production — refusing to serve seed data; check DB connectivity.`
      );
    }

    logQueryEvent("error", queryName, "unexpected_error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return [...seed];
  }
}

// ============================================================================
// 3. TYPED PUBLIC QUERIES (unstable_cache + observable seed fallback)
// ============================================================================

export const getAltars = unstable_cache(
  async () =>
    readOrSeed<Tables<"altars">>("getAltars", SEED_ALTARS, async (supabase) => {
      const { data, error } = await supabase
        .from("altars")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      return { data, error };
    }),
  ["all-altars"],
  { tags: [REVALIDATION_TAGS.altars], revalidate: 3600 }
);

export const getClergy = unstable_cache(
  async () =>
    readOrSeed<Tables<"clergy">>("getClergy", SEED_CLERGY, async (supabase) => {
      const { data, error } = await supabase
        .from("clergy")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      return { data, error };
    }),
  ["all-clergy"],
  { tags: [REVALIDATION_TAGS.clergy], revalidate: 3600 }
);

export const getWeeklyMasses = unstable_cache(
  async () =>
    readOrSeed<WeeklyMassRow>("getWeeklyMasses", SEED_MASS_SCHEDULES, async (supabase) => {
      const { data, error } = await supabase
        .from("mass_schedules")
        .select(
          "*, altar:altars(id, name_ar, name_en), celebrant:clergy(id, clerical_name_ar, rank_title_ar)"
        )
        .eq("is_active", true)
        .order("day_of_week")
        .order("start_time");
      return { data, error };
    }),
  ["weekly-masses"],
  { tags: [REVALIDATION_TAGS.masses], revalidate: 300 }
);

export const getChurchMeetings = unstable_cache(
  async () =>
    readOrSeed<Tables<"church_meetings">>(
      "getChurchMeetings",
      SEED_CHURCH_MEETINGS,
      async (supabase) => {
        const { data, error } = await supabase
          .from("church_meetings")
          .select("*")
          .eq("is_active", true)
          .order("display_order");
        return { data, error };
      }
    ),
  ["church-meetings"],
  { tags: [REVALIDATION_TAGS.meetings], revalidate: 3600 }
);

export const getMeetingBySlug = async (slug: string) => {
  const meetings = await getChurchMeetings();
  return meetings.find((m) => m.slug === slug) ?? null;
};

export const getSchoolsAcademies = unstable_cache(
  async () =>
    readOrSeed<Tables<"schools_academies">>("getSchoolsAcademies", SEED_SCHOOLS, async (supabase) => {
      const { data, error } = await supabase
        .from("schools_academies")
        .select("*")
        .eq("is_active", true)
        .order("created_at");
      return { data, error };
    }),
  ["schools-academies"],
  { tags: [REVALIDATION_TAGS.education], revalidate: 3600 }
);

export const getSchoolBySlug = async (slug: string) => {
  const schools = await getSchoolsAcademies();
  return schools.find((s) => s.slug === slug) ?? null;
};

export const getActivities = unstable_cache(
  async () =>
    readOrSeed<Tables<"activities">>("getActivities", SEED_ACTIVITIES, async (supabase) => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      return { data, error };
    }),
  ["all-activities"],
  { tags: [REVALIDATION_TAGS.activities], revalidate: 3600 }
);

export const getActivityBySlug = async (slug: string) => {
  const activities = await getActivities();
  return activities.find((a) => a.slug === slug) ?? null;
};

export const getPublicServices = unstable_cache(
  async () =>
    readOrSeed<Tables<"public_services">>("getPublicServices", SEED_PUBLIC_SERVICES, async (supabase) => {
      const { data, error } = await supabase
        .from("public_services")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      return { data, error };
    }),
  ["public-services"],
  { tags: [REVALIDATION_TAGS.services], revalidate: 3600 }
);

export const getServiceBySlug = async (slug: string) => {
  const services = await getPublicServices();
  return services.find((s) => s.slug === slug) ?? null;
};

export const getNewsArticles = unstable_cache(
  async () =>
    readOrSeed<Tables<"news_articles">>("getNewsArticles", SEED_NEWS_ARTICLES, async (supabase) => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      return { data, error };
    }),
  ["news-articles"],
  { tags: [REVALIDATION_TAGS.news], revalidate: 1800 }
);

export const getDonationAccounts = unstable_cache(
  async () =>
    readOrSeed<Tables<"donation_accounts">>(
      "getDonationAccounts",
      SEED_DONATION_ACCOUNTS,
      async (supabase) => {
        const { data, error } = await supabase
          .from("donation_accounts")
          .select("*")
          .eq("is_active", true)
          .order("display_order");
        return { data, error };
      }
    ),
  ["donation-accounts"],
  { tags: [REVALIDATION_TAGS.donationAccounts], revalidate: 86400 }
);

export const getStreamEvents = unstable_cache(
  async () =>
    readOrSeed<Tables<"stream_events">>("getStreamEvents", SEED_STREAM_EVENTS, async (supabase) => {
      const { data, error } = await supabase
        .from("stream_events")
        .select("*")
        .order("starts_at", { ascending: false });
      return { data, error };
    }),
  ["stream-events"],
  { tags: [REVALIDATION_TAGS.stream], revalidate: 60 }
);

export const getSiteAlerts = unstable_cache(
  async (placement: string = "all") => {
    const alerts = await readOrSeed<Tables<"site_alerts">>(
      "getSiteAlerts",
      SEED_SITE_ALERTS,
      async (supabase) => {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("site_alerts")
          .select("*")
          .eq("is_active", true)
          .lte("starts_at", now)
          .order("created_at", { ascending: false });
        return { data, error };
      }
    );

    return placement === "all"
      ? alerts
      : alerts.filter((a) => a.placement === "all" || a.placement === placement);
  },
  ["site-alerts"],
  { tags: [REVALIDATION_TAGS.alerts], revalidate: 60 }
);

/**
 * The 73 books of the Orthodox canon, read from `bible_books` with the seeded list as fallback.
 * `SEED_BIBLE_BOOKS` is the SINGLE source of truth for the canon (see `src/lib/data/seed-data.ts`);
 * `/bible` and any future reader both consume this function, so the book counts can never drift.
 */
export const getBibleBooks = unstable_cache(
  async () =>
    readOrSeed<Tables<"bible_books">>("getBibleBooks", SEED_BIBLE_BOOKS, async (supabase) => {
      const { data, error } = await supabase
        .from("bible_books")
        .select("*")
        .order("canonical_order");
      return { data, error };
    }),
  ["bible-books"],
  { revalidate: 86400 }
);

export const getDailyVerse = async () => {
  // Returns rotating inspirational verse from seed verses with dual-schema compatibility
  const verses = SEED_BIBLE_VERSES;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const v = verses[dayOfYear % verses.length];
  return {
    ...v,
    verse_text: v.text_ar,
    book_name: v.book_name ?? "Ø¥Ù†Ø¬ÙŠÙ„ ÙŠÙˆØ­Ù†Ø§",
    chapter_number: v.chapter,
    verse_number: v.verse,
    theme_tags: ["Ø§Ù„Ù…Ø­Ø¨Ø©", "Ø§Ù„Ø®Ù„Ø§Øµ", "Ø§Ù„ÙØ¯Ø§Ø¡"],
  };
};

// ============================================================================
// 4. STAFF-ONLY READS (session-scoped â€” deliberately NOT cached)
// ============================================================================

export interface CondolenceBookingsRead {
  bookings: Tables<"condolence_bookings">[];
  /** Arabic message to surface in the admin UI when the read failed, or null on success. */
  errorMessageAr: string | null;
}

/**
 * Bookings for the secretariat.
 *
 * `condolence_bookings` has NO public SELECT policy (BACKEND Â§5.2 â€” tracking is done through the
 * `track_condolence_booking` RPC), so this read requires the staff SESSION and therefore the
 * cookie-aware client. It is intentionally NOT wrapped in `unstable_cache`: a session-scoped,
 * private read has no business sitting in a shared cache scope, and its only caller (`/admin`) is
 * `force-dynamic`. There is no seeded fallback for this table â€” fabricated bookings are never
 * shown, an empty list with an explicit error message is the honest failure mode.
 */
export async function getCondolenceBookings(): Promise<CondolenceBookingsRead> {
  if (!hasSupabaseEnv()) {
    logQueryEvent("error", "getCondolenceBookings", "environment_not_configured");
    return {
      bookings: [],
      errorMessageAr: "Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ØºÙŠØ± Ù…Ù‡ÙŠØ£Ø© Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆÙ‚Ø¹ØŒ ØªØ¹Ø°Ù‘Ø± Ø¬Ù„Ø¨ Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø­Ø¬Ø².",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("condolence_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logQueryEvent("error", "getCondolenceBookings", "query_error", {
        code: error.code ?? null,
        message: error.message,
      });
      return {
        bookings: [],
        errorMessageAr: "ØªØ¹Ø°Ù‘Ø± Ø¬Ù„Ø¨ Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø­Ø¬Ø² Ù…Ù† Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§ØªØŒ ÙŠØ±Ø¬Ù‰ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.",
      };
    }

    return { bookings: data ?? [], errorMessageAr: null };
  } catch (err) {
    logQueryEvent("error", "getCondolenceBookings", "unexpected_error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return {
      bookings: [],
      errorMessageAr: "ØªØ¹Ø°Ù‘Ø± Ø¬Ù„Ø¨ Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø­Ø¬Ø² Ù…Ù† Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§ØªØŒ ÙŠØ±Ø¬Ù‰ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.",
    };
  }
}


