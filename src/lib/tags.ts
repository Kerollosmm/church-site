// src/lib/tags.ts
// Revalidation Tag Registry as specified in BACKEND_AND_DATA_SPEC.md §6.1

export const REVALIDATION_TAGS = {
  /** Events + event series + occurrence exceptions (the `/events` surfaces of a later step). */
  events: "events",
  /** The taxonomy vocabulary (event types, ministries, audiences, languages, venues, tags). */
  eventTaxonomy: "event-taxonomy",
  /** Media library metadata. */
  eventMedia: "event-media",
  masses: "masses",
  clinicSpecialties: "clinic-specialties",
  meetings: "meetings",
  education: "education",
  activities: "activities",
  services: "services",
  news: "news",
  stream: "stream",
  alerts: "alerts",
  condolenceBookings: "condolence-bookings",
  clergy: "clergy",
  altars: "altars",
  donationAccounts: "donation-accounts",
} as const;

export type RevalidationTag = (typeof REVALIDATION_TAGS)[keyof typeof REVALIDATION_TAGS];
