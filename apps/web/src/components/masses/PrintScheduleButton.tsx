"use client";

import React from "react";
import { Printer } from "lucide-react";
import { Button } from "@church-site/ui";
import { cn } from "@church-site/ui";

export function PrintScheduleButton({ className }: { className?: string }) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handlePrint}
      className={cn(
        "border-2 border-copticGold-400 bg-copticGold-100 hover:bg-copticGold-200 text-copticGold-900 font-heading font-bold rounded-2xl shadow-xs transition-colors",
        className
      )}
      aria-label="طباعة جدول القداسات"
    >
      <Printer className="w-4 h-4 me-1.5 text-copticGold-800" />
      <span>طباعة الجدول</span>
    </Button>
  );
}
