"use client";

import React, { useState } from "react";
import { HeartHandshake, CheckCircle2, AlertCircle, Clock, Calendar, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { submitCondolenceBooking } from "@/actions/condolence-actions";

export function CondolenceBookingForm() {
  const [formData, setFormData] = useState({
    deceasedFullName: "",
    applicantName: "",
    applicantPhone: "",
    relationshipToDeceased: "",
    eventDate: "",
    slotTime: "مسائي من 6:00 م إلى 10:00 م",
    hallName: "قاعة العزاء الرئيسية المجهزة",
    specialRequests: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    bookingCode?: string;
    message?: string;
    errors?: Record<string, string[]>;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await submitCondolenceBooking(formData);
      setResult(response);
      if (response.success) {
        setFormData({
          deceasedFullName: "",
          applicantName: "",
          applicantPhone: "",
          relationshipToDeceased: "",
          eventDate: "",
          slotTime: "مسائي من 6:00 م إلى 10:00 م",
          hallName: "قاعة العزاء الرئيسية المجهزة",
          specialRequests: "",
        });
      }
    } catch {
      setResult({
        success: false,
        message: "حدث خطأ غير متوقع أثناء إرسال الطلب، يرجى المحاولة لاحقاً.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="gold-border" className="max-w-2xl mx-auto bg-surfaceCard shadow-md">
      <CardHeader className="border-b border-copticGold-100 bg-copticGold-50/30">
        <div className="flex items-center gap-2 text-copticGold-700 mb-1">
          <HeartHandshake className="w-5 h-5" />
          <span className="text-xs font-heading font-bold">خدمة العزاء والمناسبات</span>
        </div>
        <CardTitle className="text-xl md:text-2xl text-copticNavy-800">
          استمارة طلب حجز قاعة العزاء
        </CardTitle>
        <p className="text-xs md:text-sm text-slateText-muted font-body">
          يرجى تسجيل بيانات المتوفى ومقدم الطلب بدقة لتأكيد الحجز وتنسيق المواعيد مع الكنيسة
        </p>
      </CardHeader>

      <CardContent className="p-6 md:p-8">
        {result?.success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2">
            <div className="flex items-center gap-2 font-heading font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{result.message}</span>
            </div>
            {result.bookingCode && (
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-200 mt-2 text-xs">
                <span className="font-bold text-copticNavy-800 me-2">
                  كود الحجز المرجعي للمتابعة:
                </span>
                <code className="text-sm font-black text-copticNavy-700 bg-copticGold-100 px-2.5 py-1 rounded-lg">
                  {result.bookingCode}
                </code>
                <p className="text-slateText-muted text-[11px] mt-1.5 font-body">
                  احتفظ بهذا الرمز للاستعلام عن حالة قبول وتأكيد الحجز لاحقاً.
                </p>
              </div>
            )}
          </div>
        )}

        {result && !result.success && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-bold">{result.message}</p>
              {result.errors && (
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {Object.entries(result.errors).map(([k, errs]) => (
                    <li key={k}>{errs.join("، ")}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          {/* Deceased Full Name */}
          <div>
            <label className="block font-heading text-xs font-bold text-copticNavy-800 mb-1">
              اسم المتوفى ثلاثياً بالكامل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.deceasedFullName}
              onChange={(e) =>
                setFormData({ ...formData, deceasedFullName: e.target.value })
              }
              placeholder="مثال: موريس ميخائيل إبراهيم"
              className="w-full bg-white border border-copticGold-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-body focus:outline-none focus:ring-2 focus:ring-copticGold-500"
            />
          </div>

          {/* Applicant Info (Name + Phone) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs font-bold text-copticNavy-800 mb-1">
                اسم مقدم الطلب <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.applicantName}
                onChange={(e) =>
                  setFormData({ ...formData, applicantName: e.target.value })
                }
                placeholder="اسمك الكريم"
                className="w-full bg-white border border-copticGold-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-body focus:outline-none focus:ring-2 focus:ring-copticGold-500"
              />
            </div>

            <div>
              <label className="block font-heading text-xs font-bold text-copticNavy-800 mb-1">
                رقم الهاتف المحمول (مصر) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                value={formData.applicantPhone}
                onChange={(e) =>
                  setFormData({ ...formData, applicantPhone: e.target.value })
                }
                placeholder="01XXXXXXXXX"
                className="w-full bg-white border border-copticGold-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-body text-right focus:outline-none focus:ring-2 focus:ring-copticGold-500"
              />
            </div>
          </div>

          {/* Relationship & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs font-bold text-copticNavy-800 mb-1">
                صلة القرابة بالمتوفى <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.relationshipToDeceased}
                onChange={(e) =>
                  setFormData({ ...formData, relationshipToDeceased: e.target.value })
                }
                required
                className="w-full bg-white border border-copticGold-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-body focus:outline-none focus:ring-2 focus:ring-copticGold-500"
              >
                <option value="">اختر صلة القرابة</option>
                <option value="ابن / ابنة">ابن / ابنة</option>
                <option value="زوج / زوجة">زوج / زوجة</option>
                <option value="أخ / أخت">أخ / أخت</option>
                <option value="قريب / نسيب">قريب / نسيب</option>
                <option value="صديق الأسرة">صديق الأسرة</option>
              </select>
            </div>

            <div>
              <label className="block font-heading text-xs font-bold text-copticNavy-800 mb-1">
                تاريخ العزاء المطلوب <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={formData.eventDate}
                onChange={(e) =>
                  setFormData({ ...formData, eventDate: e.target.value })
                }
                className="w-full bg-white border border-copticGold-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-body focus:outline-none focus:ring-2 focus:ring-copticGold-500"
              />
            </div>
          </div>

          {/* Slot & Hall */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs font-bold text-copticNavy-800 mb-1">
                الفترة الزمنية
              </label>
              <select
                value={formData.slotTime}
                onChange={(e) =>
                  setFormData({ ...formData, slotTime: e.target.value })
                }
                className="w-full bg-white border border-copticGold-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-body focus:outline-none focus:ring-2 focus:ring-copticGold-500"
              >
                <option value="مسائي من 6:00 م إلى 10:00 م">
                  الفترة المسائية (من ٦:٠٠ م إلى ١٠:٠٠ م)
                </option>
                <option value="صباحي من 10:00 ص إلى 2:00 م">
                  الفترة الصباحية (من ١٠:٠٠ ص إلى ٢:٠٠ م)
                </option>
              </select>
            </div>

            <div>
              <label className="block font-heading text-xs font-bold text-copticNavy-800 mb-1">
                القاعة
              </label>
              <input
                type="text"
                disabled
                value={formData.hallName}
                className="w-full bg-slate-100 border border-copticGold-200 text-slateText-muted rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-body cursor-not-allowed"
              />
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block font-heading text-xs font-bold text-copticNavy-800 mb-1">
              ملاحظات أو طلبات خاصة (اختياري)
            </label>
            <textarea
              rows={3}
              value={formData.specialRequests}
              onChange={(e) =>
                setFormData({ ...formData, specialRequests: e.target.value })
              }
              placeholder="أي تفاصيل ترغب في إبلاغ الكنيسة بها..."
              className="w-full bg-white border border-copticGold-300 rounded-xl p-3 text-xs sm:text-sm font-body focus:outline-none focus:ring-2 focus:ring-copticGold-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full font-bold"
            >
              <span>تسجيل طلب حجز قاعة العزاء</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
