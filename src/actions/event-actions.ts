"use server";

// src/actions/event-actions.ts
// The authenticated write surface of the events system: events, series, per-occurrence deviations,
// taxonomy, media and the manual cache republish.
//
// EVERY ACTION FOLLOWS THE SAME FOUR STEPS — in this order:
//
//   1. `requireStaff()`  — identity and the `/admin` role gate (redirects when there is no session,
//      FAILS CLOSED when the environment is missing; the middleware is never the only check).
//   2. `can(role, …)`    — the capability check from `src/lib/domain/capabilities.ts`. A secretary
//      (editor) can author and publish; only an admin (owner) may delete; a viewer may only read.
//   3. zod               — the payload is validated at the boundary (`src/lib/validations/event-schemas.ts`).
//   4. the repository    — which appends the audit entry for the mutation (both drivers do).
//
// Only after the repository confirms the change do these actions invalidate the public caches
// (`revalidateTag`/`revalidatePath` in `src/lib/store/revalidate.ts`), so a published event appears
// without a rebuild and an unauthorised or failed attempt invalidates nothing.
//
// RESULT MESSAGES ARE ARABIC ON PURPOSE: the staff area is Arabic-only, exactly like the existing
// `/admin` booking actions. The public bilingual dictionary lives in `src/lib/i18n/messages.ts`.

import { requireStaff, type StaffSession } from "@/lib/auth/require-staff";
import {
  CAPABILITY_DENIED_MESSAGE_AR,
  adminRoleFromStaffRole,
  can,
  describeRefusal,
  type AdminRole,
  type Capability,
} from "@/lib/domain/capabilities";
import type { Actor, EventStatus } from "@/lib/domain/types";
import { getEventRepository, isStoreError, type EventRepository, type RepositoryStatus } from "@/lib/store";
import { republishEventSurfaces, revalidateEventSurfaces, type RepublishResult } from "@/lib/store/revalidate";
import {
  EventCreateSchema,
  EventExceptionSchema,
  EventSeriesCreateSchema,
  EventSeriesUpdateSchema,
  EventUpdateSchema,
  MediaSchema,
  MediaUpdateSchema,
  OccurrenceRefSchema,
  RescheduleOccurrenceSchema,
  TaxonomyTermSchema,
  TaxonomyTermUpdateSchema,
  UuidSchema,
  firstIssueMessage,
} from "@/lib/validations/event-schemas";
import { z } from "zod";

/** Discriminated result so a caller cannot read `data` without checking `success` first. */
export type EventActionResult<T> = { success: true; message: string; data: T } | { success: false; message: string };

interface AuthorizedActor {
  session: StaffSession;
  actor: Actor;
  role: AdminRole;
}

/**
 * Steps 1 and 2. Throws (redirects) when there is no staff session; returns a refusal when the
 * session exists but lacks the capability.
 *
 * A REFUSAL IS RECORDED: the attempt is appended to the audit trail (one `denied` entry naming the
 * capability and the acting role) before the refusal is returned, so a refusal is as auditable as a
 * change. Recording is BEST EFFORT on purpose — if the store cannot be written, the refusal still
 * stands and the failure is logged; an unauthorised caller must never be able to turn the audit
 * write into an error path.
 */
async function authorize(capability: Capability): Promise<{ ok: true; auth: AuthorizedActor } | { ok: false; message: string }> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, capability)) {
    console.warn("[events] capability denied", {
      capability,
      role,
      userId: session.userId,
    });

    try {
      const note = describeRefusal(capability, role);
      await getEventRepository().recordAuditNote(
        {
          action: "denied",
          entityType: note.entityType,
          // The attempt names no row, so the entry is anchored to the acting staff member.
          entityId: session.userId,
          summary: note.summary,
        },
        { id: session.userId, name: session.fullNameAr }
      );
    } catch (error) {
      console.error("[events] refusal could not be recorded", {
        capability,
        role,
        userId: session.userId,
        reason: error instanceof Error ? error.message : String(error),
      });
    }

    return { ok: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  return { ok: true, auth: { session, actor: { id: session.userId, name: session.fullNameAr }, role } };
}

/** Maps a driver failure onto an Arabic message and logs the technical detail. */
function describeStoreFailure(operation: string, error: unknown): string {
  if (isStoreError(error)) {
    console.error("[events] store failure", {
      operation,
      code: error.code,
      message: error.message,
      detail: error.detail,
    });
    switch (error.code) {
      case "not_found":
        return "لم يُعثر على السجل المطلوب، قد يكون حُذف أو تغيّر من جهاز آخر.";
      case "conflict":
        return "هذا الإجراء يتعارض مع سجل موجود بالفعل (سلَج مستخدم أو موعد مكرر).";
      case "invalid":
        return "البيانات غير متوافقة مع محتوى الموقع (مرجع غير موجود).";
      default:
        return "تعذّر الوصول إلى مخزن البيانات، يرجى إعادة المحاولة.";
    }
  }

  console.error("[events] unexpected failure", {
    operation,
    message: error instanceof Error ? error.message : String(error),
  });
  return "حدث خطأ غير متوقع أثناء تنفيذ الإجراء.";
}

/**
 * The shared body of every mutation: authorize → run → describe failure → invalidate caches.
 * `work` receives the repository and the resolved actor, so no action can forget the audit identity.
 */
async function mutate<T>(
  operation: string,
  capability: Capability,
  successMessage: string,
  work: (repository: EventRepository, actor: Actor) => Promise<T>
): Promise<EventActionResult<T>> {
  const authorization = await authorize(capability);
  if (!authorization.ok) {
    return { success: false, message: authorization.message };
  }

  try {
    const data = await work(getEventRepository(), authorization.auth.actor);
    revalidateEventSurfaces();
    return { success: true, message: successMessage, data };
  } catch (error) {
    return { success: false, message: describeStoreFailure(operation, error) };
  }
}

/**
 * Parse helper: returns the parsed value or a ready-to-return failure result.
 *
 * The schema is typed `ZodType<Output, ZodTypeDef, unknown>` — i.e. only its OUTPUT matters here —
 * because the input schemas apply defaults (`byWeekday`, `timezone`, …), so their input and output
 * types differ and letting TypeScript infer `T` from the input side would silently produce
 * half-parsed values.
 */
function parseOrFail<TOutput>(
  schema: z.ZodType<TOutput, z.ZodTypeDef, unknown>,
  payload: unknown
): { ok: true; value: TOutput } | { ok: false; success: false; message: string } {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, success: false, message: firstIssueMessage(parsed.error) };
  }
  return { ok: true, value: parsed.data };
}

// ============================================================================
// Events
// ============================================================================

/** Creates an event. Editor and above. */
export async function createEventAction(payload: unknown): Promise<EventActionResult<{ id: string; slug: string }>> {
  const parsed = parseOrFail(EventCreateSchema, payload);
  if (!parsed.ok) return parsed;

  return mutate("events.create", "event:create", "تم إنشاء الفعالية بنجاح.", async (repository, actor) => {
    const event = await repository.createEvent(parsed.value, actor);
    return { id: event.id, slug: event.slug };
  });
}

/** Applies a partial update. Editor and above. */
export async function updateEventAction(
  eventId: string,
  patch: unknown
): Promise<EventActionResult<{ id: string; updatedAt: string }>> {
  const parsedId = parseOrFail(UuidSchema, eventId);
  if (!parsedId.ok) return parsedId;
  const parsed = parseOrFail(EventUpdateSchema, patch);
  if (!parsed.ok) return parsed;

  return mutate("events.update", "event:update", "تم حفظ التعديلات.", async (repository, actor) => {
    const event = await repository.updateEvent(parsedId.value, parsed.value, actor);
    return { id: event.id, updatedAt: event.updatedAt };
  });
}

async function setEventStatusAction(
  eventId: string,
  status: EventStatus,
  successMessage: string,
  reason?: { ar?: string | null; en?: string | null }
): Promise<EventActionResult<{ id: string; status: EventStatus }>> {
  const parsedId = parseOrFail(UuidSchema, eventId);
  if (!parsedId.ok) return parsedId;

  const capability: Capability =
    status === "cancelled" ? "event:cancel" : status === "published" ? "event:publish" : "event:unpublish";

  return mutate("events.setStatus", capability, successMessage, async (repository, actor) => {
    const event = await repository.setEventStatus(parsedId.value, status, actor, reason);
    return { id: event.id, status: event.status };
  });
}

/** Publishes an event (makes it visible on the public site). Editor and above. */
export async function publishEventAction(eventId: string): Promise<EventActionResult<{ id: string; status: EventStatus }>> {
  return setEventStatusAction(eventId, "published", "تم نشر الفعالية.");
}

/** Returns an event to draft (removes it from the public site). Editor and above. */
export async function unpublishEventAction(eventId: string): Promise<EventActionResult<{ id: string; status: EventStatus }>> {
  return setEventStatusAction(eventId, "draft", "تم إلغاء نشر الفعالية.");
}

/** Archives an event. Editor and above. */
export async function archiveEventAction(eventId: string): Promise<EventActionResult<{ id: string; status: EventStatus }>> {
  return setEventStatusAction(eventId, "archived", "تمت أرشفة الفعالية.");
}

/** Cancels a WHOLE event, with an optional reason kept in the audit trail. Editor and above. */
export async function cancelEventAction(
  eventId: string,
  reason?: string
): Promise<EventActionResult<{ id: string; status: EventStatus }>> {
  const trimmed = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
  return setEventStatusAction(
    eventId,
    "cancelled",
    trimmed ? `تم إلغاء الفعالية. السبب المسجّل: ${trimmed}` : "تم إلغاء الفعالية.",
    trimmed ? { ar: trimmed } : undefined
  );
}

/** Copies an event as a new draft. Editor and above. */
export async function duplicateEventAction(
  eventId: string,
  overrides?: unknown
): Promise<EventActionResult<{ id: string; slug: string }>> {
  const parsedId = parseOrFail(UuidSchema, eventId);
  if (!parsedId.ok) return parsedId;
  const parsedOverrides = parseOrFail(EventUpdateSchema, overrides ?? {});
  if (!parsedOverrides.ok) return parsedOverrides;

  return mutate("events.duplicate", "event:duplicate", "تم إنشاء نسخة مسودة من الفعالية.", async (
    repository,
    actor
  ) => {
    const copy = await repository.duplicateEvent(parsedId.value, actor, parsedOverrides.value);
    return { id: copy.id, slug: copy.slug };
  });
}

/** Deletes an event permanently. OWNER ONLY. */
export async function deleteEventAction(eventId: string): Promise<EventActionResult<{ id: string }>> {
  const parsedId = parseOrFail(UuidSchema, eventId);
  if (!parsedId.ok) return parsedId;

  return mutate("events.delete", "event:delete", "تم حذف الفعالية نهائياً.", async (repository, actor) => {
    await repository.deleteEvent(parsedId.value, actor);
    return { id: parsedId.value };
  });
}

/** Replaces the taxonomy links of an event. Editor and above. */
export async function setEventTermsAction(
  eventId: string,
  termIds: readonly string[]
): Promise<EventActionResult<{ id: string; termIds: string[] }>> {
  const parsedId = parseOrFail(UuidSchema, eventId);
  if (!parsedId.ok) return parsedId;
  const parsedTerms = parseOrFail(z.array(UuidSchema).max(40), [...termIds]);
  if (!parsedTerms.ok) return parsedTerms;

  return mutate("events.setTerms", "event:update", "تم تحديث تصنيفات الفعالية.", async (repository, actor) => {
    const event = await repository.setEventTerms(parsedId.value, parsedTerms.value, actor);
    return { id: event.id, termIds: event.termIds };
  });
}

// ============================================================================
// Series + single occurrences
// ============================================================================

/** Creates a recurring series. Editor and above. */
export async function createSeriesAction(payload: unknown): Promise<EventActionResult<{ id: string }>> {
  const parsed = parseOrFail(EventSeriesCreateSchema, payload);
  if (!parsed.ok) return parsed;

  return mutate("series.create", "event:create", "تم إنشاء السلسلة المتكررة.", async (repository, actor) => {
    const series = await repository.createSeries(parsed.value, actor);
    return { id: series.id };
  });
}

/** Updates a series (rule, time, venue, terms, status). Editor and above. */
export async function updateSeriesAction(seriesId: string, patch: unknown): Promise<EventActionResult<{ id: string }>> {
  const parsedId = parseOrFail(UuidSchema, seriesId);
  if (!parsedId.ok) return parsedId;
  const parsed = parseOrFail(EventSeriesUpdateSchema, patch);
  if (!parsed.ok) return parsed;

  return mutate("series.update", "series:update", "تم حفظ تعديلات السلسلة.", async (repository, actor) => {
    const series = await repository.updateSeries(parsedId.value, parsed.value, actor);
    return { id: series.id };
  });
}

/** Publishes a series. Editor and above. */
export async function publishSeriesAction(seriesId: string): Promise<EventActionResult<{ id: string }>> {
  const parsedId = parseOrFail(UuidSchema, seriesId);
  if (!parsedId.ok) return parsedId;

  return mutate("series.publish", "event:publish", "تم نشر السلسلة.", async (repository, actor) => {
    const series = await repository.updateSeries(parsedId.value, { status: "published" }, actor);
    return { id: series.id };
  });
}

/**
 * Cancels EVERY remaining occurrence of a series (the series itself becomes `cancelled`).
 * Editor and above. The reason is kept in the audit trail: a series row has no reason column.
 */
export async function cancelSeriesAction(seriesId: string, reason?: string): Promise<EventActionResult<{ id: string }>> {
  const parsedId = parseOrFail(UuidSchema, seriesId);
  if (!parsedId.ok) return parsedId;
  const trimmed = typeof reason === "string" ? reason.trim().slice(0, 500) : "";

  return mutate(
    "series.cancel",
    "series:cancel",
    trimmed ? `تم إلغاء السلسلة. السبب المسجّل: ${trimmed}` : "تم إلغاء السلسلة بكل مواعيدها القادمة.",
    async (repository, actor) => {
      const series = await repository.cancelSeries(parsedId.value, actor, trimmed ? { ar: trimmed } : undefined);
      return { id: series.id };
    }
  );
}

/** Cancels ONE occurrence of a series; the rest of the series is untouched. Editor and above. */
export async function cancelOccurrenceAction(
  seriesId: string,
  occurrenceDate: string,
  reason?: string
): Promise<EventActionResult<{ exceptionId: string }>> {
  const trimmedReason = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
  const parsed = parseOrFail(EventExceptionSchema, {
    seriesId,
    occurrenceDate,
    kind: "cancelled",
    movedToDate: null,
    reasonAr: trimmedReason.length > 0 ? trimmedReason : null,
  });
  if (!parsed.ok) return parsed;

  return mutate("exceptions.cancel", "event:cancel", "تم إلغاء هذا الموعد فقط.", async (repository, actor) => {
    const exception = await repository.upsertException(parsed.value, actor);
    return { exceptionId: exception.id };
  });
}

/** Moves ONE occurrence to another date; the rest of the series is untouched. Editor and above. */
export async function rescheduleOccurrenceAction(
  seriesId: string,
  occurrenceDate: string,
  movedToDate: string,
  reason?: string
): Promise<EventActionResult<{ exceptionId: string; movedToDate: string }>> {
  const trimmedReason = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
  const parsed = parseOrFail(RescheduleOccurrenceSchema, {
    seriesId,
    occurrenceDate,
    movedToDate,
    reasonAr: trimmedReason.length > 0 ? trimmedReason : null,
  });
  if (!parsed.ok) return parsed;

  return mutate("exceptions.reschedule", "event:reschedule", "تم نقل هذا الموعد فقط.", async (repository, actor) => {
    const exception = await repository.upsertException({ ...parsed.value, kind: "moved" }, actor);
    return { exceptionId: exception.id, movedToDate: exception.movedToDate ?? movedToDate };
  });
}

/** Removes a per-occurrence deviation, restoring the series rule. Editor and above. */
export async function clearOccurrenceAction(
  seriesId: string,
  occurrenceDate: string
): Promise<EventActionResult<{ seriesId: string; occurrenceDate: string }>> {
  const parsed = parseOrFail(OccurrenceRefSchema, { seriesId, occurrenceDate });
  if (!parsed.ok) return parsed;

  return mutate("exceptions.clear", "exception:write", "تم إلغاء الاستثناء وإعادة الموعد الأصلي.", async (
    repository,
    actor
  ) => {
    const exception = await repository.getException(parsed.value.seriesId, parsed.value.occurrenceDate);
    if (!exception) {
      // Nothing to clear is a success, not an error: the caller's intent is already satisfied.
      return { seriesId: parsed.value.seriesId, occurrenceDate: parsed.value.occurrenceDate };
    }
    await repository.deleteException(exception.id, actor);
    return { seriesId: parsed.value.seriesId, occurrenceDate: parsed.value.occurrenceDate };
  });
}

// ============================================================================
// Taxonomy
// ============================================================================

/** Creates a taxonomy term. Editor and above. */
export async function createTaxonomyTermAction(payload: unknown): Promise<EventActionResult<{ id: string }>> {
  const parsed = parseOrFail(TaxonomyTermSchema, payload);
  if (!parsed.ok) return parsed;

  return mutate("terms.create", "taxonomy:write", "تم إضافة المصطلح.", async (repository, actor) => {
    const term = await repository.createTerm(parsed.value, actor);
    return { id: term.id };
  });
}

/** Updates a taxonomy term (including retiring it with `isActive: false`). Editor and above. */
export async function updateTaxonomyTermAction(
  termId: string,
  patch: unknown
): Promise<EventActionResult<{ id: string }>> {
  const parsedId = parseOrFail(UuidSchema, termId);
  if (!parsedId.ok) return parsedId;
  const parsed = parseOrFail(TaxonomyTermUpdateSchema, patch);
  if (!parsed.ok) return parsed;

  return mutate("terms.update", "taxonomy:write", "تم حفظ تعديلات المصطلح.", async (repository, actor) => {
    const term = await repository.updateTerm(parsedId.value, parsed.value, actor);
    return { id: term.id };
  });
}

/** Deletes an unused taxonomy term. OWNER ONLY. A term still in use must be retired instead. */
export async function deleteTaxonomyTermAction(termId: string): Promise<EventActionResult<{ id: string }>> {
  const parsedId = parseOrFail(UuidSchema, termId);
  if (!parsedId.ok) return parsedId;

  return mutate("terms.delete", "taxonomy:delete", "تم حذف المصطلح.", async (repository, actor) => {
    await repository.deleteTerm(parsedId.value, actor);
    return { id: parsedId.value };
  });
}

// ============================================================================
// Media metadata
// ============================================================================

/** Registers an uploaded file's metadata. The bytes are stored outside the repository. Editor and above. */
export async function registerMediaAction(payload: unknown): Promise<EventActionResult<{ id: string; url: string }>> {
  const parsed = parseOrFail(MediaSchema, payload);
  if (!parsed.ok) return parsed;

  return mutate("media.create", "media:create", "تم تسجيل الملف.", async (repository, actor) => {
    const media = await repository.createMedia(parsed.value, actor);
    return { id: media.id, url: media.url };
  });
}

/** Updates media metadata (alt text, visibility …). Editor and above. */
export async function updateMediaAction(mediaId: string, patch: unknown): Promise<EventActionResult<{ id: string }>> {
  const parsedId = parseOrFail(UuidSchema, mediaId);
  if (!parsedId.ok) return parsedId;
  const parsed = parseOrFail(MediaUpdateSchema, patch);
  if (!parsed.ok) return parsed;

  return mutate("media.update", "media:update", "تم تحديث بيانات الملف.", async (repository, actor) => {
    const media = await repository.updateMedia(parsedId.value, parsed.value, actor);
    return { id: media.id };
  });
}

/** Deletes media metadata. OWNER ONLY. */
export async function deleteMediaAction(mediaId: string): Promise<EventActionResult<{ id: string }>> {
  const parsedId = parseOrFail(UuidSchema, mediaId);
  if (!parsedId.ok) return parsedId;

  return mutate("media.delete", "media:delete", "تم حذف بيانات الملف.", async (repository, actor) => {
    await repository.deleteMedia(parsedId.value, actor);
    return { id: parsedId.value };
  });
}

// ============================================================================
// Operations: republish + status
// ============================================================================

/**
 * MANUAL CACHE CLEAR. Drops every events cache entry and returns the store's last-updated instant,
 * so a screen can show "آخر تحديث" without a rebuild of the site.
 */
export async function republishEventsAction(): Promise<EventActionResult<RepublishResult>> {
  const authorization = await authorize("cache:republish");
  if (!authorization.ok) {
    return { success: false, message: authorization.message };
  }

  try {
    const result = await republishEventSurfaces();
    return {
      success: true,
      message: `تم تحديث ذاكرة الموقع المؤقتة (${result.driver}). آخر تعديل على المحتوى: ${
        result.lastUpdatedAt ?? "لا يوجد بعد"
      }`,
      data: result,
    };
  } catch (error) {
    return { success: false, message: describeStoreFailure("cache.republish", error) };
  }
}

/** Driver, data location and last-mutation instant — read-only, for the admin overview. */
export async function getStoreStatusAction(): Promise<EventActionResult<RepositoryStatus>> {
  const authorization = await authorize("event:read");
  if (!authorization.ok) {
    return { success: false, message: authorization.message };
  }

  try {
    const status = await getEventRepository().status();
    return { success: true, message: "تم قراءة حالة المخزن.", data: status };
  } catch (error) {
    return { success: false, message: describeStoreFailure("store.status", error) };
  }
}
