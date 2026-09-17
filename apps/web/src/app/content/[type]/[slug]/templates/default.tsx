import React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  Tag,
  Share2,
} from "lucide-react";
import type { ContentType, ContentField, ContentEntry } from "@church-site/domain";
import { sanitizeHtml } from "@church-site/data-access";

export interface ContentTemplateProps {
  contentType: ContentType;
  fields: ContentField[];
  entry: ContentEntry;
}

export function DefaultTemplate({
  contentType,
  fields,
  entry,
}: ContentTemplateProps): React.ReactElement {
  // Extract primary title
  const titleCandidate =
    entry.data.title ||
    entry.data.title_ar ||
    entry.data.name ||
    entry.data.name_ar ||
    entry.slug;
  const title = String(titleCandidate);

  // Extract cover image if present
  let coverUrl: string | null = null;
  const mediaField = fields.find((f) => f.fieldType === "media");
  if (mediaField && entry.data[mediaField.slug]) {
    coverUrl = String(entry.data[mediaField.slug]);
  } else if (entry.data.cover || entry.data.cover_image || entry.data.image) {
    coverUrl = String(entry.data.cover || entry.data.cover_image || entry.data.image);
  }

  // Extract rich body if present
  const richField = fields.find((f) => f.fieldType === "richtext");
  const bodyHtml = richField && entry.data[richField.slug]
    ? sanitizeHtml(String(entry.data[richField.slug]))
    : null;

  // Other metadata fields
  const metaFields = fields.filter(
    (f) =>
      f.fieldType !== "media" &&
      f.fieldType !== "richtext" &&
      !["title", "title_ar", "name", "name_ar"].includes(f.slug) &&
      entry.data[f.slug] !== undefined &&
      entry.data[f.slug] !== null &&
      entry.data[f.slug] !== ""
  );

  return (
    <article className="space-y-8" dir="rtl">
      {/* Cover Image */}
      {coverUrl && (
        <div className="relative w-full h-72 sm:h-96 rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-copticGold-300 shadow-xs space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 pb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-copticGold-50 text-copticGold-800 border border-copticGold-200">
              <Tag className="w-3 h-3" />
              <span>{contentType.nameAr}</span>
            </span>

            {entry.publishedAt && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <time dateTime={entry.publishedAt}>
                  {new Date(entry.publishedAt).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </span>
            )}
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-copticNavy leading-tight">
            {title}
          </h1>
        </div>

        {/* Rich Body Content */}
        {bodyHtml ? (
          <div
            className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-sans"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : (
          entry.data.description || entry.data.body ? (
            <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line">
              {String(entry.data.description || entry.data.body)}
            </p>
          ) : null
        )}

        {/* Additional Fields Metadata Grid */}
        {metaFields.length > 0 && (
          <div className="pt-6 border-t border-slate-100">
            <h2 className="font-heading text-sm font-bold text-copticNavy mb-4">
              بيانات وتفاصيل إضافية:
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metaFields.map((field) => {
                const rawVal = entry.data[field.slug];
                let displayVal = String(rawVal);

                if (field.fieldType === "boolean") {
                  displayVal = Boolean(rawVal) ? "نعم" : "لا";
                } else if (field.fieldType === "date" && typeof rawVal === "string") {
                  displayVal = new Date(rawVal).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }

                return (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                  >
                    <span className="text-[11px] font-bold text-slate-500 mb-1">
                      {field.labelAr}:
                    </span>
                    <span className="text-xs font-bold text-copticNavy">
                      {displayVal}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Back to Type Link */}
      <div className="flex items-center justify-between">
        <Link
          href={`/content/${contentType.slug}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-copticNavy hover:text-copticGold-600 transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرجوع إلى صفحة «{contentType.nameAr}»</span>
        </Link>
      </div>
    </article>
  );
}
