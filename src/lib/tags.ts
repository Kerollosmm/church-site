// src/lib/tags.ts
// Revalidation Tag Registry as specified in BACKEND_AND_DATA_SPEC.md §6.1

export const REVALIDATION_TAGS = {
  masses: "masses",
  clinicDoctors: "clinic-doctors",
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
