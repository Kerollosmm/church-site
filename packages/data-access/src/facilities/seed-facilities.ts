// packages/data-access/src/facilities/seed-facilities.ts
//
// Seeded baseline for parish facilities (public services), converted from seed-data.ts

import { SEED_PUBLIC_SERVICES } from "../data/seed-data";
import type { ParishFacility, PublicParishFacility } from "@church-site/domain";

export function toPublicParishFacility(f: ParishFacility): PublicParishFacility {
  return {
    id: f.id,
    nameAr: f.nameAr,
    nameEn: f.nameEn,
    slug: f.slug,
    serviceType: f.serviceType,
    descriptionAr: f.descriptionAr,
    descriptionEn: f.descriptionEn,
    workingHoursAr: f.workingHoursAr,
    locationAr: f.locationAr,
    contactPhone: f.contactPhone,
    contactWhatsapp: f.contactWhatsapp,
    guidelinesAr: f.guidelinesAr,
    displayOrder: f.displayOrder,

    name_ar: f.nameAr,
    name_en: f.nameEn,
    service_type: f.serviceType,
    description_ar: f.descriptionAr,
    description_en: f.descriptionEn,
    working_hours_ar: f.workingHoursAr,
    operating_hours_ar: f.workingHoursAr,
    location_ar: f.locationAr,
    contact_phone: f.contactPhone,
    contact_whatsapp: f.contactWhatsapp,
    guidelines_ar: f.guidelinesAr,
    display_order: f.displayOrder,
  };
}

export const SEED_PARISH_FACILITIES: ParishFacility[] = SEED_PUBLIC_SERVICES.map((s) => ({
  id: s.id,
  nameAr: s.name_ar,
  nameEn: s.name_en ?? null,
  slug: s.slug,
  serviceType: s.service_type,
  descriptionAr: s.description_ar,
  descriptionEn: s.description_en ?? null,
  workingHoursAr: s.working_hours_ar,
  locationAr: s.location_ar,
  contactPhone: s.contact_phone ?? null,
  contactWhatsapp: s.contact_whatsapp ?? null,
  guidelinesAr: s.guidelines_ar ?? null,
  displayOrder: s.display_order,
  isActive: s.is_active,
  createdAt: s.created_at,
  updatedAt: s.updated_at ?? s.created_at,
  createdBy: s.created_by ?? null,
  updatedBy: s.updated_by ?? null,
}));

export const SEED_PUBLIC_PARISH_FACILITIES: PublicParishFacility[] = SEED_PARISH_FACILITIES
  .filter((f) => f.isActive)
  .sort((a, b) => a.displayOrder - b.displayOrder)
  .map(toPublicParishFacility);
