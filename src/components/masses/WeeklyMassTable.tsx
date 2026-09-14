import React from "react";
import { Clock, MapPin, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface MassScheduleItem {
  id: string;
  dayName: string; // e.g. "الأحد"
  dayIndex: number; // 0 = Sun, etc.
  title?: string; // e.g. "قداس الأحد الصباحي الأول"
  altarName: string; // e.g. "المذبح الأوسط الرئيسي"
  altarId?: string;
  hours: string; // e.g. "06:00 - 08:30"
  priestName?: string; // e.g. "القمص مكسيموس وصفي"
  targetAudience?: string; // e.g. "عام لجميع الشعب"
  notes?: string; // notes_ar
  period?: "morning" | "evening";
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
    <div className={cn("w-full space-y-6", className)}>
      {/* Responsive Card View (Mobile, Tablet, Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 print:hidden">
        {schedules.map((mass, idx) => {
          const isEvening =
            mass.period === "evening" ||
            (!mass.period && parseInt(mass.hours.slice(0, 2), 10) >= 12);
          const periodText = isEvening ? "قداس مسائي" : "قداس صباحي";

          return (
            <div
              key={mass.id || idx}
              className="bg-white rounded-2xl p-5 border-2 border-copticGold-200 hover:border-copticGold-400 transition shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Badges at top */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-white bg-copticNavy px-3 py-1 rounded-full">
                    {mass.dayName}
                  </span>
                  <span className="text-[11px] font-bold text-copticGold-800 bg-copticGold-100 px-2.5 py-0.5 rounded-full border border-copticGold-300">
                    {mass.altarName}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-copticGold-300 bg-copticGold-50 text-copticGold-900">
                    {periodText}
                  </span>
                </div>

                {/* Mass title */}
                <h3 className="font-heading font-bold text-sm text-copticNavy mb-1">
                  {mass.title || `قداس يوم ${mass.dayName}`}
                </h3>

                {/* Details list */}
                <div className="space-y-2 mt-3 text-xs font-body">
                  {/* Time range: Clock icon + {hours} (font-english font-bold text-copticNavy) */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-copticGold-700 shrink-0" />
                    <span className="font-english font-bold text-copticNavy">
                      {mass.hours}
                    </span>
                  </div>

                  {/* Priest name: celebrant.clerical_name_ar with User icon */}
                  {mass.priestName && (
                    <div className="flex items-center gap-2 text-slateText-secondary">
                      <User className="w-4 h-4 text-copticGold-700 shrink-0" />
                      <span className="font-medium text-slateText-primary">
                        {mass.priestName}
                      </span>
                    </div>
                  )}

                  {/* Audience: target_group_ar with Users icon and Badge */}
                  {mass.targetAudience && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-copticGold-700 shrink-0" />
                      <Badge variant="neutral" size="sm">
                        {mass.targetAudience}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes: {notes_ar} if present */}
              {mass.notes && (
                <div className="mt-4 pt-3 border-t border-copticGold-100 text-[11px] text-slateText-muted leading-relaxed">
                  {mass.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Accessible Table for Print Mode */}
      <div className="hidden print:block overflow-hidden rounded-2xl border border-copticGold-300 bg-surfaceCard">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-copticNavy-700 text-white font-heading text-xs uppercase tracking-wider">
              <th scope="col" className="py-3 px-4 font-bold">اليوم</th>
              <th scope="col" className="py-3 px-4 font-bold">المذبح</th>
              <th scope="col" className="py-3 px-4 font-bold">الفترة</th>
              <th scope="col" className="py-3 px-4 font-bold">المواعيد</th>
              <th scope="col" className="py-3 px-4 font-bold">الكاهن المصلي</th>
              <th scope="col" className="py-3 px-4 font-bold">الفئة المستهدفة</th>
              <th scope="col" className="py-3 px-4 font-bold">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-copticGold-100 font-body text-xs">
            {schedules.map((mass, idx) => (
              <tr key={mass.id || idx}>
                <td className="py-3 px-4 font-heading font-bold text-copticNavy-800 whitespace-nowrap">
                  {mass.dayName}
                </td>
                <td className="py-3 px-4 text-copticNavy-700 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                    <span>{mass.altarName}</span>
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {mass.period === "evening" ? "قداس مسائي" : "قداس صباحي"}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-english font-bold text-copticNavy">
                    <Clock className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                    <span>{mass.hours}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-slateText-primary whitespace-nowrap">
                  {mass.priestName ? (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slateText-muted shrink-0" />
                      <span>{mass.priestName}</span>
                    </div>
                  ) : (
                    <span className="text-slateText-muted">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {mass.targetAudience ? (
                    <Badge variant="neutral" size="sm">
                      {mass.targetAudience}
                    </Badge>
                  ) : (
                    <span className="text-slateText-muted">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slateText-muted text-xs">
                  {mass.notes || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
