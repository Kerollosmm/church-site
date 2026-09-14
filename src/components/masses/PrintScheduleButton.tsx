"use client";

import React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PrintScheduleButton({ className }: { className?: string }) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className={className}
      aria-label="طباعة جدول القداسات"
    >
      <Printer className="w-4 h-4 me-1.5" />
      <span>طباعة الجدول</span>
    </Button>
  );
}
