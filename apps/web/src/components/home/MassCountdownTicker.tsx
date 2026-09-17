"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, ArrowLeft } from "lucide-react";
import type { NextMass } from "@/lib/utils/mass-schedule";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getRemaining(startsAtMs: number): Remaining | null {
  const diffMs = startsAtMs - Date.now();
  if (diffMs <= 0) return null;
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Ticking countdown to a liturgy whose start instant was resolved on the server from the real
 * schedule (`getNextMass`). The digits are computed after mount, so the server-rendered
 * placeholders and the first client render always agree; when the liturgy begins the card asks
 * the server for the following one instead of counting into the past.
 */
export function MassCountdownTicker({ nextMass }: { nextMass: NextMass }) {
  const router = useRouter();
  const startsAtMs = new Date(nextMass.startsAtIso).getTime();

  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const tick = () => {
      const value = getRemaining(startsAtMs);
      setRemaining(value);
      setStarted(value === null);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startsAtMs]);

  useEffect(() => {
    // The liturgy has started: re-render server-side so the card shows the next one.
    if (started) router.refresh();
  }, [started, router]);

  const units = remaining
    ? remaining.days > 0
      ? [
          { value: remaining.days, label: "يوم" },
          { value: remaining.hours, label: "ساعة" },
          { value: remaining.minutes, label: "دقيقة" },
        ]
      : [
          { value: remaining.hours, label: "ساعة" },
          { value: remaining.minutes, label: "دقيقة" },
          { value: remaining.seconds, label: "ثانية" },
        ]
    : null;

  const whenLabel = nextMass.altarNameAr
    ? `${nextMass.dayLabelAr}، ${nextMass.altarNameAr}`
    : nextMass.dayLabelAr;

  return (
    <div className="bg-copticGold-50 border border-copticGold-300 rounded-2xl p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center md:text-right">
          <div className="w-12 h-12 rounded-xl bg-copticNavy-500 text-copticGold-300 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-xs font-bold text-copticGold-800 bg-copticGold-200/80 px-2 py-0.5 rounded-full">
                القداس القادم
              </span>
              <span className="text-xs text-slateText-secondary">{whenLabel}</span>
            </div>
            <h3 className="font-heading font-bold text-copticNavy text-base sm:text-lg">
              {nextMass.titleAr} ({nextMass.timeLabelAr})
            </h3>
          </div>
        </div>

        {/* Countdown units */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {started && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg">
                بدأ الآن
              </span>
            )}

            {!started &&
              (units ?? [
                { value: null, label: "ساعة" },
                { value: null, label: "دقيقة" },
                { value: null, label: "ثانية" },
              ]).map((unit, index) => (
                <React.Fragment key={unit.label}>
                  {index > 0 && <span className="font-bold text-copticGold-700">:</span>}
                  <div className="bg-white border border-copticGold-300 rounded-lg px-2.5 py-1 text-center min-w-[45px]">
                    <span className="font-english font-bold text-base text-copticNavy">
                      {unit.value === null ? "--" : String(unit.value).padStart(2, "0")}
                    </span>
                    <span className="block text-[9px] text-slateText-muted">{unit.label}</span>
                  </div>
                </React.Fragment>
              ))}
          </div>

          <Link
            href="/masses"
            className="inline-flex items-center gap-1 bg-copticNavy text-white hover:bg-copticNavy-700 text-xs font-bold px-3 py-2 rounded-xl transition"
          >
            <span>جدول الأسبوع</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
