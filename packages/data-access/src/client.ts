// packages/data-access/src/client.ts
// Client-safe entrypoint for @church-site/data-access
// Excludes server-only modules (next/headers, next/cache, server supabase clients)

export * from "./tags";
export type * from "./events/feed";
export * from "./events/format";
export * from "./events/ics";
export * from "./events/filters";
export * from "./events/admin-form";
export * from "./events/audit-view";
export * from "./data/seed-data";
export type * from "./events/admin";
export * from "./utils/cairo-time";
export * from "./utils/mass-schedule";
export * from "./validations/event-schemas";
export * from "./validations/dynamic-validator";
export * from "./videos/trusted-embeds";
export * from "./videos/normalize-video-url";
