import React from "react";
import { Phone, MessageCircle, Clock, MapPin, DollarSign, Award, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface DoctorScheduleSlot {
  dayOfWeek: string;
  timeRange: string;
}

export interface DoctorCardProps {
  id: string;
  name: string;
  academicTitle: string; // e.g. "أستاذ دكتور", "استشاري أول"
  specialtyName: string; // e.g. "أمراض الباطنة والقلب"
  subspecialty?: string; // e.g. "قسطرة القلب واعتلال الشرايين"
  roomNumber: string; // e.g. "عيادة ٣ - الدور الثاني"
  consultationFee: number; // e.g. 50 (Nominal EGP)
  phone?: string; // Clinic hotline or booking line
  whatsappNumber?: string;
  schedules: DoctorScheduleSlot[];
}

export function DoctorCard({
  name,
  academicTitle,
  specialtyName,
  subspecialty,
  roomNumber,
  consultationFee,
  phone = "035500000",
  whatsappNumber = "201200000000",
  schedules,
}: DoctorCardProps) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const cleanWhatsapp = whatsappNumber.replace(/[^0-9]/g, "");

  return (
    <Card
      variant="elevated"
      className="flex flex-col h-full border border-copticGold-200/90 hover:border-copticGold-400 transition-all duration-200 bg-surfaceCard"
    >
      <CardContent className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Badge & Specialty */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <Badge variant="gold" size="sm">
              {specialtyName}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-copticNavy-700 font-heading font-semibold bg-copticNavy-50 px-2.5 py-0.5 rounded-full border border-copticNavy-100">
              <span>{consultationFee} ج.م</span>
              <span className="text-[10px] text-slateText-muted">(رسم رمزي)</span>
            </div>
          </div>

          {/* Doctor Name & Academic Rank */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-xs text-copticGold-700 font-heading font-bold mb-0.5">
              <Award className="w-3.5 h-3.5" />
              <span>{academicTitle}</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-copticNavy-800 leading-snug">
              د. {name}
            </h3>
            {subspecialty && (
              <p className="text-xs text-slateText-muted font-body mt-1">
                {subspecialty}
              </p>
            )}
          </div>

          {/* Location / Clinic Room */}
          <div className="flex items-center gap-1.5 text-xs text-slateText-secondary font-body mb-4 bg-alabasterBg p-2 rounded-xl border border-copticGold-100">
            <MapPin className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
            <span>مكان الكشف: {roomNumber}</span>
          </div>

          {/* Schedule Slots (Static Directory) */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-1 text-xs font-heading font-semibold text-copticNavy-700 mb-1">
              <Clock className="w-3.5 h-3.5 text-copticGold-700" />
              <span>مواعيد العمل الأسبوعية:</span>
            </div>
            {schedules.map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-copticGold-50/40 text-slateText-primary font-body border border-copticGold-100/50"
              >
                <span className="font-heading font-medium text-copticNavy-800">
                  {slot.dayOfWeek}
                </span>
                <span className="text-slateText-secondary">{slot.timeRange}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons: Direct WhatsApp and Phone Call */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-copticGold-100 mt-2">
          <a
            href={`tel:${cleanPhone}`}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-heading font-semibold bg-copticNavy-50 text-copticNavy-700 hover:bg-copticNavy-100 transition-colors border border-copticNavy-200"
            aria-label={`اتصال بالعيادة لحجز موعد مع د. ${name}`}
          >
            <Phone className="w-3.5 h-3.5 text-copticNavy-600" />
            <span>اتصال بالعيادة</span>
          </a>

          <a
            href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
              `سلام المسيح، استفسار بشأن عيادة د. ${name} (${specialtyName}) بالمركز الطبي لكنيسة القديسين بالعصافرة.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-heading font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200"
            aria-label={`مراسلة واتساب بشأن عيادة د. ${name}`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>واتساب</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
