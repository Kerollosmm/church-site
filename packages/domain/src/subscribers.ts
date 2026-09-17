// src/lib/domain/subscribers.ts
// The pure rules of an event subscription — PURE, importable from the server and the browser.
//
// WHY THIS MODULE EXISTS: the e-mail a subscription is keyed by is normalised in ONE place, so the
// UNIQUE constraint on `subscribers.email` (see the migration) means what it looks like it means.
// Both store drivers call `normalizeSubscriberEmail()` before writing, the public form schema calls
// it before validating, and the admin screen displays the stored value — a subscriber cannot be
// stored twice under "Nour@Example.com" and "nour@example.com".
//
// The topic vocabulary is taxonomy SLUGS (not ids): a subscription outlives a term being replaced,
// and a stale slug is dropped rather than rendered as a broken chip (see `resolveSubscriberTopics`).

import type { TaxonomyDimension } from "./types";

/** RFC 5321 caps a mailbox at 254 characters; the column is VARCHAR(255). */
export const SUBSCRIBER_EMAIL_MAX_LENGTH = 254;

/** Display name is optional; this is what the column accepts. */
export const SUBSCRIBER_NAME_MAX_LENGTH = 120;

/** Upper bound on the selected topics — a sanity limit, not a UX target. */
export const SUBSCRIBER_TOPICS_MAX = 24;

/**
 * Which taxonomy dimensions a visitor may subscribe to.
 *
 * `event_type` answers "what kind of thing is it" (liturgies, meetings, concerts …) and `ministry`
 * answers "which part of the parish runs it". Those are the two questions a subscriber actually has.
 * `venue`, `audience`, `language` and `tag` are deliberately NOT offered: they narrow a calendar,
 * they do not describe what someone wants to hear about.
 */
export const SUBSCRIBER_TOPIC_DIMENSIONS = ["event_type", "ministry"] as const satisfies readonly TaxonomyDimension[];

/**
 * The stored identity of an e-mail subscription: trimmed and lower-cased.
 *
 * Deliberately conservative — it does NOT strip dots or `+tags` (that is a Gmail-specific rewrite and
 * silently merging two people's mailboxes is worse than a duplicate row). Returns the input trimmed
 * when it is not a string at all, so callers can still report their own validation error.
 */
export function normalizeSubscriberEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

/**
 * Normalises a submitted topic list: trimmed, lower-cased, de-duplicated, order preserved, and
 * capped at `SUBSCRIBER_TOPICS_MAX`. Shape only — whether a slug exists is decided by the caller
 * against the live vocabulary (see `resolveSubscriberTopics`).
 */
export function normalizeSubscriberTopics(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const slug = entry.trim().toLowerCase();
    if (slug.length === 0 || seen.has(slug)) continue;
    seen.add(slug);
    topics.push(slug);
    if (topics.length >= SUBSCRIBER_TOPICS_MAX) break;
  }
  return topics;
}

/** True when a taxonomy dimension may be subscribed to. */
export function isSubscribableDimension(dimension: TaxonomyDimension): boolean {
  return (SUBSCRIBER_TOPIC_DIMENSIONS as readonly TaxonomyDimension[]).includes(dimension);
}

/** The minimal shape `resolveSubscriberTopics()` needs from a taxonomy term. */
export interface SubscriberTopicCandidate {
  slug: string;
  dimension: TaxonomyDimension;
}

export interface ResolvedSubscriberTopics<TCandidate extends SubscriberTopicCandidate> {
  /** Candidate terms whose slug AND dimension match a stored topic. */
  matched: TCandidate[];
  /** Stored slugs that no longer exist in the subscribable vocabulary (never rendered as a chip). */
  unknown: string[];
}

/**
 * Resolves stored topic slugs against the live vocabulary.
 *
 * A stored slug matches only a term of a SUBSCRIBABLE dimension, so a slug that was retired (or was
 * never offered) is reported in `unknown` instead of being silently presented as a real interest.
 * PURE: the caller supplies the vocabulary it already read.
 */
export function resolveSubscriberTopics<TCandidate extends SubscriberTopicCandidate>(
  topics: readonly string[],
  candidates: readonly TCandidate[]
): ResolvedSubscriberTopics<TCandidate> {
  const index = new Map<string, TCandidate>();
  for (const candidate of candidates) {
    if (!isSubscribableDimension(candidate.dimension)) continue;
    index.set(`${candidate.dimension}:${candidate.slug}`, candidate);
  }

  const matched: TCandidate[] = [];
  const unknown: string[] = [];
  for (const topic of topics) {
    // A stored topic may carry its dimension ("event_type:liturgy") or be a bare slug; both are
    // accepted, because the public form submits bare slugs while the admin may store either.
    const [maybeDimension, maybeSlug] = topic.includes(":") ? topic.split(":", 2) : [null, topic];
    const found = maybeDimension
      ? index.get(`${maybeDimension}:${maybeSlug}`)
      : [...index.values()].find((candidate) => candidate.slug === maybeSlug);
    if (found) matched.push(found);
    else unknown.push(topic);
  }

  return { matched, unknown };
}
