// src/lib/queries.ts
// Unified typed data fetching layer with ISR/SSG caching tags and zero-downtime offline/seed fallback.

import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REVALIDATION_TAGS } from "@/lib/tags";
import type { Tables } from "@/types/database.types";

// ============================================================================
// 1. COMPREHENSIVE IN-MEMORY SEED DATA (Parish Production Baseline)
export * from "@/lib/data/seed-data";
import {
  SEED_ALTARS,
  SEED_CLERGY,
  SEED_MASS_SCHEDULES,
  SEED_CLINIC_SPECIALTIES,
  SEED_CLINIC_DOCTORS,
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
} from "@/lib/data/seed-data";

// ============================================================================
// 2. TYPED DATA FETCHING QUERIES (With unstable_cache and Fallbacks)
// ============================================================================

export const getAltars = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("altars")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error || !data || data.length === 0) {
        return SEED_ALTARS;
      }
      return data;
    } catch {
      return SEED_ALTARS;
    }
  },
  ["all-altars"],
  { tags: [REVALIDATION_TAGS.altars], revalidate: 3600 }
);

export const getClergy = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("clergy")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error || !data || data.length === 0) {
        return SEED_CLERGY;
      }
      return data;
    } catch {
      return SEED_CLERGY;
    }
  },
  ["all-clergy"],
  { tags: [REVALIDATION_TAGS.clergy], revalidate: 3600 }
);

export const getWeeklyMasses = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("mass_schedules")
        .select("*, altar:altars(id, name_ar, name_en), celebrant:clergy(id, clerical_name_ar, rank_title_ar)")
        .eq("is_active", true)
        .order("day_of_week")
        .order("start_time");
      if (error || !data || data.length === 0) {
        return SEED_MASS_SCHEDULES;
      }
      return data;
    } catch {
      return SEED_MASS_SCHEDULES;
    }
  },
  ["weekly-masses"],
  { tags: [REVALIDATION_TAGS.masses], revalidate: 300 }
);

export const getClinicSpecialties = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("clinic_specialties")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error || !data || data.length === 0) {
        return SEED_CLINIC_SPECIALTIES;
      }
      return data;
    } catch {
      return SEED_CLINIC_SPECIALTIES;
    }
  },
  ["clinic-specialties"],
  { tags: [REVALIDATION_TAGS.clinicDoctors], revalidate: 3600 }
);

export const getClinicDoctors = unstable_cache(
  async (specialtySlug?: string) => {
    try {
      const supabase = await createSupabaseServerClient();
      let query = supabase
        .from("clinic_doctors")
        .select("*, specialty:clinic_specialties(id, name_ar, slug, room_number)")
        .eq("is_active", true)
        .order("display_order");

      if (specialtySlug) {
        const specialty = SEED_CLINIC_SPECIALTIES.find((s) => s.slug === specialtySlug);
        if (specialty) {
          query = query.eq("specialty_id", specialty.id);
        }
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        if (specialtySlug) {
          return SEED_CLINIC_DOCTORS.filter((d) => d.specialty?.slug === specialtySlug);
        }
        return SEED_CLINIC_DOCTORS;
      }
      return data;
    } catch {
      if (specialtySlug) {
        return SEED_CLINIC_DOCTORS.filter((d) => d.specialty?.slug === specialtySlug);
      }
      return SEED_CLINIC_DOCTORS;
    }
  },
  ["clinic-doctors"],
  { tags: [REVALIDATION_TAGS.clinicDoctors], revalidate: 3600 }
);

export const getChurchMeetings = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("church_meetings")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error || !data || data.length === 0) {
        return SEED_CHURCH_MEETINGS;
      }
      return data;
    } catch {
      return SEED_CHURCH_MEETINGS;
    }
  },
  ["church-meetings"],
  { tags: [REVALIDATION_TAGS.meetings], revalidate: 3600 }
);

export const getMeetingBySlug = async (slug: string) => {
  const meetings = await getChurchMeetings();
  return meetings.find((m) => m.slug === slug) ?? null;
};

export const getSchoolsAcademies = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("schools_academies")
        .select("*")
        .eq("is_active", true)
        .order("created_at");
      if (error || !data || data.length === 0) {
        return SEED_SCHOOLS;
      }
      return data;
    } catch {
      return SEED_SCHOOLS;
    }
  },
  ["schools-academies"],
  { tags: [REVALIDATION_TAGS.education], revalidate: 3600 }
);

export const getSchoolBySlug = async (slug: string) => {
  const schools = await getSchoolsAcademies();
  return schools.find((s) => s.slug === slug) ?? null;
};

export const getActivities = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error || !data || data.length === 0) {
        return SEED_ACTIVITIES;
      }
      return data;
    } catch {
      return SEED_ACTIVITIES;
    }
  },
  ["all-activities"],
  { tags: [REVALIDATION_TAGS.activities], revalidate: 3600 }
);

export const getActivityBySlug = async (slug: string) => {
  const activities = await getActivities();
  return activities.find((a) => a.slug === slug) ?? null;
};

export const getPublicServices = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("public_services")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error || !data || data.length === 0) {
        return SEED_PUBLIC_SERVICES;
      }
      return data;
    } catch {
      return SEED_PUBLIC_SERVICES;
    }
  },
  ["public-services"],
  { tags: [REVALIDATION_TAGS.services], revalidate: 3600 }
);

export const getServiceBySlug = async (slug: string) => {
  const services = await getPublicServices();
  return services.find((s) => s.slug === slug) ?? null;
};

export const getNewsArticles = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error || !data || data.length === 0) {
        return SEED_NEWS_ARTICLES;
      }
      return data;
    } catch {
      return SEED_NEWS_ARTICLES;
    }
  },
  ["news-articles"],
  { tags: [REVALIDATION_TAGS.news], revalidate: 1800 }
);

export const getDonationAccounts = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("donation_accounts")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error || !data || data.length === 0) {
        return SEED_DONATION_ACCOUNTS;
      }
      return data;
    } catch {
      return SEED_DONATION_ACCOUNTS;
    }
  },
  ["donation-accounts"],
  { tags: [REVALIDATION_TAGS.donationAccounts], revalidate: 86400 }
);

export const getStreamEvents = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("stream_events")
        .select("*")
        .order("starts_at", { ascending: false });
      if (error || !data || data.length === 0) {
        return SEED_STREAM_EVENTS;
      }
      return data;
    } catch {
      return SEED_STREAM_EVENTS;
    }
  },
  ["stream-events"],
  { tags: [REVALIDATION_TAGS.stream], revalidate: 60 }
);

export const getSiteAlerts = unstable_cache(
  async (placement: string = "all") => {
    try {
      const supabase = await createSupabaseServerClient();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("site_alerts")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .order("created_at", { ascending: false });
      if (error || !data || (data as Tables<"site_alerts">[]).length === 0) {
        return placement === "all"
          ? SEED_SITE_ALERTS
          : SEED_SITE_ALERTS.filter((a) => a.placement === "all" || a.placement === placement);
      }
      const alerts = data as Tables<"site_alerts">[];
      return placement === "all"
        ? alerts
        : alerts.filter((a) => a.placement === "all" || a.placement === placement);
    } catch {
      return placement === "all"
        ? SEED_SITE_ALERTS
        : SEED_SITE_ALERTS.filter((a) => a.placement === "all" || a.placement === placement);
    }
  },
  ["site-alerts"],
  { tags: [REVALIDATION_TAGS.alerts], revalidate: 60 }
);

export const getBibleBooks = unstable_cache(
  async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("bible_books")
        .select("*")
        .order("canonical_order");
      if (error || !data || data.length === 0) {
        return SEED_BIBLE_BOOKS;
      }
      return data;
    } catch {
      return SEED_BIBLE_BOOKS;
    }
  },
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
    book_name: v.book_name ?? "إنجيل يوحنا",
    chapter_number: v.chapter,
    verse_number: v.verse,
    theme_tags: ["المحبة", "الخلاص", "الفداء"],
  };
};
