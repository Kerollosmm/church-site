"use client";

import React, { useState } from "react";
import { Radio, Calendar, Volume2, Maximize2, ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export interface LiveStreamPlayerProps {
  streamId?: string; // YouTube Video ID or embed URL
  title?: string;
  isLive?: boolean;
  scheduledTime?: string;
  streamDescription?: string;
  className?: string;
}

export function LiveStreamPlayer({
  streamId = "live_stream",
  title = "بث صلوات القداس الإلهي المبارك",
  isLive = true,
  scheduledTime = "الأحد القادم ٦:٣٠ ص",
  streamDescription = "بث مباشر لصلوات وطقوس الكنيسة القبطية الأرثوذكسية من مذابح كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالإسكندرية.",
  className,
}: LiveStreamPlayerProps) {
  // If streamId is a YouTube ID (11 chars) or fallback to church channel
  const embedUrl = streamId.startsWith("http")
    ? streamId
    : `https://www.youtube.com/embed/${streamId}?autoplay=0&rel=0&modestbranding=1`;

  return (
    <Card variant="elevated" className={cn("overflow-hidden border border-copticGold-300 max-w-5xl mx-auto", className)}>
      {/* Top Stream Header */}
      <div className="bg-copticNavy-800 text-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isLive ? (
            <div className="flex items-center gap-1.5 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-heading font-bold animate-pulse shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>مباشر الآن</span>
            </div>
          ) : (
            <Badge variant="gold" size="sm" className="gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>موعد البث: {scheduledTime}</span>
            </Badge>
          )}

          <h2 className="font-heading text-sm md:text-base font-bold truncate max-w-md">
            {title}
          </h2>
        </div>

        <a
          href="https://youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-heading text-copticGold-300 hover:text-white transition-colors"
        >
          <span>فتح في YouTube</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Responsive Video Container (16:9) */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {streamId && streamId !== "live_stream" ? (
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <div className="text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-copticNavy-700/80 text-copticGold-400 flex items-center justify-center mx-auto border-2 border-copticGold-500/40">
              <Radio className="w-8 h-8 animate-pulse text-copticGold-400" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-white mb-1">
                {isLive ? "البث المباشر نشط حالياً" : "لا يوجد بث حي في هذه اللحظة"}
              </h3>
              <p className="text-xs text-copticGold-200/80 max-w-sm mx-auto font-body">
                {isLive
                  ? "انقر على زر المشاهدة لمتابعة الصلوات الإلهية مباشرة من الكنيسة"
                  : `موعد البث القادم: ${scheduledTime}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stream Info Footer */}
      <CardContent className="p-4 md:p-6 bg-surfaceCard">
        <p className="font-body text-xs md:text-sm text-slateText-muted leading-relaxed">
          {streamDescription}
        </p>
      </CardContent>
    </Card>
  );
}
