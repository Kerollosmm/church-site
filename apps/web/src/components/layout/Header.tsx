// apps/web/src/components/layout/Header.tsx
// Server component shell for Header, fetching dynamic navigation with instant zero-env seed fallback.

import React from "react";
import Link from "next/link";
import { Church } from "lucide-react";
import { getPublicNavigation } from "@church-site/data-access";
import { getCopticDateString } from "@/lib/utils/coptic-date";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { FontSizeSwitcher } from "@/components/ui/FontSizeSwitcher";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const navigation = await getPublicNavigation();
  const copticDate = getCopticDateString();

  const brand = (
    <Link href="/" className="flex items-center gap-3 group focus:outline-hidden">
      <div className="w-10 h-10 rounded-xl bg-copticNavy-500 border border-copticGold-400 flex items-center justify-center text-copticGold-300 shadow-inner group-hover:scale-105 transition-transform">
        <Church className="w-6 h-6 text-copticGold-300" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm md:text-base font-heading font-bold text-copticNavy leading-tight group-hover:text-copticGold-700 transition-colors">
          كنيسة القديسين مكسيموس ودوماديوس
        </span>
        <span className="text-xs text-copticGold-700 font-medium leading-tight">
          والشهيد الأنبا موسى الأسود — العصافرة
        </span>
      </div>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-copticGold-300 shadow-xs">
      {/* Top Bar for Coptic Date & Quick Info */}
      <div className="bg-copticNavy-700 text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-copticGold-500 animate-pulse" />
            <span className="text-copticGold-200 font-medium">تاريخ اليوم القبطي:</span>
            <span className="font-semibold text-white">{copticDate}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-copticGold-200">
              <Church className="w-3.5 h-3.5 text-copticGold-400" />
              <span>إيبارشية شرق الإسكندرية — قطاع المنتزه</span>
            </div>
            <div className="flex items-center gap-2">
              <LocaleSwitcher locale={DEFAULT_LOCALE} />
              <FontSizeSwitcher className="scale-90" />
              <Link
                href="/donations"
                className="bg-copticGold-500 hover:bg-copticGold-600 text-copticNavy-900 font-bold px-2.5 py-0.5 rounded-full text-xs transition"
              >
                دعم الكنيسة
              </Link>
            </div>
          </div>
        </div>
      </div>

      <HeaderClient navigation={navigation} brand={brand} />
    </header>
  );
}
