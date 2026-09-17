"use client";

// apps/admin/src/components/content/ContentEntryList.tsx
// Interactive entry list for a specific Content Type.
// Filter by status (draft, published, archived), search, and perform quick actions.

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit,
  ExternalLink,
  CheckCircle2,
  Clock,
  Archive,
  FileText,
} from "lucide-react";
import type {
  ContentType,
  ContentField,
  ContentEntry,
  ContentStatus,
} from "@church-site/domain";
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_QUIET,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_INPUT,
  ADMIN_PANEL,
  ADMIN_TABLE,
  ADMIN_TD,
  ADMIN_TH,
} from "@/components/admin/admin-ui";

export interface ContentEntryListProps {
  contentType: ContentType;
  fields: ContentField[];
  entries: ContentEntry[];
  canCreate?: boolean;
  canEdit?: boolean;
}

export function ContentEntryList({
  contentType,
  fields,
  entries,
  canCreate = true,
  canEdit = true,
}: ContentEntryListProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Determine a title or preview field from fields
  const titleFieldSlug = useMemo(() => {
    const candidate = fields.find((f) =>
      ["title", "title_ar", "name", "name_ar", "headline"].includes(f.slug)
    );
    return candidate?.slug || fields[0]?.slug || null;
  }, [fields]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Status filter
      if (statusFilter !== "all" && entry.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const slugMatch = entry.slug.toLowerCase().includes(query);
        const dataMatch = Object.values(entry.data).some((val) => {
          if (typeof val === "string") return val.toLowerCase().includes(query);
          return false;
        });
        return slugMatch || dataMatch;
      }
      return true;
    });
  }, [entries, statusFilter, searchQuery]);

  const statusBadge = (status: ContentStatus) => {
    switch (status) {
      case "published":
        return (
          <span className={`${ADMIN_BADGE} bg-emerald-50 text-emerald-700 border border-emerald-200`}>
            <CheckCircle2 className="w-3 h-3" />
            <span>منشور</span>
          </span>
        );
      case "draft":
        return (
          <span className={`${ADMIN_BADGE} bg-amber-50 text-amber-700 border border-amber-200`}>
            <Clock className="w-3 h-3" />
            <span>مسودة</span>
          </span>
        );
      case "archived":
        return (
          <span className={`${ADMIN_BADGE} bg-slate-100 text-slate-600 border border-slate-200`}>
            <Archive className="w-3 h-3" />
            <span>مؤرشف</span>
          </span>
        );
    }
  };

  const getEntryTitle = (entry: ContentEntry) => {
    if (titleFieldSlug && entry.data[titleFieldSlug]) {
      return String(entry.data[titleFieldSlug]);
    }
    // Fallback: look for any non-empty string in data
    for (const val of Object.values(entry.data)) {
      if (typeof val === "string" && val.trim().length > 0) {
        return val.trim();
      }
    }
    return entry.slug;
  };

  return (
    <div className="space-y-5">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="بحث في عناصر المحتوى..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${ADMIN_INPUT} ps-9`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-copticNavy font-medium"
          >
            <option value="all">جميع الحالات ({entries.length})</option>
            <option value="published">
              منشور ({entries.filter((e) => e.status === "published").length})
            </option>
            <option value="draft">
              مسودة ({entries.filter((e) => e.status === "draft").length})
            </option>
            <option value="archived">
              مؤرشف ({entries.filter((e) => e.status === "archived").length})
            </option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/content-types/${contentType.id}/fields`}
            className={ADMIN_BUTTON_SECONDARY}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>إدارة الحقول ({fields.length})</span>
          </Link>

          {canCreate && (
            <Link
              href={`/content/${contentType.slug}/new`}
              className={ADMIN_BUTTON_PRIMARY}
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عنصر جديد</span>
            </Link>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={ADMIN_PANEL}>
        <div className="overflow-x-auto">
          <table className={ADMIN_TABLE}>
            <thead>
              <tr>
                <th className={ADMIN_TH}>العنوان / المعاينة</th>
                <th className={ADMIN_TH}>المعرّف اللطيف (Slug)</th>
                <th className={ADMIN_TH}>الحالة</th>
                <th className={ADMIN_TH}>تاريخ النشر / التحديث</th>
                <th className={`${ADMIN_TH} text-start`}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                  <td className={ADMIN_TD}>
                    <div>
                      <span className="font-bold text-copticNavy line-clamp-1">
                        {getEntryTitle(entry)}
                      </span>
                    </div>
                  </td>
                  <td className={ADMIN_TD}>
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                      {entry.slug}
                    </code>
                  </td>
                  <td className={ADMIN_TD}>{statusBadge(entry.status)}</td>
                  <td className={ADMIN_TD}>
                    <span className="text-[11px] text-slate-500">
                      {entry.publishedAt
                        ? new Date(entry.publishedAt).toLocaleDateString("ar-EG")
                        : new Date(entry.updatedAt).toLocaleDateString("ar-EG")}
                    </span>
                  </td>
                  <td className={`${ADMIN_TD} text-start`}>
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <Link
                          href={`/content/${contentType.slug}/${entry.slug}/edit`}
                          className={ADMIN_BUTTON_QUIET}
                          title="تعديل العنصر"
                        >
                          <Edit className="w-3.5 h-3.5 text-copticNavy" />
                          <span>تعديل</span>
                        </Link>
                      )}

                      {entry.status === "published" && (
                        <a
                          href={`/content/${contentType.slug}/${entry.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={ADMIN_BUTTON_QUIET}
                          title="معاينة في الموقع العام"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          <span>معاينة</span>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">لا توجد عناصر مطابقة للبحث أو الفلتر.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
