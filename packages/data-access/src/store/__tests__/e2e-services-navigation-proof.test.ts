// packages/data-access/src/store/__tests__/e2e-services-navigation-proof.test.ts
// Gate G6: End-to-End Proof for Phase 7.2 Services & Navigation CMS.
// Proves full lifecycle on zero-env file store: CRUD, audit logging, RLS/INV-01 stripping, and dynamic hierarchy.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getParishFacilityRepository,
  getParishNavigationRepository,
  getPublicNavigation,
  getPublicServices,
  getServiceBySlug,
  readStoreDocument,
  SEED_PUBLIC_NAVIGATION,
} from "../../index";
import type { Actor } from "@church-site/domain";

const STAFF: Actor = { id: "staff-lead-cms", name: "مسؤول المحتوى والإشراف" };

describe("Gate G6: E2E Services & Navigation CMS Proof", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), "phase7-e2e-"));
    process.env.CHURCH_DATA_DIR = dataDir;
  });

  afterEach(async () => {
    delete process.env.CHURCH_DATA_DIR;
    await rm(dataDir, { recursive: true, force: true });
  });

  it("proves complete Services & Navigation CMS lifecycle on file-store engine", async () => {
    const facilityRepo = getParishFacilityRepository();
    const navRepo = getParishNavigationRepository();

    // =========================================================================
    // 1. Schema Version & Baseline Seeding
    // =========================================================================
    const initialDoc = await readStoreDocument();
    expect(initialDoc.schemaVersion).toBe(5);
    expect(initialDoc.facilities.length).toBeGreaterThanOrEqual(8);
    expect(initialDoc.navItems.length).toBeGreaterThanOrEqual(17);

    // =========================================================================
    // 2. Services CMS Lifecycle (Admin Control & Public INV-01 Stripping)
    // =========================================================================
    // A. Add new service
    const newService = await facilityRepo.createFacility(
      {
        nameAr: "مستوصف مارمرقس التخصصي",
        nameEn: "St. Mark Specialized Clinic",
        slug: "st-mark-clinic",
        serviceType: "خدمات طبية ورعاية صحية",
        descriptionAr: "عيادات خارجية متكاملة وصيدلية لخدمة جميع أهالي المنطقة بأجر رمزي.",
        descriptionEn: "Outpatient clinics and pharmacy serving all local residents at nominal fees.",
        workingHoursAr: "يومياً من 9:00 ص حتى 10:00 م",
        locationAr: "مبنى الخدمات الطبي - الدور الثاني",
        contactPhone: "03-5559999",
        contactWhatsapp: "01229999999",
        guidelinesAr: "الحجز المسبق مطلوب للعيادات الاستشارية.",
        displayOrder: 99,
        isActive: true,
      },
      STAFF
    );

    expect(newService.id).toBeDefined();
    expect(newService.createdBy).toBe(STAFF.id);

    // B. Public reader verification: verifies INV-01 stripping (no createdBy, updatedBy)
    const publicServices = await getPublicServices();
    const publicFound = publicServices.find((s) => s.slug === "st-mark-clinic");
    expect(publicFound).toBeDefined();
    expect(publicFound?.nameAr).toBe("مستوصف مارمرقس التخصصي");
    expect((publicFound as any).createdBy).toBeUndefined();
    expect((publicFound as any).updatedBy).toBeUndefined();

    // C. Verify single slug lookup
    const singleLookup = await getServiceBySlug("st-mark-clinic");
    expect(singleLookup).not.toBeNull();
    expect(singleLookup?.id).toBe(newService.id);

    // D. Staff updates service
    const updatedService = await facilityRepo.updateFacility(
      newService.id,
      {
        workingHoursAr: "يومياً من 8:00 ص حتى 11:00 م (مواعيد ممتدة)",
        displayOrder: 1,
      },
      STAFF
    );
    expect(updatedService.workingHoursAr).toContain("مواعيد ممتدة");
    expect(updatedService.displayOrder).toBe(1);
    expect(updatedService.updatedBy).toBe(STAFF.id);

    // E. Toggle active state -> verify exclusion from public surface
    await facilityRepo.toggleActive(newService.id, false, STAFF);
    const publicAfterDeactivate = await getPublicServices();
    expect(publicAfterDeactivate.some((s) => s.slug === "st-mark-clinic")).toBe(false);

    // F. Re-activate & Delete
    await facilityRepo.toggleActive(newService.id, true, STAFF);
    await facilityRepo.deleteFacility(newService.id, STAFF);
    const postDelete = await facilityRepo.getFacilityById(newService.id);
    expect(postDelete).toBeNull();

    // =========================================================================
    // 3. Navigation CMS Lifecycle (Dynamic Hierarchy, Dropdowns & Reordering)
    // =========================================================================
    // A. Baseline hierarchy verified
    const initialNav = await getPublicNavigation();
    expect(initialNav.main.length).toBeGreaterThan(0);
    const aboutDropdown = initialNav.main.find((m) => m.key === "about");
    expect(aboutDropdown).toBeDefined();
    expect(aboutDropdown?.children?.length).toBeGreaterThanOrEqual(4);

    // B. Staff adds new parent menu item
    const parentItem = await navRepo.createItem(
      {
        key: "initiatives",
        labelAr: "المبادرات الرعوية",
        labelEn: "Parish Initiatives",
        href: "/initiatives",
        section: "main",
        sortOrder: 15,
        isActive: true,
        isPublic: true,
      },
      STAFF
    );
    expect(parentItem.id).toBeDefined();

    // C. Staff adds child dropdown under new parent item
    const childItem = await navRepo.createItem(
      {
        key: "summer-club-initiative",
        labelAr: "النادي الصيفي التنموي",
        labelEn: "Summer Club",
        href: "/initiatives/summer-club",
        section: "main",
        parentId: parentItem.id,
        sortOrder: 1,
        isActive: true,
        isPublic: true,
      },
      STAFF
    );
    expect(childItem.parentId).toBe(parentItem.id);

    // D. Verify public navigation tree reflects new item and child dropdown
    const dynamicNav = await getPublicNavigation();
    const dynamicParent = dynamicNav.main.find((m) => m.key === "initiatives");
    expect(dynamicParent).toBeDefined();
    expect(dynamicParent?.children).toBeDefined();
    expect(dynamicParent?.children?.some((c) => c.key === "summer-club-initiative")).toBe(true);

    // E. Reorder items in batch
    await navRepo.reorderItems(
      {
        items: [
          { id: parentItem.id, sortOrder: 1 },
        ],
      },
      STAFF
    );
    const reorderedItem = await navRepo.getItemById(parentItem.id);
    expect(reorderedItem?.sortOrder).toBe(1);

    // F. Toggle inactive -> immediately hidden from public navbar
    await navRepo.toggleActive(parentItem.id, false, STAFF);
    const navAfterDeactivate = await getPublicNavigation();
    expect(navAfterDeactivate.main.some((m) => m.key === "initiatives")).toBe(false);

    // G. Delete parent item -> verify safe reparenting and tree continuity
    await navRepo.deleteItem(parentItem.id, STAFF);
    const deletedParent = await navRepo.getItemById(parentItem.id);
    expect(deletedParent).toBeNull();
    const survivingChild = await navRepo.getItemById(childItem.id);
    expect(survivingChild?.parentId).toBeNull();

    // =========================================================================
    // 4. Audit Trail Verification
    // =========================================================================
    const finalDoc = await readStoreDocument();
    const serviceAudits = finalDoc.audit.filter((a) => a.entityType === "service");
    const navAudits = finalDoc.audit.filter((a) => a.entityType === "navigation");

    expect(serviceAudits.length).toBeGreaterThanOrEqual(4); // create, update, deactivate, delete
    expect(navAudits.length).toBeGreaterThanOrEqual(4); // create parent, create child, reorder, delete

    const latestAudit = finalDoc.audit[finalDoc.audit.length - 1];
    expect(latestAudit.actorId).toBe(STAFF.id);
    expect(latestAudit.actorName).toBe(STAFF.name);
  });
});
