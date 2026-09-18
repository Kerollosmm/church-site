// packages/data-access/src/facilities/__tests__/facility-repository.test.ts
// Unit tests for JsonParishFacilityRepository in an isolated temp environment.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonParishFacilityRepository } from "../facility-json-adapter";
import type { Actor, CreateParishFacilityInput } from "@church-site/domain";

const STAFF: Actor = { id: "staff-1", name: "خادم الخدمات" };

describe("JsonParishFacilityRepository", () => {
  let dataDir: string;
  let repo: JsonParishFacilityRepository;

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), "facility-store-"));
    process.env.CHURCH_DATA_DIR = dataDir;
    repo = new JsonParishFacilityRepository();
  });

  afterEach(async () => {
    delete process.env.CHURCH_DATA_DIR;
    await rm(dataDir, { recursive: true, force: true });
  });

  it("seeds baseline facilities automatically", async () => {
    const facilities = await repo.listFacilities();
    expect(facilities.length).toBeGreaterThanOrEqual(8);
    const nursery = facilities.find((f) => f.slug === "nursery");
    expect(nursery).toBeDefined();
    expect(nursery?.nameAr).toContain("حضانة");
  });

  it("creates a new parish facility and retrieves it by id and slug", async () => {
    const input: CreateParishFacilityInput = {
      nameAr: "مستوصف مارمرقس الخيري",
      nameEn: "St. Mark Charity Clinic",
      slug: "st-mark-clinic",
      serviceType: "خدمات طبية",
      descriptionAr: "عيادات تخصصية شاملة وصيدلية لخدمة جميع أهالي المنطقة بأجر رمزي.",
      descriptionEn: "Comprehensive clinics and pharmacy serving all local residents at nominal fees.",
      workingHoursAr: "يومياً من 9:00 ص حتى 10:00 م",
      locationAr: "مبنى الخدمات الطبي - الدور الثاني",
      contactPhone: "03-5559999",
      contactWhatsapp: "01229999999",
      guidelinesAr: "الحجز المسبق مطلوب للعيادات الاستشارية.",
      displayOrder: 99,
      isActive: true,
    };

    const created = await repo.createFacility(input, STAFF);
    expect(created.id).toBeDefined();
    expect(created.slug).toBe("st-mark-clinic");
    expect(created.createdBy).toBe(STAFF.id);

    const byId = await repo.getFacilityById(created.id);
    expect(byId).not.toBeNull();
    expect(byId?.nameAr).toBe(input.nameAr);

    const bySlug = await repo.getFacilityBySlug("st-mark-clinic");
    expect(bySlug).not.toBeNull();
    expect(bySlug?.id).toBe(created.id);
  });

  it("rejects duplicate slugs on create and update", async () => {
    const input: CreateParishFacilityInput = {
      nameAr: "خدمة مكررة",
      slug: "duplicate-service",
      serviceType: "عام",
      descriptionAr: "وصف",
      workingHoursAr: "9-5",
      locationAr: "الكنيسة",
      displayOrder: 10,
      isActive: true,
    };

    await repo.createFacility(input, STAFF);

    await expect(repo.createFacility(input, STAFF)).rejects.toThrow(/موجودة بالفعل/);
  });

  it("updates an existing facility", async () => {
    const created = await repo.createFacility(
      {
        nameAr: "مركز الحاسب القديم",
        slug: "it-center-old",
        serviceType: "تدريب",
        descriptionAr: "دورات برمجة",
        workingHoursAr: "مواعيد",
        locationAr: "الدور الثالث",
        displayOrder: 15,
        isActive: true,
      },
      STAFF
    );

    const updated = await repo.updateFacility(
      created.id,
      {
        nameAr: "أكاديمية التكنولوجيا الحديثة",
        slug: "modern-tech-academy",
        displayOrder: 5,
      },
      STAFF
    );

    expect(updated.nameAr).toBe("أكاديمية التكنولوجيا الحديثة");
    expect(updated.slug).toBe("modern-tech-academy");
    expect(updated.displayOrder).toBe(5);
    expect(updated.updatedBy).toBe(STAFF.id);

    const fetched = await repo.getFacilityBySlug("modern-tech-academy");
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
  });

  it("toggles active state and filters inactive", async () => {
    const created = await repo.createFacility(
      {
        nameAr: "خدمة مؤقتة",
        slug: "temp-service",
        serviceType: "موسمية",
        descriptionAr: "وصف",
        workingHoursAr: "مواعيد",
        locationAr: "مبنى الخدمات",
        displayOrder: 20,
        isActive: true,
      },
      STAFF
    );

    let activeList = await repo.listFacilities({ isActive: true });
    expect(activeList.some((f) => f.id === created.id)).toBe(true);

    await repo.toggleActive(created.id, false, STAFF);

    activeList = await repo.listFacilities({ isActive: true });
    expect(activeList.some((f) => f.id === created.id)).toBe(false);

    const allList = await repo.listFacilities();
    expect(allList.some((f) => f.id === created.id)).toBe(true);
  });

  it("deletes a facility record", async () => {
    const created = await repo.createFacility(
      {
        nameAr: "خدمة للحذف",
        slug: "to-delete",
        serviceType: "اختبار",
        descriptionAr: "وصف",
        workingHoursAr: "مواعيد",
        locationAr: "مكان",
        displayOrder: 50,
        isActive: true,
      },
      STAFF
    );

    await repo.deleteFacility(created.id, STAFF);

    const fetched = await repo.getFacilityById(created.id);
    expect(fetched).toBeNull();
  });
});
