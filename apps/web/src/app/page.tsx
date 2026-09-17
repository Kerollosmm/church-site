import React from "react";
import { HeroBanner } from "@/components/home/HeroBanner";
import { NextMassCountdown } from "@/components/home/NextMassCountdown";
import { QuickServiceGrid } from "@/components/home/QuickServiceGrid";
import { NewVisitorWelcome } from "@/components/home/NewVisitorWelcome";
import { PatronSaintsSection } from "@/components/home/PatronSaintsSection";
import { SanctuaryAltarsShowcase } from "@/components/home/SanctuaryAltarsShowcase";
import { BibleVerseDaily } from "@/components/home/BibleVerseDaily";
import { LatestNewsCarousel } from "@/components/home/LatestNewsCarousel";
import { WelcomeFromClergy } from "@/components/home/WelcomeFromClergy";
import { getDailyVerse, getNewsArticles } from "@/lib/queries";

export const revalidate = 300; // 5 minutes ISR cache

export default async function HomePage() {
  let dailyVerse: any;
  let newsArticles: any[] = [];

  try {
    dailyVerse = await getDailyVerse();
    newsArticles = await getNewsArticles();
  } catch (error) {
    console.error("Home data fetching error:", error);
  }

  return (
    <div className="min-h-screen">
      <HeroBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <NextMassCountdown />
        <QuickServiceGrid />
        <NewVisitorWelcome />
        <PatronSaintsSection />
        <SanctuaryAltarsShowcase />
        <BibleVerseDaily verse={dailyVerse} />
        <WelcomeFromClergy />
        <LatestNewsCarousel news={newsArticles} />
      </div>
    </div>
  );
}
