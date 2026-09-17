// apps/web/src/app/content/[type]/page.tsx
// Public listing page for published entries of a specific dynamic Content Type.
// Static-first (ISR), zero-auth, zero-env safe.

import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  ArrowLeft,
  FileText,
  Clock,
} from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { getContentTypeRepository } from "@/lib/store";

export const revalidate = 3600;

interface ContentTypePageProps {
  params: Promise<{ type: string }>;
}

export async function generateStaticParams() {
  try {
    const repo = getContentTypeRepository();
    const activeTypes = await repo.listContentTypes();
    return activeTypes.map((t) => ({ type: t.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ContentTypePageProps): Promise<Metadata> {
  const { type: typeSlug } = await params;
  try {
    const repo = getContentTypeRepository();
    const contentType = await repo.getContentTypeBySlug(typeSlug);
    if (!contentType || !contentType.isActive) {
      return { title: "المحتوى" };
    }
    return {
      title: `${contentType.nameAr} — كنيسة القديسين`,
      description: contentType.nameEn || undefined,
    };
  } catch {
    return { title: "المحتوى" };
  }
}

export default async function ContentTypeListingPage({
  params,
}: ContentTypePageProps): Promise<React.ReactElement> {
  const { type: typeSlug } = await params;

  let contentType = null;
  let entries: import("@church-site/domain").ContentEntry[] = [];
  let fields: import("@church-site/domain").ContentField[] = [];

  try {
    const repo = getContentTypeRepository();
    contentType = await repo.getContentTypeBySlug(typeSlug);

    if (contentType && contentType.isActive) {
      const statusFilter = { status: "published" as const };
      [fields, entries] = await Promise.all([
        repo.listContentFields(contentType.id),
        repo.listContentEntries(contentType.slug, statusFilter),
      ]);
    }
  } catch (error) {
    console.warn("[web] content type query failed:", error);
  }

  if (!contentType || !contentType.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-alabasterBg pb-16" dir="rtl">
      <PageHero
        title={contentType.nameAr}
        englishTitle={contentType.nameEn || contentType.slug}
        description={`تصفح جميع المواد والعناصر المنشورة ضمن قسم «${contentType.nameAr}».`}
        breadcrumbs={[
          { label: "المحتوى", href: "/" },
          { label: contentType.nameAr },
        ]}
        icon={<BookOpen className="w-8 h-8 text-copticGold-300" />}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => {
              const titleCandidate =
                entry.data.title ||
                entry.data.title_ar ||
                entry.data.name ||
                entry.data.name_ar ||
                entry.slug;
              const title = String(titleCandidate);

              const summaryCandidate =
                entry.data.summary ||
                entry.data.summary_ar ||
                entry.data.description ||
                "";
              const summary = String(summaryCandidate);

              // Cover image
              let coverUrl: string | null = null;
              if (entry.data.cover || entry.data.cover_image || entry.data.image) {
                coverUrl = String(
                  entry.data.cover || entry.data.cover_image || entry.data.image
                );
              }

              return (
                <article
                  key={entry.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-copticGold-400 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
                >
                  <div>
                    {coverUrl ? (
                      <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverUrl}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="h-28 w-full bg-gradient-to-br from-copticNavy-900 to-copticNavy-950 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-copticGold-400/60" />
                      </div>
                    )}

                    <div className="p-6 space-y-3">
                      {entry.publishedAt && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-copticGold-600" />
                          <time dateTime={entry.publishedAt}>
                            {new Date(entry.publishedAt).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </time>
                        </div>
                      )}

                      <h2 className="font-heading text-lg font-bold text-copticNavy hover:text-copticGold-700 transition line-clamp-2 leading-snug">
                        <Link href={`/content/${contentType.slug}/${entry.slug}`}>
                          {title}
                        </Link>
                      </h2>

                      {summary && (
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-end">
                    <Link
                      href={`/content/${contentType.slug}/${entry.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-copticNavy hover:text-copticGold-700 transition"
                    >
                      <span>قراءة المزيد</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-xl mx-auto space-y-4">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-bold text-copticNavy">
                لا توجد عناصر منشورة حالياً
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                لم يتم نشر أي محتوى ضمن قسم «{contentType.nameAr}» حتى الآن. يرجى المتابعة لاحقاً.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
