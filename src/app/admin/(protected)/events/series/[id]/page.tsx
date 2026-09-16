// src/app/admin/(protected)/events/series/[id]/page.tsx
// `/admin/events/series/[id]` — the series editor PLUS its per-occurrence controls.
//
// Two things live here because they are two views of one object: the RULE (edited with the series
// form) and the DEVIATIONS from it (cancelled/moved single dates, handled by the occurrences panel).
// Keeping them on one screen is what stops "cancel this Friday" from being confused with "change the
// Friday time for ever" — the second edits the rule, the first writes an exception.
//
// The occurrences are the ENGINE's expansion for the next window, deviations included: cancelled
// dates appear as "ملغى" and relocated ones as "منقول من موعده", which is exactly the audit a
// secretary needs before deciding to cancel another date.

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeriesEditorForm } from "../../_components/SeriesEditorForm";
import { SeriesOccurrencesPanel } from "../../_components/SeriesOccurrencesPanel";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminForbiddenNotice } from "@/components/admin/AdminForbiddenNotice";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  ADMIN_ROLE_LABELS_AR,
  adminRoleFromStaffRole,
  resolveAdminCapabilities,
  type AdminCapabilities,
} from "@/lib/domain/capabilities";
import { getAdminSeriesDetail, type AdminSeriesDetail, type AdminTaxonomyGroup } from "@/lib/events/admin";
import { seriesToFormState } from "@/lib/events/admin-form";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { getLocale } from "@/lib/i18n/server";

export const metadata = {
  title: "تعديل سلسلة متكررة — لوحة تحكم كنيسة القديسين",
};

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);
  const capabilities: AdminCapabilities = resolveAdminCapabilities(role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";

  if (!capabilities.seriesWrite && !capabilities.exceptionWrite) {
    return <AdminForbiddenNotice capability="series:update" roleLabel={roleLabel} />;
  }

  let locale: Locale = DEFAULT_LOCALE;
  let payload: { detail: AdminSeriesDetail; taxonomy: AdminTaxonomyGroup[] } | null = null;
  let readFailed = false;

  try {
    locale = await getLocale();
    payload = await getAdminSeriesDetail(id);
  } catch (error) {
    // Server-side detail only — no driver name, code or stack reaches the markup.
    console.error("[admin] series read failed", {
      id,
      reason: error instanceof Error ? error.message : String(error),
    });
    readFailed = true;
  }

  // `notFound()` throws, so it is raised OUTSIDE the catch: a missing series must not be reported as
  // an unreadable store.
  if (!readFailed && !payload) notFound();

  if (readFailed || !payload) {
    return (
      <div className="max-w-3xl space-y-6">
        <AdminPageHeader title="تعديل سلسلة متكررة" description="تعذّر تحميل بيانات السلسلة." roleLabel={roleLabel} />
        <AdminFeedback
          tone="error"
          title="تعذّر تحميل البيانات"
          message="لم يتغيّر أي محتوى. أعد تحميل الصفحة، وإن تكرر الخطأ راجع مسؤول النظام مع معرّف السلسلة أدناه."
        />
        <p className="font-english text-[11px] text-slate-500" dir="ltr">
          {id}
        </p>
      </div>
    );
  }

  const { detail, taxonomy } = payload;

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        title="تعديل سلسلة متكررة"
        description="عدّل قاعدة التكرار أو بيانات السلسلة، وأدر المواعيد القادمة: إلغاء موعد واحد أو نقله يُسجَّل كاستثناء على هذا التاريخ فقط."
        roleLabel={roleLabel}
      >
        <Link href="/admin/events" className={ADMIN_BUTTON_SECONDARY}>
          العودة إلى القائمة
        </Link>
        <Link href={`/events/${encodeURIComponent(`series-${detail.series.id}`)}`} className={ADMIN_BUTTON_SECONDARY}>
          معاينة الصفحة العامة
        </Link>
      </AdminPageHeader>

      {detail.ruleProblemAr ? (
        <AdminFeedback tone="error" title="قاعدة التكرار" message={detail.ruleProblemAr} />
      ) : null}

      {detail.exceptions.length > 0 ? (
        <AdminFeedback
          tone="info"
          title="استثناءات مسجَّلة"
          message={`توجد ${detail.exceptions.length} استثناءات على هذه السلسلة (إلغاء أو نقل مواعيد فردية). تظهر كلها في القائمة أدناه، ويمكن التراجع عن أي منها.`}
        />
      ) : null}

      <SeriesEditorForm
        mode="edit"
        seriesId={detail.series.id}
        initial={seriesToFormState(detail.series)}
        taxonomy={taxonomy}
        locale={locale}
        capabilities={capabilities}
      />

      <SeriesOccurrencesPanel
        seriesId={detail.series.id}
        occurrences={detail.occurrences}
        locale={locale}
        capabilities={capabilities}
      />
    </div>
  );
}
