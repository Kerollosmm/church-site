"use client";

import React, { useState, useMemo } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { Users, Search } from "lucide-react";
import { DoctorCard } from "@/components/clinics/DoctorCard";
import { SpecialtyFilter } from "@/components/clinics/SpecialtyFilter";
import { SEED_CLINIC_DOCTORS, SEED_CLINIC_SPECIALTIES } from "@/lib/data/seed-data";

export default function ClinicDoctorsPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const specialtyItems = useMemo(() => {
    return SEED_CLINIC_SPECIALTIES.map((spec) => ({
      id: spec.id,
      name: spec.name_ar,
    }));
  }, []);

  const filteredDoctors = useMemo(() => {
    return SEED_CLINIC_DOCTORS.filter((doc) => {
      const matchSpec =
        selectedSpecialty === "all" || doc.specialty_id === selectedSpecialty;
      const matchSearch =
        !searchQuery.trim() ||
        doc.full_name_ar?.includes(searchQuery.trim()) ||
        doc.academic_title_ar?.includes(searchQuery.trim()) ||
        doc.sub_specialty_ar?.includes(searchQuery.trim()) ||
        doc.specialty?.name_ar?.includes(searchQuery.trim());
      return matchSpec && matchSearch;
    });
  }, [selectedSpecialty, searchQuery]);

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="دليل الأطباء ومواعيد العيادات"
        englishTitle="Parish Medical Staff & Clinic Schedule"
        description="دليل استشاريي وأخصائيي مستوصف الكنيسة الخيري، ومواعيد تواجدهم الأسبوعية في العيادات التخصصية."
        breadcrumbs={[
          { label: "المستوصف الطبي", href: "/clinics" },
          { label: "دليل الأطباء" },
        ]}
        icon={<Users className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Search and Category Filter Toolbar */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-copticGold-300 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-copticGold-700 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث باسم الطبيب أو التخصص..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-copticGold-50 border border-copticGold-300 rounded-xl pr-10 pl-4 py-2.5 text-xs text-copticNavy placeholder:text-slateText-muted focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
              />
            </div>
            <div className="text-xs text-slateText-secondary font-medium self-end md:self-center">
              رسم الكشف الرمزي الموحد: <strong className="text-copticGold-800">30 - 35 جنيهاً</strong>
            </div>
          </div>

          <SpecialtyFilter
            specialties={specialtyItems}
            selectedId={selectedSpecialty}
            onSelect={setSelectedSpecialty}
          />
        </div>

        {/* Doctor Count indicator */}
        <div className="flex items-center justify-between text-xs text-slateText-secondary px-2">
          <span>
            عرض <strong>{filteredDoctors.length}</strong> طبيباً واستشارياً
          </span>
        </div>

        {/* Doctors Grid using deep DoctorCard */}
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                id={doc.id}
                name={doc.full_name_ar || ""}
                academicTitle={doc.academic_title_ar || "استشاري / أخصائي"}
                specialtyName={doc.specialty?.name_ar || "العيادات الخارجية"}
                subspecialty={doc.sub_specialty_ar || undefined}
                roomNumber={doc.specialty?.room_number || "عيادة ١"}
                consultationFee={doc.consultation_fee_egp || 35}
                phone={doc.contact_phone || "035500000"}
                whatsappNumber={doc.whatsapp_number || "201200000000"}
                schedules={[
                  {
                    dayOfWeek: doc.schedule_details_ar || "طوال الأسبوع",
                    timeRange: "مساءً",
                  },
                ]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-copticGold-200 p-6">
            <p className="font-heading text-sm text-slateText-muted">
              لا يوجد أطباء مطابقون لمعايير البحث الحالية.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
