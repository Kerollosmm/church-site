// src/lib/domain/__tests__/subscribers.test.ts
// The pure rules of an e-mail subscription.
//
// The UNIQUE constraint on `subscribers.email` only means what it looks like it means if EXACTLY ONE
// function decides what "the same e-mail" is — so normalisation is tested here as a contract, not as
// a formatting detail. The store-level idempotency that depends on it is tested in
// `src/lib/store/__tests__/json-driver.test.ts`.

import { describe, expect, it } from "vitest";

import {
  SUBSCRIBER_EMAIL_MAX_LENGTH,
  SUBSCRIBER_NAME_MAX_LENGTH,
  SUBSCRIBER_TOPIC_DIMENSIONS,
  SUBSCRIBER_TOPICS_MAX,
  isSubscribableDimension,
  normalizeSubscriberEmail,
  normalizeSubscriberTopics,
  resolveSubscriberTopics,
  type SubscriberTopicCandidate,
} from "@/lib/domain/subscribers";

describe("normalizeSubscriberEmail", () => {
  it("trims and lower-cases, so two spellings of one address are one subscriber", () => {
    expect(normalizeSubscriberEmail("  Nour@Example.COM ")).toBe("nour@example.com");
    expect(normalizeSubscriberEmail("NOUR@EXAMPLE.COM")).toBe(normalizeSubscriberEmail("nour@example.com"));
  });

  it("deliberately does NOT strip dots or +tags", () => {
    // Merging two people's mailboxes is worse than a duplicate row — see the module note.
    expect(normalizeSubscriberEmail("nour.m@example.com")).toBe("nour.m@example.com");
    expect(normalizeSubscriberEmail("nour+events@example.com")).toBe("nour+events@example.com");
  });

  it("returns an empty string for anything that is not a string", () => {
    for (const value of [null, undefined, 42, {}, [], true]) {
      expect(normalizeSubscriberEmail(value)).toBe("");
    }
  });

  it("leaves validation to the caller: a malformed string is only trimmed, never repaired", () => {
    expect(normalizeSubscriberEmail("not-an-email")).toBe("not-an-email");
    expect(normalizeSubscriberEmail("   ")).toBe("");
  });

  it("exposes the length bounds the e-mail column accepts", () => {
    expect(SUBSCRIBER_EMAIL_MAX_LENGTH).toBe(254);
    expect(SUBSCRIBER_NAME_MAX_LENGTH).toBe(120);
  });
});

describe("normalizeSubscriberTopics", () => {
  it("trims, lower-cases, de-duplicates and preserves the order the visitor chose", () => {
    expect(normalizeSubscriberTopics(["  Liturgy ", "youth", "LITURGY", "", "choir"])).toEqual([
      "liturgy",
      "youth",
      "choir",
    ]);
  });

  it("returns an empty list for anything that is not an array", () => {
    expect(normalizeSubscriberTopics(undefined)).toEqual([]);
    expect(normalizeSubscriberTopics("liturgy")).toEqual([]);
    expect(normalizeSubscriberTopics({ 0: "liturgy" })).toEqual([]);
  });

  it("skips entries that are not strings rather than coercing them", () => {
    expect(normalizeSubscriberTopics(["liturgy", 7, null, { slug: "youth" }, "youth"])).toEqual(["liturgy", "youth"]);
  });

  it("caps the list at SUBSCRIBER_TOPICS_MAX", () => {
    const many = Array.from({ length: SUBSCRIBER_TOPICS_MAX + 10 }, (_, index) => `topic-${index}`);
    const normalized = normalizeSubscriberTopics(many);

    expect(normalized).toHaveLength(SUBSCRIBER_TOPICS_MAX);
    expect(normalized[0]).toBe("topic-0");
    expect(normalized[SUBSCRIBER_TOPICS_MAX - 1]).toBe(`topic-${SUBSCRIBER_TOPICS_MAX - 1}`);
  });

  it("offers exactly the two dimensions that describe what someone wants to hear about", () => {
    expect(SUBSCRIBER_TOPIC_DIMENSIONS).toEqual(["event_type", "ministry"]);
    expect(isSubscribableDimension("event_type")).toBe(true);
    expect(isSubscribableDimension("ministry")).toBe(true);
    // These narrow a calendar; they do not describe an interest.
    expect(isSubscribableDimension("venue")).toBe(false);
    expect(isSubscribableDimension("audience")).toBe(false);
    expect(isSubscribableDimension("language")).toBe(false);
    expect(isSubscribableDimension("tag")).toBe(false);
  });
});

describe("resolveSubscriberTopics", () => {
  const vocabulary: SubscriberTopicCandidate[] = [
    { slug: "liturgy", dimension: "event_type" },
    { slug: "meeting", dimension: "event_type" },
    { slug: "youth", dimension: "ministry" },
    { slug: "main-altar", dimension: "venue" },
  ];

  it("matches a bare slug against the live vocabulary", () => {
    const resolved = resolveSubscriberTopics(["liturgy"], vocabulary);

    expect(resolved.matched).toEqual([{ slug: "liturgy", dimension: "event_type" }]);
    expect(resolved.unknown).toEqual([]);
  });

  it("also accepts the dimension-qualified form the admin may have stored", () => {
    expect(resolveSubscriberTopics(["event_type:meeting"], vocabulary).matched).toEqual([
      { slug: "meeting", dimension: "event_type" },
    ]);
    // A qualified slug that names the WRONG dimension is not a match.
    expect(resolveSubscriberTopics(["ministry:liturgy"], vocabulary).unknown).toEqual(["ministry:liturgy"]);
  });

  it("resolves several topics and keeps the vocabulary order out of it", () => {
    const resolved = resolveSubscriberTopics(["choir", "youth", "liturgy"], vocabulary);

    expect(resolved.matched).toEqual([
      { slug: "youth", dimension: "ministry" },
      { slug: "liturgy", dimension: "event_type" },
    ]);
    expect(resolved.unknown).toEqual(["choir"]);
  });

  it("reports a retired slug as unknown instead of rendering it as a real interest", () => {
    const resolved = resolveSubscriberTopics(["retired-slug"], vocabulary);

    expect(resolved.matched).toEqual([]);
    expect(resolved.unknown).toEqual(["retired-slug"]);
  });

  it("NEVER matches a term from a dimension nobody can subscribe to", () => {
    // `main-altar` exists in the vocabulary but as a venue, so it must not come back as an interest.
    const resolved = resolveSubscriberTopics(["main-altar"], vocabulary);

    expect(resolved.matched).toEqual([]);
    expect(resolved.unknown).toEqual(["main-altar"]);
  });

  it("handles an empty subscription (which means every topic) without inventing one", () => {
    expect(resolveSubscriberTopics([], vocabulary)).toEqual({ matched: [], unknown: [] });
  });

  it("does not mutate the vocabulary it is given", () => {
    const copy = [...vocabulary];
    resolveSubscriberTopics(["liturgy"], vocabulary);

    expect(vocabulary).toEqual(copy);
  });
});
