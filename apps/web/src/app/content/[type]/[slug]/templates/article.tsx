import React from "react";
import Link from "next/link";
import {
  Calendar,
  User,
  ArrowRight,
  BookOpen,
  Share2,
} from "lucide-react";
import type { ContentTemplateProps } from "./default";
import { sanitizeHtml } from "@church-site/data-access";

export function ArticleTemplate({
  contentType,
  fields,
  entry,
}: ContentTemplateProps): React.ReactElement {
  // Primary title
  const titleCandidate =
    entry.data.title ||
    entry.data.title_ar ||
    entry.data.name ||
    entry.data.name_ar ||
    entry.slug;
  const title = String(titleCandidate);

  // Author / speaker
  const author = entry.data.author || entry.data.speaker || entry.data.writer || null;

  // Cover image
  let coverUrl: string | null = null;
  const mediaField = fields.find((f) => f.fieldType === "media");
  if (mediaField && entry.data[mediaField.slug]) {
    coverUrl = String(entry.data[mediaField.slug]);
  } else if (entry.data.cover || entry.data.cover_image || entry.data.image) {
    coverUrl = String(entry.data.cover || entry.data.cover_image || entry.data.image);
  }

  // Rich body
  const richField = fields.find((f) => f.fieldType === "richtext");
  const bodyHtml = richField && entry.data[richField.slug]
    ? sanitizeHtml(String(entry.data[richField.slug]))
    : null;

  return (
    <article className="max-w-4xl mx-auto space-y-8" dir="rtl">
      {/* Article Header Card */}
      <header className="space-y-4 text-center sm:text-start border-b border-copticGold-200 pb-8">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <Link
            href={`/content/${contentType.slug}`}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-copticGold-100 text-copticNavy hover:bg-copticGold-200 transition"
          >
            <BookOpen className="w-3 h-3 text-copticGold-700" />
            <span>{contentType.nameAr}</span>
          </Link>

          {entry.publishedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
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

        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-copticNavy leading-tight tracking-tight">
          {title}
        </h1>

        {author && (
          <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-600 font-medium">
            <User className="w-4 h-4 text-copticGold-600" />
            <span>بقلم / إعداد: <strong className="text-copticNavy font-bold">{String(author)}</strong></span>
          </div>
        )}
      </header>

      {/* Featured Cover Image */}
      {coverUrl && (
        <div className="relative w-full h-80 sm:h-[420px] rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Body Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-xs">
        {bodyHtml ? (
          <div
            className="prose prose-lg prose-slate max-w-none text-slate-800 leading-relaxed font-sans"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : (
          entry.data.description || entry.data.body ? (
            <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-line">
              {String(entry.data.description || entry.data.body)}
            </p>
          ) : (
            <p className="text-slate-400 italic">لا يوجد محتوى نصي متاح لهذا العنصر.</p>
          )
        )}
      </div>

      {/* Footer Navigation */}
      <footer className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <Link
          href={`/content/${contentType.slug}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-copticNavy hover:text-copticGold-600 transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرجوع إلى مقالات وقائمة «{contentType.nameAr}»</span>
        </Link>
      </footer>
    </article>
  );
}
