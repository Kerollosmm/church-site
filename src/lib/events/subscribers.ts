// src/lib/events/subscribers.ts
// The topic vocabulary the PUBLIC subscribe form offers — PURE, so the same helper can be used by the
// server page and by the client form without dragging the store into the browser bundle.
//
// The rule (single-sourced in `src/lib/domain/subscribers.ts`) is that a visitor subscribes to
// `event_type` and `ministry` terms only: "what kind of thing" and "which part of the parish".

import { SUBSCRIBER_TOPIC_DIMENSIONS } from "@/lib/domain/subscribers";
import type { TaxonomyDimension } from "@/lib/domain/types";
import type { EventFeedTermView } from "@/lib/events/feed";

export interface SubscribableTopicGroup {
  dimension: TaxonomyDimension;
  terms: EventFeedTermView[];
}

/**
 * Groups the ACTIVE taxonomy into the dimensions a visitor may subscribe to, in the domain's order,
 * dropping every dimension that is not offered. Groups with no terms are dropped too — an empty
 * "نوع الفعالية" section would be a heading with nothing under it.
 *
 * The caller supplies the vocabulary it already read (the public page reuses `getFeedTaxonomy()`);
 * this function never reads anything itself.
 */
export function groupSubscribableTopics(terms: readonly EventFeedTermView[]): SubscribableTopicGroup[] {
  return SUBSCRIBER_TOPIC_DIMENSIONS.map((dimension) => ({
    dimension,
    terms: terms
      .filter((term) => term.dimension === dimension)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug)),
  })).filter((group) => group.terms.length > 0);
}

/** Total number of topics a visitor can choose from — used to decide whether to render the fields. */
export function countSubscribableTopics(groups: readonly SubscribableTopicGroup[]): number {
  return groups.reduce((total, group) => total + group.terms.length, 0);
}
