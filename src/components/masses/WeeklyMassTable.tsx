import React from "react";
import { Clock, MapPin, User, Users, Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface MassScheduleItem {
  id: string;
  dayName: string; // e.g. "الأحد"
  dayIndex: number; // 0 = Sun, etc.
  altarName: string; // e.g. "المذبح الأوسط الرئيسي"
  altarId?: string;
  hours: string; // e.g. "٦:٣٠ ص - ٩:٠٠ ص"
  priestName?: string; // e.g. "أبونا أنطونيوس" or "الآباء الكهنة بالتناوب"
  targetAudience?: string; // e.g. "عام لجميع الشعب", "طلبة المدارس والجامعيين"
  notes?: string; // e.g. "قداس باكر يليه فصول مدارس الأحد"
}

export interface WeeklyMassTableProps {
  schedules: MassScheduleItem[];
  className?: string;
}

export function WeeklyMassTable({ schedules, className }: WeeklyMassTableProps) {
  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-center py-12 bg-surfaceCard rounded-2xl border border-copticGold-200 p-6">
        <p className="font-heading text-sm text-slateText-muted">
          لا توجد قداسات تطابق معايير التصفية الحالية.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-copticGold-300 bg-surfaceCard shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-copticNavy-700 text-white font-heading text-xs uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4 font-bold">اليوم</th>
              <th scope="col" className="py-3.5 px-4 font-bold">المذبح</th>
              <th scope="col" className="py-3.5 px-4 font-bold">المواعيد</th>
              <th scope="col" className="py-3.5 px-4 font-bold">الكاهن المصلي</th>
              <th scope="col" className="py-3.5 px-4 font-bold">الفئة المستهدفة</th>
              <th scope="col" className="py-3.5 px-4 font-bold">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-copticGold-100 font-body text-xs lg:text-sm">
            {schedules.map((mass, idx) => (
              <tr
                key={mass.id || idx}
                className="hover:bg-copticGold-50/50 transition-colors"
              >
                {/* Day */}
                <td className="py-3.5 px-4 font-heading font-bold text-copticNavy-800 whitespace-nowrap">
                  {mass.dayName}
                </td>

                {/* Altar */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-copticNavy-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                    <span>{mass.altarName}</span>
                  </div>
                </td>

                {/* Hours */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-heading text-copticGold-900 font-bold">
                    <Clock className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                    <span>{mass.hours}</span>
                  </div>
                </td>

                {/* Priest */}
                <td className="py-3.5 px-4 text-slateText-primary whitespace-nowrap">
                  {mass.priestName ? (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slateText-muted shrink-0" />
                      <span>{mass.priestName}</span>
                    </div>
                  ) : (
                    <span className="text-slateText-muted">—</span>
                  )}
                </td>

                {/* Audience */}
                <td className="py-3.5 px-4">
                  {mass.targetAudience ? (
                    <Badge variant="neutral" size="sm">
                      {mass.targetAudience}
                    </Badge>
                  ) : (
                    <span className="text-slateText-muted">—</span>
                  )}
                </td>

                {/* Notes */}
                <td className="py-3.5 px-4 text-slateText-muted text-xs">
                  {mass.notes || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {schedules.map((mass, idx) => (
          <div
            key={mass.id || idx}
            className="p-4 rounded-2xl bg-surfaceCard border border-copticGold-200/90 shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between border-b border-copticGold-100 pb-2">
              <span className="font-heading font-bold text-sm text-copticNavy-800">
                قداس يوم {mass.dayName}
              </span>
              <div className="flex items-center gap-1 text-xs font-heading font-bold text-copticGold-800 bg-copticGold-100/60 px-2.5 py-0.5 rounded-full">
                <Clock className="w-3 h-3 text-copticGold-700" />
                <span>{mass.hours}</span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 font-body">
              <div className="flex items-center gap-2 text-copticNavy-700">
                <MapPin className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                <span className="font-medium">{mass.altarName}</span>
              </div>

              {mass.priestName && (
                <div className="flex items-center gap-2 text-slateText-secondary">
                  <User className="w-3.5 h-3.5 text-slateText-muted shrink-0" />
                  <span>الكاهن: {mass.priestName}</span>
                </div>
              )}

              {mass.targetAudience && (
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="neutral" size="sm">
                    {mass.targetAudience}
                  </Badge>
                </div>
              )}

              {mass.notes && (
                <p className="text-[11px] text-slateText-muted pt-1 border-t border-copticGold-50">
                  {mass.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
