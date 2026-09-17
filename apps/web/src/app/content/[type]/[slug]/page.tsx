// apps/web/src/app/content/[type]/[slug]/page.tsx
// Public detail page for a single published dynamic content entry.
// Static-first (ISR), zero-auth, zero-env safe.

import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { getContentTypeRepository } from "@/lib/store";
import { getTemplate } from "./templates";

export const revalidate = 3600;

interface ContentEntryPageProps {
  params: Promise<{ type: string; slug: string }>;
}

export async function generateStaticParams() {
  try {
    const repo = getContentTypeRepository();
    const activeTypes = await repo.listContentTypes();
    const paramsList: Array<{ type: string; slug: string }> = [];

    for (const t of activeTypes) {
      const entries = await repo.listContentEntries(t.slug, { status: "published" });
      for (const e of entries) {
        paramsList.push({ type: t.slug, slug: e.slug });
      }
    }
    return paramsList;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ContentEntryPageProps): Promise<Metadata> {
  const { type: typeSlug, slug: entrySlug } = await params;
  try {
    const repo = getContentTypeRepository();
    const contentType = await repo.getContentTypeBySlug(typeSlug);
    if (!contentType || !contentType.isActive) {
      return { title: "المحتوى" };
    }

    const entry = await repo.getPublishedEntry(contentType.slug, entrySlug);
    if (!entry) {
      return { title: contentType.nameAr };
    }

    const titleCandidate =
      entry.data.title ||
      entry.data.title_ar ||
      entry.data.name ||
      entry.data.name_ar ||
      entry.slug;

    return {
      title: `${String(titleCandidate)} — ${contentType.nameAr}`,
      description: entry.data.summary ? String(entry.data.summary) : undefined,
    };
  } catch {
    return { title: "المحتوى" };
  }
}

export default async function ContentEntryDetailPage({
  params,
}: ContentEntryPageProps): Promise<React.ReactElement> {
  const { type: typeSlug, slug: entrySlug } = await params;

  let contentType = null;
  let entry = null;
  let fields: import("@church-site/domain").ContentField[] = [];

  try {
    const repo = getContentTypeRepository();
    contentType = await repo.getContentTypeBySlug(typeSlug);

    if (contentType && contentType.isActive) {
      [entry, fields] = await Promise.all([
        repo.getPublishedEntry(contentType.slug, entrySlug),
        repo.listContentFields(contentType.id),
      ]);
    }
  } catch (error) {
    console.warn("[web] content entry query failed:", error);
  }

  if (!contentType || !contentType.isActive || !entry) {
    notFound();
  }

  const TemplateComponent = getTemplate(contentType.template);

  const titleCandidate =
    entry.data.title ||
    entry.data.title_ar ||
    entry.data.name ||
    entry.data.name_ar ||
    entry.slug;
  const title = String(titleCandidate);

  return (
    <div className="min-h-screen bg-alabasterBg pb-16" dir="rtl">
      <PageHero
        title={title}
        englishTitle={contentType.nameEn || contentType.slug}
        breadcrumbs={[
          { label: "المحتوى", href: "/" },
          { label: contentType.nameAr, href: `/content/${contentType.slug}` },
          { label: title },
        ]}
        icon={<BookOpen className="w-8 h-8 text-copticGold-300" />}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <TemplateComponent
          contentType={contentType}
          fields={fields}
          entry={entry}
        />
      </main>
    </div>
  );
}
