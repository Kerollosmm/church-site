// src/lib/events/__tests__/filters.test.ts
// The public events page's URL vocabulary — pure, so it is tested directly.
//
// The point of these tests is the ROUND TRIP: the URL is the page's only state, so whatever
// `buildEventsHref()` writes must be exactly what `parseEventFilterSelection()` reads back. A chip
// that navigates to a link the page then interprets differently is the bug class this file exists to
// catch, and no other test in the suite covers it.

import { describe, expect, it } from "vitest";

import {
  FILTER_DIMENSIONS,
  buildEventsHref,
  countSelectedTerms,
  dimensionFromFilterParam,
  hasFilterSelection,
  matchesFilterSelection,
  parseEventFilterSelection,
  termKey,
  toggleFilterValue,
  type EventFilterSelection,
  type EventSearchParams,
  type EventViewMode,
} from "@/lib/events/filters";

/**
 * Turns an href back into the `searchParams` shape Next.js hands a page — repeated keys become an
 * array, single keys stay strings. This is the independent half of the round trip.
 */
function searchParamsOf(href: string): EventSearchParams {
  const url = new URL(href, "https://parish.test");
  const params: EventSearchParams = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    params[key] = values.length === 1 ? values[0] : values;
  }
  return params;
}

/** Build then parse — the operation the page performs on every navigation. */
function roundTrip(selection: EventFilterSelection, view: "list" | "month" = "list", month?: string) {
  const href = buildEventsHref({ view, month, selection });
  return { href, selection: parseEventFilterSelection(searchParamsOf(href)) };
}

describe("parseEventFilterSelection", () => {
  it("reads repeated parameters", () => {
    expect(parseEventFilterSelection({ type: ["liturgy", "meeting"] })).toEqual({
      event_type: ["liturgy", "meeting"],
    });
  });

  it("reads comma-separated parameters exactly like repeated ones", () => {
    expect(parseEventFilterSelection({ type: "liturgy,meeting" })).toEqual({
      event_type: ["liturgy", "meeting"],
    });
    expect(parseEventFilterSelection({ type: ["liturgy,meeting", "concert"] })).toEqual({
      event_type: ["liturgy", "meeting", "concert"],
    });
  });

  it("trims, lower-cases, de-duplicates and drops empties", () => {
    expect(parseEventFilterSelection({ type: "  LITURGY , liturgy ,, Meeting  " })).toEqual({
      event_type: ["liturgy", "meeting"],
    });
  });

  it("maps every dimension to its own parameter, with event_type shortened to `type`", () => {
    expect(parseEventFilterSelection({ type: "a", ministry: "b", audience: "c", language: "d", venue: "e", tag: "f" }))
      .toEqual({ event_type: ["a"], ministry: ["b"], audience: ["c"], language: ["d"], venue: ["e"], tag: ["f"] });
  });

  it("IGNORES parameters that are not filters (`view`, `month`, and anything unknown)", () => {
    expect(parseEventFilterSelection({ view: "month", month: "2026-10", nonsense: "x", type: "liturgy" })).toEqual({
      event_type: ["liturgy"],
    });
    expect(parseEventFilterSelection({})).toEqual({});
  });

  it("omits a dimension whose value is empty rather than storing an empty list", () => {
    expect(parseEventFilterSelection({ type: "", ministry: "   " })).toEqual({});
  });
});

describe("buildEventsHref", () => {
  it("always states the view, and writes one pair per selected term in a deterministic order", () => {
    const href = buildEventsHref({
      view: "list",
      selection: { tag: ["youth"], event_type: ["meeting", "liturgy"], venue: ["main-altar"] },
    });

    // Dimensions in vocabulary order, slugs sorted inside a dimension: two identical selections can
    // never produce two different links.
    expect(href).toBe("/events?view=list&type=liturgy&type=meeting&venue=main-altar&tag=youth");
  });

  it("emits no parameter at all for an empty selection", () => {
    expect(buildEventsHref({ view: "list", selection: {} })).toBe("/events?view=list");
  });

  it("carries the month only in month view, and only when the key is real", () => {
    expect(buildEventsHref({ view: "month", month: "2026-10", selection: {} })).toBe("/events?view=month&month=2026-10");
    expect(buildEventsHref({ view: "list", month: "2026-10", selection: {} })).toBe("/events?view=list");
    expect(buildEventsHref({ view: "month", month: "2026-13", selection: {} })).toBe("/events?view=month");
    expect(buildEventsHref({ view: "month", month: null, selection: {} })).toBe("/events?view=month");
  });

  it("normalises what it writes, so a hand-edited selection cannot produce a messy link", () => {
    const href = buildEventsHref({
      view: "list",
      selection: { event_type: ["LITURGY", " liturgy ", "", "Liturgy"] },
    });

    expect(href).toBe("/events?view=list&type=liturgy");
  });

  it("treats any unknown view as the list view (the page has no implicit mode)", () => {
    expect(buildEventsHref({ view: "week" as unknown as EventViewMode, selection: {} })).toBe("/events?view=list");
  });
});

describe("build ⇄ parse round trip", () => {
  it("returns the selection it was given", () => {
    const selection: EventFilterSelection = {
      event_type: ["liturgy", "meeting"],
      venue: ["main-altar"],
      tag: ["youth"],
    };

    expect(roundTrip(selection).selection).toEqual(selection);
  });

  it("is stable: parsing a built link and rebuilding it yields the same link", () => {
    const first = buildEventsHref({ view: "month", month: "2026-10", selection: { ministry: ["youth", "choir"] } });
    const second = buildEventsHref({ view: "month", month: "2026-10", selection: parseEventFilterSelection(searchParamsOf(first)) });

    expect(second).toBe(first);
  });

  it("canonicalises a hand-edited link on the first rebuild", () => {
    const messy = "/events?view=list&type=LITURGY,%20Meeting&type=liturgy&bogus=1&month=2026-10";
    const parsed = parseEventFilterSelection(searchParamsOf(messy));
    const rebuilt = buildEventsHref({ view: "list", selection: parsed });

    expect(parsed).toEqual({ event_type: ["liturgy", "meeting"] });
    expect(rebuilt).toBe("/events?view=list&type=liturgy&type=meeting");
    expect(parseEventFilterSelection(searchParamsOf(rebuilt))).toEqual(parsed);
  });
});

describe("matchesFilterSelection — OR within a dimension, AND across dimensions", () => {
  const liturgyAtMainAltar = [termKey("event_type", "liturgy"), termKey("venue", "main-altar")];

  it("an empty selection matches everything", () => {
    expect(matchesFilterSelection([], {})).toBe(true);
    expect(matchesFilterSelection(liturgyAtMainAltar, {})).toBe(true);
  });

  it("OR inside one dimension: any selected term is enough", () => {
    expect(matchesFilterSelection(liturgyAtMainAltar, { event_type: ["liturgy", "meeting"] })).toBe(true);
    expect(matchesFilterSelection(liturgyAtMainAltar, { event_type: ["meeting", "concert"] })).toBe(false);
  });

  it("AND across dimensions: every filtered dimension must be satisfied", () => {
    expect(matchesFilterSelection(liturgyAtMainAltar, { event_type: ["liturgy"], venue: ["main-altar"] })).toBe(true);
    // A liturgy somewhere else is not a liturgy at the main altar.
    expect(matchesFilterSelection(liturgyAtMainAltar, { event_type: ["liturgy"], venue: ["upper-room"] })).toBe(false);
    expect(
      matchesFilterSelection(liturgyAtMainAltar, { event_type: ["liturgy"], venue: ["main-altar"], tag: ["youth"] })
    ).toBe(false);
  });

  it("does not exclude an item for carrying MORE terms than were requested", () => {
    const everything = [...liturgyAtMainAltar, termKey("tag", "youth"), termKey("language", "arabic")];

    expect(matchesFilterSelection(everything, { event_type: ["liturgy"] })).toBe(true);
  });

  it("an unknown slug simply matches nothing (it is never treated as a wildcard)", () => {
    expect(matchesFilterSelection(liturgyAtMainAltar, { event_type: ["does-not-exist"] })).toBe(false);
  });

  it("is case-insensitive on the selection side", () => {
    expect(matchesFilterSelection(liturgyAtMainAltar, { event_type: ["  LITURGY "] })).toBe(true);
  });

  it("agrees with what the parsed URL means", () => {
    const selection = parseEventFilterSelection(searchParamsOf("/events?view=list&type=liturgy&venue=main-altar"));

    expect(matchesFilterSelection(liturgyAtMainAltar, selection)).toBe(true);
    expect(matchesFilterSelection([termKey("event_type", "meeting")], selection)).toBe(false);
  });
});

describe("toggle / count helpers", () => {
  it("adds a term, then removes it and drops the emptied dimension", () => {
    const added = toggleFilterValue({}, "event_type", "liturgy");
    expect(added).toEqual({ event_type: ["liturgy"] });

    const second = toggleFilterValue(added, "event_type", "meeting");
    expect(second).toEqual({ event_type: ["liturgy", "meeting"] });

    expect(toggleFilterValue(second, "event_type", "liturgy")).toEqual({ event_type: ["meeting"] });
    expect(toggleFilterValue({ event_type: ["liturgy"] }, "event_type", "liturgy")).toEqual({});
  });

  it("never mutates the selection it was given", () => {
    const original: EventFilterSelection = { event_type: ["liturgy"], venue: ["main-altar"] };
    toggleFilterValue(original, "event_type", "meeting");

    expect(original).toEqual({ event_type: ["liturgy"], venue: ["main-altar"] });
  });

  it("ignores an empty slug", () => {
    expect(toggleFilterValue({}, "event_type", "   ")).toEqual({});
  });

  it("counts what is selected and whether anything is", () => {
    expect(hasFilterSelection({})).toBe(false);
    expect(hasFilterSelection({ event_type: ["liturgy", "meeting"], venue: ["main-altar"] })).toBe(true);
    expect(countSelectedTerms({ event_type: ["liturgy", "meeting"], venue: ["main-altar"] })).toBe(3);
    expect(countSelectedTerms({})).toBe(0);
  });

  it("describes the two filter dimensions of the vocabulary in one place", () => {
    expect(FILTER_DIMENSIONS).toEqual(["event_type", "ministry", "audience", "language", "venue", "tag"]);
    expect(dimensionFromFilterParam("type")).toBe("event_type");
    expect(dimensionFromFilterParam("TYPE")).toBe("event_type");
    expect(dimensionFromFilterParam("venue")).toBe("venue");
    expect(dimensionFromFilterParam("view")).toBeNull();
    expect(dimensionFromFilterParam("month")).toBeNull();
    expect(termKey("event_type", "liturgy")).toBe("event_type:liturgy");
  });
});
