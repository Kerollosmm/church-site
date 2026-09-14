import React from "react";
import Link from "next/link";
import {
  Church,
  MapPin,
  Phone,
  Mail,
  Clock,
  Heart,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-copticNavy-900 text-slate-200 border-t-4 border-copticGold-500 pt-12 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Identity Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-copticNavy-700 border border-copticGold-400 flex items-center justify-center text-copticGold-400">
                <Church className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-white text-base">
                  كنيسة القديسين
                </h3>
                <p className="text-xs text-copticGold-400">
                  مكسيموس ودوماديوس والأنبا موسى الأسود
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              إيبارشية شرق الإسكندرية — الكنيسة القبطية الأرثوذكسية. بوابة كنسية عامة مفتوحة لجميع أبناء الكنيسة وشعب الإسكندرية لخدمة مجانية فورية وموثوقة.
            </p>
            <div className="flex items-center gap-2 text-xs text-copticGold-300 bg-copticNavy-800/80 p-2.5 rounded-lg border border-copticGold-500/30">
              <ShieldCheck className="w-4 h-4 text-copticGold-400 shrink-0" />
              <span>موقع عام متاح للجميع بدون أي تسجيل دخول مسبق</span>
            </div>
          </div>

          {/* Liturgical & Spiritual */}
          <div>
            <h4 className="font-heading font-bold text-copticGold-400 text-sm mb-4 pb-1 border-b border-copticGold-500/20">
              الصلوات والمقدسات
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/masses" className="hover:text-copticGold-300 transition-colors">
                  جداول القداسات الإلهية والعشيات
                </Link>
              </li>
              <li>
                <Link href="/about/altars" className="hover:text-copticGold-300 transition-colors">
                  المذابح الثلاثة والمزارات المقدسة
                </Link>
              </li>
              <li>
                <Link href="/about/clergy" className="hover:text-copticGold-300 transition-colors">
                  مجمع الآباء الكهنة ومواعيد الاعترافات
                </Link>
              </li>
              <li>
                <Link href="/about/history" className="hover:text-copticGold-300 transition-colors">
                  تاريخ الكنيسة والشفعاء الأطهار
                </Link>
              </li>
              <li>
                <Link href="/live" className="hover:text-copticGold-300 transition-colors">
                  البث المباشر للصلوات والنهضات
                </Link>
              </li>
              <li>
                <Link href="/bible" className="hover:text-copticGold-300 transition-colors">
                  الكتاب المقدس والأسفار القانونية
                </Link>
              </li>
            </ul>
          </div>

          {/* Clinics & Services */}
          <div>
            <h4 className="font-heading font-bold text-copticGold-400 text-sm mb-4 pb-1 border-b border-copticGold-500/20">
              الخدمات والمستوصف
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/clinics" className="hover:text-copticGold-300 transition-colors">
                  المستوصف التخصصي الخيري (14 عيادة)
                </Link>
              </li>
              <li>
                <Link href="/clinics/specialties" className="hover:text-copticGold-300 transition-colors">
                  دليل العيادات والتجهيزات (14 تخصصاً)
                </Link>
              </li>
              <li>
                <Link href="/condolence" className="hover:text-copticGold-300 transition-colors">
                  حجز ومتابعة قاعة العزاء
                </Link>
              </li>
              <li>
                <Link href="/meetings" className="hover:text-copticGold-300 transition-colors">
                  قطاعات التربية الكنسية (11 قطاعاً)
                </Link>
              </li>
              <li>
                <Link href="/education" className="hover:text-copticGold-300 transition-colors">
                  المدارس الكنسية ومعهد الشمامسة
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-copticGold-300 transition-colors">
                  المرافق والخدمات المجتمعية
                </Link>
              </li>
              <li>
                <Link href="/donations" className="hover:text-copticGold-300 transition-colors">
                  الحسابات البنكية الرسمية ودعم الخدمة
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-copticGold-400 text-sm mb-4 pb-1 border-b border-copticGold-500/20">
              الاتصال والعنوان
            </h4>
            <div className="flex items-start gap-2.5 text-xs">
              <MapPin className="w-4 h-4 text-copticGold-400 shrink-0 mt-0.5" />
              <span>شارع 45 بحري — العصافرة، حي ثان المنتزه، الإسكندرية</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <Phone className="w-4 h-4 text-copticGold-400 shrink-0" />
              <span dir="ltr" className="text-right font-english">03-5500000 / 01200000000</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-copticGold-400 shrink-0" />
              <span>أبواب الكنيسة مفتوحة يومياً من 6:00 ص إلى 10:00 م</span>
            </div>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-xs bg-copticNavy-700 hover:bg-copticNavy-600 border border-copticGold-400/50 text-copticGold-300 px-3 py-1.5 rounded-lg transition"
              >
                <span>صفحة الاتصال والخريطة الكاملة</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-copticNavy-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالعصافرة. جميع الحقوق محفوظة بركة صلواتهم تشملنا جميعاً.</p>
          <div className="flex items-center gap-4">
            <Link href="/about/history" className="hover:text-copticGold-400">عن الكنيسة</Link>
            <span>•</span>
            <Link href="/donations" className="hover:text-copticGold-400">حسابات التبرع</Link>
            <span>•</span>
            <Link href="/admin" className="hover:text-copticGold-400">بوابة الإدارة</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
