import type { Metadata } from "next";
import { getBibleBooks } from "@/lib/queries";
import { BibleReaderClient } from "./BibleReaderClient";

export const metadata: Metadata = {
  title: "قارئ الكتاب المقدس القبطي الأرثوذكسي",
  description:
    "تصفح أسفار الكتاب المقدس بعهديه القديم (بما فيه الأسفار القانونية الثانية) والعهد الجديد باللغة العربية من بوابة كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالعصافرة.",
};

/**
 * `/bible` — the canon comes from the typed data layer (`getBibleBooks()`), which reads
 * `bible_books` and falls back to the seeded list. The reader itself is a client component
 * (search + book/chapter selection), so it is split out and receives the books as props.
 */
export default async function BiblePage() {
  const books = await getBibleBooks();

  return <BibleReaderClient books={books} />;
}
