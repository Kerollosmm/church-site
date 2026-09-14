import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { ContactLinks } from "@/components/contact/ContactLinks";
import { HeartHandshake, Clock, MapPin, CheckCircle2, ChevronLeft, Phone, Building2 } from "lucide-react";
import { getServiceBySlug, SEED_PUBLIC_SERVICES } from "@/lib/queries";

export const revalidate = 86400;

export async function generateStaticParams() {
  return SEED_PUBLIC_SERVICES.map((service) => ({ slug: service.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "الخدمات المجتمعية" };
  return {
    title: `${service.name_ar}`,
    description: service.description_ar,
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title={service.name_ar}
        englishTitle={service.slug}
        description={service.description_ar}
        breadcrumbs={[
          { label: "الخدمات المجتمعية", href: "/services" },
          { label: service.name_ar },
        ]}
        icon={<HeartHandshake className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-copticGold-300 shadow-xs space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <div className="flex items-center gap-2 text-copticGold-800 font-bold text-xs mb-1">
                <Clock className="w-4 h-4" />
                <span>ساعات العمل ومواعيد الاستقبال:</span>
              </div>
              <p className="text-sm font-bold text-copticNavy">{service.working_hours_ar || service.operating_hours_ar}</p>
            </div>

            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <div className="flex items-center gap-2 text-copticGold-800 font-bold text-xs mb-1">
                <MapPin className="w-4 h-4" />
                <span>مكان المرفق:</span>
              </div>
              <p className="text-sm font-bold text-copticNavy">{service.location_ar}</p>
            </div>
          </div>

          {(service.contact_phone || service.contact_whatsapp) && (
            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <div className="flex items-center gap-2 text-copticGold-800 font-bold text-xs mb-3">
                <Phone className="w-4 h-4" />
                <span>للتواصل والاستفسار:</span>
              </div>
              <ContactLinks
                phone={service.contact_phone}
                whatsappNumber={service.contact_whatsapp}
              />
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-heading font-bold text-xl text-copticNavy">
              طبيعة الخدمة والرسالة المجتمعية
            </h3>
            <p className="text-sm sm:text-base text-slateText-secondary leading-relaxed">
              {service.description_ar}
            </p>
          </div>

          <div className="border-t border-copticGold-200 pt-6">
            <h4 className="font-heading font-bold text-base text-copticNavy mb-4">
              مميزات الخدمة للجمهور:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slateText-secondary">
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>خدمة مفتوحة لجميع أهالي منطقة العصافرة والإسكندرية</span>
              </div>
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>جودة عالية وأسعار رمزية أو خدمات مجانية بالكامل</span>
              </div>
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>فريق عمل أمين ومكرس لراحة المترددين</span>
              </div>
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>إشراف كنسي مباشر لضمان الشفافية وحسن المعاملة</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-copticNavy font-bold hover:text-copticGold-800 transition"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>العودة لكافة الخدمات المجتمعية</span>
          </Link>
          <Link
            href="/contact"
            className="bg-copticNavy text-white px-4 py-2 rounded-xl font-bold hover:bg-copticNavy-700 transition"
          >
            طلب معلومات أو مساعدة
          </Link>
        </div>
      </div>
    </div>
  );
}
