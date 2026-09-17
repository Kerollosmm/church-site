// src/lib/store/__tests__/json-driver.test.ts
// The file-backed store, exercised through the REAL driver over a THROWAWAY data directory.
//
// No network, no Supabase, no browser: each test points `CHURCH_DATA_DIR` at a fresh OS temp folder
// and removes it afterwards, so the assertions run against the same code path the portal uses with no
// environment variables at all.
//
// IMPORTS THE DRIVER DIRECTLY (`@/lib/store/json-driver`, not `@/lib/store/index`): the factory pulls
// the Supabase driver, which reaches for request cookies — untestable outside a Next.js request by
// design. The contract under test is the same one the factory returns.

import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonEventRepository } from "@/lib/store/json-driver";
import { StoreError } from "@/lib/store/repository";
import { STORE_FILE_NAME } from "@/lib/store/document";
import { buildSeedDocument } from "@/lib/store/seed";
import type { Actor } from "@/lib/domain/types";

const STAFF: Actor = { id: "staff-1", name: "أ. عادل" };
const VISITOR: Actor = { id: null, name: "زائر الموقع" };

let dataDir: string;
let repository: JsonEventRepository;

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "church-store-"));
  process.env.CHURCH_DATA_DIR = dataDir;
  repository = new JsonEventRepository();
});

afterEach(async () => {
  delete process.env.CHURCH_DATA_DIR;
  await rm(dataDir, { recursive: true, force: true });
});

/** The raw document on disk, as written by the driver. */
async function readDocument() {
  const raw = await readFile(path.join(dataDir, STORE_FILE_NAME), "utf8");
  return JSON.parse(raw) as ReturnType<typeof buildSeedDocument>;
}

/** How many audit lines the store holds (the seed writes none). */
async function auditCount(): Promise<number> {
  return (await repository.listAudit({ limit: 1000 })).length;
}

describe("seed on first use", () => {
  it("creates the document in CHURCH_DATA_DIR and reports where it is", async () => {
    const status = await repository.status();

    expect(status.driver).toBe("json");
    expect(status.location).toBe(path.resolve(dataDir));
    expect(typeof status.lastUpdatedAt).toBe("string");

    const entries = await readdir(dataDir);
    expect(entries).toEqual([STORE_FILE_NAME]);
  });

  it("seeds the parish's real baseline — and NO audit lines and NO subscribers", async () => {
    // The seed is written lazily by the FIRST read, so trigger one before inspecting the file.
    await repository.status();

    const document = await readDocument();
    const seed = buildSeedDocument();

    expect(document.schemaVersion).toBe(2);
    expect(document.series).toHaveLength(seed.series.length);
    expect(document.events).toHaveLength(seed.events.length);
    expect(document.terms).toHaveLength(seed.terms.length);
    expect(document.series.length).toBeGreaterThan(0);
    expect(document.terms.length).toBeGreaterThan(0);
    // People are not content: a seeded subscriber would be an invented e-mail address.
    expect(document.subscribers).toEqual([]);
    expect(document.audit).toEqual([]);
  });

  it("reads the EXISTING document on the second use instead of seeding over it", async () => {
    const created = await repository.createEvent(
      { slug: "kept-across-restart", titleAr: "فعالية محفوظة", startsAt: "2026-10-04T04:00:00.000Z" },
      STAFF
    );

    // A brand-new instance with no shared memory — only the file on disk.
    const reopened = new JsonEventRepository();

    await expect(reopened.getEvent(created.id)).resolves.toMatchObject({ slug: "kept-across-restart" });
    const viaFile = await reopened.listEvents();
    expect(viaFile.some((event) => event.id === created.id)).toBe(true);
  });
});

describe("create → read back", () => {
  it("stores an event, defaults it to draft, and finds it by id and by slug", async () => {
    const created = await repository.createEvent(
      {
        slug: "nayrouz-2026",
        titleAr: "قداس عيد النيروز",
        titleEn: "Nayrouz Liturgy",
        startsAt: "2026-09-11T04:00:00.000Z",
        endsAt: "2026-09-11T06:00:00.000Z",
        summaryAr: "أول أيام السنة القبطية",
      },
      STAFF
    );

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.status).toBe("draft");
    expect(created.seriesId).toBeNull();
    expect(created.isExceptionOf).toBeNull();
    expect(created.timezone).toBe("Africa/Cairo");
    expect(created.createdBy).toBe(STAFF.id);
    expect(created.termIds).toEqual([]);

    await expect(repository.getEvent(created.id)).resolves.toMatchObject({ slug: "nayrouz-2026" });
    await expect(repository.getEventBySlug("nayrouz-2026")).resolves.toMatchObject({ id: created.id });
    await expect(repository.getEvent("no-such-id")).resolves.toBeNull();
  });

  it("refuses a duplicate slug with a `conflict` StoreError — the Code, not a driver message", async () => {
    await repository.createEvent({ slug: "same-slug", titleAr: "أولى", startsAt: "2026-10-04T04:00:00.000Z" }, STAFF);

    const failure = await repository
      .createEvent({ slug: "same-slug", titleAr: "ثانية", startsAt: "2026-10-05T04:00:00.000Z" }, STAFF)
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(StoreError);
    expect((failure as StoreError).code).toBe("conflict");
    expect((failure as StoreError).operation).toBe("events.create");
  });

  it("refuses a venue/term that does not exist instead of writing a dangling reference", async () => {
    const failure = await repository
      .createEvent(
        { slug: "bad-venue", titleAr: "فعالية", startsAt: "2026-10-04T04:00:00.000Z", venueId: "ghost-venue" },
        STAFF
      )
      .catch((error: unknown) => error);

    expect((failure as StoreError).code).toBe("invalid");
  });

  it("filters by status and by window, comparing instants rather than strings", async () => {
    await repository.createEvent(
      { slug: "published-1", titleAr: "منشورة", startsAt: "2026-10-04T04:00:00.000Z", status: "published" },
      STAFF
    );
    await repository.createEvent({ slug: "draft-1", titleAr: "مسودة", startsAt: "2026-11-01T04:00:00.000Z" }, STAFF);

    // The seed already carries a published broadcast row, so this asserts on membership.
    const published = await repository.listEvents({ status: "published" });
    expect(published.map((event) => event.slug)).toContain("published-1");
    expect(published.map((event) => event.slug)).not.toContain("draft-1");

    const drafts = await repository.listEvents({ status: "draft" });
    expect(drafts.map((event) => event.slug)).toEqual(["draft-1"]);

    const inOctober = await repository.listEvents({ from: "2026-10-01T00:00:00.000Z", to: "2026-10-31T23:59:59.000Z" });
    expect(inOctober.map((event) => event.slug)).toEqual(["published-1"]);
  });

  it("compares window bounds as INSTANTS, never as strings", async () => {
    await repository.createEvent(
      { slug: "offset-event", titleAr: "فعالية", startsAt: "2026-10-04T04:00:00.000Z", status: "published" },
      STAFF
    );

    // "2026-10-04T05:00:00+02:00" IS 03:00Z — an hour BEFORE the event, so the event is inside the
    // window. Compared as strings the event would read as smaller than the bound and be dropped.
    const included = await repository.listEvents({ from: "2026-10-04T05:00:00+02:00" });
    expect(included.map((event) => event.slug)).toEqual(["offset-event"]);
  });
});

describe("publish", () => {
  it("moves a draft to published and records the transition in the audit trail", async () => {
    const created = await repository.createEvent(
      { slug: "to-publish", titleAr: "قداس الجمعة", startsAt: "2026-10-04T04:00:00.000Z" },
      STAFF
    );

    const published = await repository.setEventStatus(created.id, "published", STAFF);
    expect(published.status).toBe("published");
    await expect(repository.getEvent(created.id)).resolves.toMatchObject({ status: "published" });

    const [entry] = await repository.listAudit({ entityId: created.id });
    expect(entry.action).toBe("publish");
    expect((entry.before as { status: string }).status).toBe("draft");
    expect((entry.after as { status: string }).status).toBe("published");
  });

  it("refuses to change a status for an id that does not exist", async () => {
    const failure = await repository
      .setEventStatus("ghost", "published", STAFF)
      .catch((error: unknown) => error);

    expect((failure as StoreError).code).toBe("not_found");
  });
});

describe("the audit trail: one line per mutation, carrying actor + before/after", () => {
  it("appends EXACTLY one entry per mutation, in order, with the actor on every line", async () => {
    expect(await auditCount()).toBe(0);

    const event = await repository.createEvent(
      { slug: "audited", titleAr: "فعالية مُدقَّقة", startsAt: "2026-10-04T04:00:00.000Z" },
      STAFF
    );
    expect(await auditCount()).toBe(1);

    await repository.updateEvent(event.id, { titleAr: "فعالية مُحدَّثة" }, STAFF);
    expect(await auditCount()).toBe(2);

    await repository.setEventStatus(event.id, "published", STAFF);
    expect(await auditCount()).toBe(3);

    const series = await repository.createSeries(
      {
        titleAr: "قداس أسبوعي",
        startTime: "07:00",
        durationMinutes: 90,
        rule: {
          freq: "weekly",
          interval: 1,
          byWeekday: [0],
          byMonthDay: null,
          startDate: "2026-10-01",
          endDate: null,
          timezone: "Africa/Cairo",
        },
      },
      STAFF
    );
    expect(await auditCount()).toBe(4);

    await repository.upsertException(
      { seriesId: series.id, occurrenceDate: "2026-10-11", kind: "cancelled", reasonAr: "جنازة" },
      STAFF
    );
    expect(await auditCount()).toBe(5);

    await repository.deleteEvent(event.id, STAFF);
    expect(await auditCount()).toBe(6);

    const entries = await repository.listAudit({ limit: 1000 });
    // Newest first.
    expect(entries.map((entry) => entry.action)).toEqual([
      "delete",
      "cancel",
      "create",
      "publish",
      "update",
      "create",
    ]);

    for (const entry of entries) {
      expect(entry.actorId).toBe(STAFF.id);
      expect(entry.actorName).toBe(STAFF.name);
      expect(entry.summary.length).toBeGreaterThan(0);
      expect(entry.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("recording a create: no `before`, a full `after`", async () => {
    await repository.createEvent({ slug: "snapshot-create", titleAr: "جديدة", startsAt: "2026-10-04T04:00:00.000Z" }, STAFF);

    const [entry] = await repository.listAudit({ action: "create" });
    expect(entry.before).toBeNull();
    expect(entry.after).toMatchObject({ slug: "snapshot-create", titleAr: "جديدة", status: "draft" });
  });

  it("recording a publish: both sides present, so the transition is readable", async () => {
    const event = await repository.createEvent(
      { slug: "snapshot-publish", titleAr: "قداس", startsAt: "2026-10-04T04:00:00.000Z" },
      STAFF
    );
    await repository.setEventStatus(event.id, "published", STAFF);

    const [entry] = await repository.listAudit({ action: "publish" });
    expect(entry.before).not.toBeNull();
    expect(entry.after).not.toBeNull();
    expect(entry.summary).toContain("نشر");
  });

  it("recording a delete: the removed row is kept in `before`, nothing follows", async () => {
    const event = await repository.createEvent(
      { slug: "snapshot-delete", titleAr: "ستُحذف", startsAt: "2026-10-04T04:00:00.000Z" },
      STAFF
    );
    await repository.deleteEvent(event.id, STAFF);

    const [entry] = await repository.listAudit({ action: "delete" });
    expect(entry.before).toMatchObject({ slug: "snapshot-delete" });
    expect(entry.after).toBeNull();
    await expect(repository.getEvent(event.id)).resolves.toBeNull();
  });

  it("a snapshot is a CLONE: a later edit cannot rewrite history", async () => {
    const event = await repository.createEvent(
      { slug: "immutable-history", titleAr: "الاسم الأول", startsAt: "2026-10-04T04:00:00.000Z" },
      STAFF
    );
    await repository.updateEvent(event.id, { titleAr: "الاسم الثاني" }, STAFF);

    const createEntry = (await repository.listAudit({ action: "create" })).at(-1);
    expect((createEntry?.after as { titleAr: string }).titleAr).toBe("الاسم الأول");
  });

  it("an audit-only note carries NO state change at all (that is what a refusal is)", async () => {
    const before = await auditCount();

    await repository.recordAuditNote(
      { action: "denied", entityType: "event", entityId: "attempted-1", summary: "رُفض إجراء «حذف فعالية»." },
      STAFF
    );

    expect(await auditCount()).toBe(before + 1);
    const [entry] = await repository.listAudit({ action: "denied" });
    expect(entry.before).toBeNull();
    expect(entry.after).toBeNull();
    expect(entry.entityId).toBe("attempted-1");
    expect(entry.summary).toContain("رُفض إجراء");
  });

  it("writes no leftover temp files — one mutation is one document version", async () => {
    await repository.createEvent({ slug: "tmp-check", titleAr: "فعالية", startsAt: "2026-10-04T04:00:00.000Z" }, STAFF);

    expect(await readdir(dataDir)).toEqual([STORE_FILE_NAME]);
  });
});

describe("subscribers: subscribe is idempotent by contract", () => {
  const visitor: Actor = VISITOR;

  it("stores one row for one address, whatever the spelling", async () => {
    const first = await repository.subscribe(
      { email: "Nour@Example.com", name: "نور", locale: "ar", topics: ["Liturgy", "  youth "] },
      visitor
    );

    expect(first.created).toBe(true);
    expect(first.subscriber.email).toBe("nour@example.com");
    expect(first.subscriber.topics).toEqual(["liturgy", "youth"]);
    expect(first.subscriber.isActive).toBe(true);
    expect(first.subscriber.confirmedAt).not.toBeNull();

    const second = await repository.subscribe(
      { email: "  NOUR@example.COM  ", locale: "en", topics: ["meeting"] },
      visitor
    );

    expect(second.created).toBe(false);
    expect(second.subscriber.id).toBe(first.subscriber.id);
    expect(second.subscriber.topics).toEqual(["meeting"]);
    expect(second.subscriber.locale).toBe("en");
    // The name the visitor typed the first time is kept when the second submit omits it.
    expect(second.subscriber.name).toBe("نور");

    // ONE row, not two — this is what makes the UNIQUE constraint meaningful.
    const document = await readDocument();
    expect(document.subscribers).toHaveLength(1);

    const rows = await repository.listSubscribers();
    expect(rows).toHaveLength(1);
  });

  it("records a create and then an update, never a second create", async () => {
    await repository.subscribe({ email: "dup@example.com", locale: "ar" }, visitor);
    await repository.subscribe({ email: "dup@example.com", locale: "ar" }, visitor);

    const entries = await repository.listAudit({ entityType: "subscriber", limit: 100 });
    expect(entries.map((entry) => entry.action)).toEqual(["update", "create"]);
    expect(entries.every((entry) => entry.actorName === VISITOR.name)).toBe(true);
    expect(entries[0].actorId).toBeNull(); // a public write names the visitor as precisely as it can
  });

  it("retires a subscription without deleting it, and a re-subscribe revives it", async () => {
    const { subscriber } = await repository.subscribe({ email: "retired@example.com", locale: "ar" }, visitor);

    const retired = await repository.setSubscriberActive(subscriber.id, false, STAFF);
    expect(retired.isActive).toBe(false);
    // Hidden from the default listing …
    expect(await repository.listSubscribers()).toHaveLength(0);
    // … but still on file, because the decision must stay reversible.
    expect(await repository.listSubscribers({ includeInactive: true })).toHaveLength(1);

    const revived = await repository.subscribe({ email: "retired@example.com", locale: "ar" }, visitor);
    expect(revived.created).toBe(false);
    expect(revived.subscriber.id).toBe(subscriber.id);
    expect(revived.subscriber.isActive).toBe(true);

    const [latest] = await repository.listAudit({ entityType: "subscriber" });
    expect(latest.summary).toContain("تنشيط");
  });

  it("refuses an empty or over-long address instead of storing a junk row", async () => {
    for (const email of ["", "   ", `${"a".repeat(250)}@example.com`]) {
      const failure = await repository.subscribe({ email, locale: "ar" }, visitor).catch((error: unknown) => error);
      expect((failure as StoreError).code).toBe("invalid");
    }

    expect(await repository.listSubscribers({ includeInactive: true })).toHaveLength(0);
  });
});

describe("series + occurrence exceptions survive a round trip through the file", () => {
  it("stores a weekly series and its single-occurrence deviations", async () => {
    const series = await repository.createSeries(
      {
        titleAr: "قداس الجمعة",
        startTime: "07:00",
        durationMinutes: 90,
        rule: {
          freq: "weekly",
          interval: 1,
          byWeekday: [5],
          byMonthDay: null,
          startDate: "2026-10-01",
          endDate: null,
          timezone: "Africa/Cairo",
        },
      },
      STAFF
    );

    await repository.upsertException(
      { seriesId: series.id, occurrenceDate: "2026-10-09", kind: "cancelled", reasonAr: "تعارض" },
      STAFF
    );
    await repository.upsertException(
      { seriesId: series.id, occurrenceDate: "2026-10-16", kind: "moved", movedToDate: "2026-10-20" },
      STAFF
    );

    // A fresh instance reads it all back from disk.
    const reopened = new JsonEventRepository();
    const exceptions = await reopened.listExceptions(series.id);

    expect(exceptions).toHaveLength(2);
    expect(exceptions[0]).toMatchObject({ occurrenceDate: "2026-10-09", kind: "cancelled", reasonAr: "تعارض" });
    expect(exceptions[1]).toMatchObject({ occurrenceDate: "2026-10-16", kind: "moved", movedToDate: "2026-10-20" });

    // Re-upserting the same (series, date) REPLACES rather than duplicating.
    await reopened.upsertException(
      { seriesId: series.id, occurrenceDate: "2026-10-09", kind: "moved", movedToDate: "2026-10-11" },
      STAFF
    );
    const after = await reopened.listExceptions(series.id);
    expect(after).toHaveLength(2);
    expect(after[0]).toMatchObject({ occurrenceDate: "2026-10-09", kind: "moved", movedToDate: "2026-10-11" });
  });

  it("refuses a moved occurrence with no destination", async () => {
    const series = await repository.createSeries(
      {
        titleAr: "سلسلة",
        startTime: "07:00",
        rule: {
          freq: "weekly",
          interval: 1,
          byWeekday: [0],
          byMonthDay: null,
          startDate: "2026-10-01",
          endDate: null,
          timezone: "Africa/Cairo",
        },
      },
      STAFF
    );

    const failure = await repository
      .upsertException({ seriesId: series.id, occurrenceDate: "2026-10-04", kind: "moved", movedToDate: null }, STAFF)
      .catch((error: unknown) => error);

    expect((failure as StoreError).code).toBe("invalid");
  });
});
