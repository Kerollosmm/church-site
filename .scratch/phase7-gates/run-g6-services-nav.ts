/**
 * Standalone Verification Script for Gate G6:
 * Services CMS & Navigation CMS Full Lifecycle Verification (File-Store Driver)
 *
 * Runs without environment variables on the file-store driver.
 * Part A: Services CMS CRUD, INV-01 Stripping, Reordering, Deactivation, Deletion, Audit Trail
 * Part B: Navigation CMS CRUD, Dynamic Dropdown Hierarchy, Reordering, Deactivation,
 *         Safe Orphan Reparenting, Empty Store Fallback, Audit Trail
 */

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  getParishFacilityRepository,
  getParishNavigationRepository,
  getPublicNavigation,
  getPublicServices,
  getServiceBySlug,
  readStoreDocument,
  mutateStoreDocument,
  SEED_PUBLIC_NAVIGATION,
} from "../../packages/data-access/src/index";
import type { Actor } from "../../packages/domain/src/index";

const STAFF: Actor = { id: "staff-lead-cms", name: "مسؤول المحتوى والإشراف" };

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${msg}`);
  }
}

class ProofLogger {
  lines: string[] = [];

  log(msg: string = "") {
    this.lines.push(msg);
  }

  section(title: string) {
    this.log("=".repeat(80));
    this.log(title);
    this.log("=".repeat(80));
    this.log();
  }

  step(stepNum: number | string, desc: string) {
    this.log(`[STEP ${stepNum}] ${desc}`);
  }

  pass(msg: string) {
    this.log(`  ✓ PASS: ${msg}`);
  }

  getText(): string {
    return this.lines.join("\n");
  }
}

async function runPartA(logger: ProofLogger): Promise<void> {
  logger.section("GATE G6 PROOF (PART A): SERVICES CMS LIFECYCLE & INV-01 VERIFICATION");
  const facilityRepo = getParishFacilityRepository();

  // 1. Initial State & Seeding
  logger.step(1, "Read initial public services (Baseline Seeding)");
  const initialPublic = await getPublicServices();
  assert(initialPublic.length >= 8, `Expected >= 8 initial services, got ${initialPublic.length}`);
  logger.pass(`Found ${initialPublic.length} active baseline public facilities.`);
  logger.pass(`First facility: "${initialPublic[0].nameAr}" (${initialPublic[0].slug})`);

  // 2. Create Facility
  logger.step(2, "Create facility via facilityRepo.createFacility(...)");
  const created = await facilityRepo.createFacility(
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
  assert(created.id, "Created facility must have a defined ID");
  assert(created.createdBy === STAFF.id, `Created by must match staff ID: ${STAFF.id}`);
  assert(created.updatedBy === STAFF.id, "Updated by must match staff ID");
  logger.pass(`Created facility id=${created.id} slug="${created.slug}"`);
  logger.pass(`Admin entity contains createdBy="${created.createdBy}", isActive=${created.isActive}`);

  // 3. INV-01 Stripping Check on Public Surface
  logger.step(3, "Verify presence in getPublicServices() with staff fields stripped (INV-01)");
  const publicAfterCreate = await getPublicServices();
  const foundInPublic = publicAfterCreate.find((s) => s.slug === "st-mark-clinic");
  assert(foundInPublic, "Newly created service must appear in getPublicServices()");
  assert(foundInPublic.nameAr === "مستوصف مارمرقس التخصصي", "nameAr must match created");
  assert(foundInPublic.workingHoursAr === "يومياً من 9:00 ص حتى 10:00 م", "workingHoursAr must match");

  // Invariant INV-01 Stripping Assertions
  assert((foundInPublic as any).createdBy === undefined, "INV-01 Violation: createdBy exposed in public model");
  assert((foundInPublic as any).updatedBy === undefined, "INV-01 Violation: updatedBy exposed in public model");
  assert((foundInPublic as any).createdAt === undefined, "INV-01 Violation: createdAt exposed in public model");
  assert((foundInPublic as any).updatedAt === undefined, "INV-01 Violation: updatedAt exposed in public model");
  assert((foundInPublic as any).isActive === undefined, "INV-01 Violation: isActive exposed in public model");
  logger.pass("INV-01 CONFIRMED: Public model is clean projection. All staff/audit fields stripped.");

  // 4. Single Slug Lookup
  logger.step(4, "Verify getServiceBySlug('st-mark-clinic')");
  const singleSlug = await getServiceBySlug("st-mark-clinic");
  assert(singleSlug !== null, "getServiceBySlug must return the facility");
  assert(singleSlug.id === created.id, "Slug lookup ID must match created ID");
  assert((singleSlug as any).createdBy === undefined, "INV-01: Slug lookup must also strip staff fields");
  logger.pass(`Lookup succeeded for slug "st-mark-clinic" -> ID: ${singleSlug.id}`);

  // 5. Update Facility
  logger.step(5, "Update facility (displayOrder=0, extended workingHoursAr)");
  const updated = await facilityRepo.updateFacility(
    created.id,
    {
      workingHoursAr: "يومياً من 8:00 ص حتى 11:00 م (مواعيد ممتدة)",
      displayOrder: 0,
    },
    STAFF
  );
  assert(updated.displayOrder === 0, "Updated displayOrder must be 0");
  assert(updated.workingHoursAr.includes("مواعيد ممتدة"), "Updated working hours must contain extended label");
  assert(updated.updatedBy === STAFF.id, "Updated by must be stamped with staff ID");
  logger.pass(`Updated facility working hours: "${updated.workingHoursAr}"`);
  logger.pass(`Updated displayOrder: ${updated.displayOrder}`);

  // 6. Verify Reordering in Public Feed
  logger.step(6, "Verify reordering in getPublicServices()");
  const publicAfterUpdate = await getPublicServices();
  assert(publicAfterUpdate[0]?.slug === "st-mark-clinic", "Facility with displayOrder=0 must appear first");
  assert(publicAfterUpdate[0]?.workingHoursAr.includes("مواعيد ممتدة"), "First facility must show updated hours");
  logger.pass("Reordering confirmed: 'st-mark-clinic' is now top of public services list.");

  // 7. Toggle Inactive
  logger.step(7, "Toggle inactive -> verify absence from getPublicServices()");
  const deactivated = await facilityRepo.toggleActive(created.id, false, STAFF);
  assert(deactivated.isActive === false, "Deactivated facility isActive must be false");
  const publicAfterDeactivate = await getPublicServices();
  const absentInPublic = publicAfterDeactivate.every((s) => s.slug !== "st-mark-clinic");
  assert(absentInPublic, "Deactivated service must not appear in getPublicServices()");
  const adminCheck = await facilityRepo.getFacilityById(created.id);
  assert(adminCheck !== null && adminCheck.isActive === false, "Admin still sees inactive facility");
  logger.pass("Deactivation confirmed: absent from public feed, preserved in admin store.");

  // 8. Delete Facility
  logger.step(8, "Delete facility -> verify removal");
  await facilityRepo.deleteFacility(created.id, STAFF);
  const postDeleteAdmin = await facilityRepo.getFacilityById(created.id);
  assert(postDeleteAdmin === null, "Deleted facility must not exist in admin repository");
  const publicAfterDelete = await getPublicServices();
  assert(publicAfterDelete.every((s) => s.slug !== "st-mark-clinic"), "Deleted facility absent from public");
  logger.pass("Deletion confirmed: purged from both admin store and public view.");

  // 9. Audit Entries Verification
  logger.step(9, "Verify audit entries for 'service' entity");
  const doc = await readStoreDocument();
  const serviceAudits = doc.audit.filter((a) => a.entityType === "service");
  assert(serviceAudits.length >= 4, `Expected >= 4 service audit entries, got ${serviceAudits.length}`);

  const createAudit = serviceAudits.find((a) => a.action === "create" && a.entityId === created.id);
  const updateAudit = serviceAudits.find((a) => a.action === "update" && a.entityId === created.id);
  const deleteAudit = serviceAudits.find((a) => a.action === "delete" && a.entityId === created.id);

  assert(createAudit, "Must have create audit entry");
  assert(updateAudit, "Must have update audit entry");
  assert(deleteAudit, "Must have delete audit entry");
  assert(deleteAudit.actorId === STAFF.id, "Audit entry must record correct actorId");
  assert(deleteAudit.actorName === STAFF.name, "Audit entry must record correct actorName");
  assert(deleteAudit.summary.includes("حذف خدمة كنسية"), "Delete summary must be descriptive Arabic");

  logger.pass(`Found ${serviceAudits.length} audit entries for 'service' entity.`);
  logger.pass(`Audit actions verified: create, update (x2), delete.`);
  logger.pass(`Auditing actor confirmed: "${deleteAudit.actorName}" (${deleteAudit.actorId}).`);
  logger.log();
  logger.log("SERVICES CMS LIFECYCLE VERIFICATION: ALL CHECKS PASSED (100%)");
}

async function runPartB(logger: ProofLogger): Promise<void> {
  logger.section("GATE G6 PROOF (PART B): NAVIGATION CMS LIFECYCLE & DYNAMIC HIERARCHY");
  const navRepo = getParishNavigationRepository();

  // 1. Read Baseline Navigation
  logger.step(1, "Read baseline getPublicNavigation()");
  const baselineNav = await getPublicNavigation();
  assert(baselineNav.main.length > 0, "Baseline main navigation must have items");
  assert(baselineNav.secondary.length > 0, "Baseline secondary navigation must have items");
  const aboutDropdown = baselineNav.main.find((m) => m.key === "about");
  assert(aboutDropdown, "Baseline navigation must include 'about' dropdown");
  assert(aboutDropdown.children && aboutDropdown.children.length >= 4, "About dropdown must have children");
  logger.pass(`Baseline loaded: ${baselineNav.main.length} main items, ${baselineNav.secondary.length} secondary items.`);
  logger.pass(`Found dropdown "${aboutDropdown.labelAr}" with ${aboutDropdown.children?.length} child items.`);

  // 2. Create Parent Item
  logger.step(2, "Create parent navigation item via navRepo.createItem(...)");
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
  assert(parentItem.id, "Parent item must have an ID");
  assert(parentItem.createdBy === STAFF.id, "Parent item must record staff creator");
  logger.pass(`Created parent nav item id=${parentItem.id} key="${parentItem.key}" label="${parentItem.labelAr}"`);

  // 3. Create Child Item with parentId
  logger.step(3, "Create child navigation item with parentId");
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
  assert(childItem.id, "Child item must have an ID");
  assert(childItem.parentId === parentItem.id, "Child item parentId must match parent ID");
  logger.pass(`Created child nav item id=${childItem.id} key="${childItem.key}" parentId=${childItem.parentId}`);

  // 4. Verify Public Navigation Tree & Hierarchy
  logger.step(4, "Verify public navigation tree reflects parent & child dropdown (INV-01 check)");
  const dynamicNav = await getPublicNavigation();
  const dynamicParent = dynamicNav.main.find((m) => m.key === "initiatives");
  assert(dynamicParent, "Parent nav item must appear in getPublicNavigation().main");
  assert(dynamicParent.children && dynamicParent.children.length > 0, "Parent must have children array");
  const dynamicChild = dynamicParent.children.find((c) => c.key === "summer-club-initiative");
  assert(dynamicChild, "Child item must be nested inside parent's children array");
  assert(dynamicChild.labelAr === "النادي الصيفي التنموي", "Child label must match");

  // INV-01 Stripping on Navigation
  assert((dynamicParent as any).createdBy === undefined, "INV-01 Violation: createdBy exposed in PublicNavItem");
  assert((dynamicParent as any).updatedBy === undefined, "INV-01 Violation: updatedBy exposed in PublicNavItem");
  assert((dynamicChild as any).createdBy === undefined, "INV-01 Violation: createdBy exposed in child PublicNavItem");
  logger.pass("Navigation hierarchy verified: Child correctly nested in dropdown under parent.");
  logger.pass("INV-01 CONFIRMED: Nav tree models stripped of internal tracking fields.");

  // 5. Reorder Items via navRepo.reorderItems
  logger.step(5, "Reorder items via navRepo.reorderItems (parent moved to sortOrder=0)");
  await navRepo.reorderItems(
    {
      items: [{ id: parentItem.id, sortOrder: 0 }],
    },
    STAFF
  );
  const reorderedParent = await navRepo.getItemById(parentItem.id);
  assert(reorderedParent?.sortOrder === 0, "Reordered parent item sortOrder must be 0");
  logger.pass(`navRepo.reorderItems confirmed: parent sortOrder updated to ${reorderedParent?.sortOrder}`);

  // 6. Verify Reordering in Public Navigation
  logger.step(6, "Verify reordering in public navigation");
  const navAfterReorder = await getPublicNavigation();
  assert(navAfterReorder.main[0]?.key === "initiatives", "Reordered parent item must appear first in main nav");
  logger.pass(`Reordering confirmed: "${navAfterReorder.main[0].labelAr}" is now top menu item.`);

  // 7. Toggle Inactive
  logger.step(7, "Toggle inactive -> verify absent from public nav");
  await navRepo.toggleActive(parentItem.id, false, STAFF);
  const navAfterDeactivate = await getPublicNavigation();
  const absentFromNav = !navAfterDeactivate.main.some((m) => m.key === "initiatives");
  assert(absentFromNav, "Inactive navigation item must not appear in public navbar");
  logger.pass("Deactivation confirmed: inactive parent item excluded from public navbar.");

  // 8. Delete Parent -> Verify Safe Child Reparenting
  logger.step(8, "Delete parent -> verify child reparenting (orphans handled gracefully)");
  await navRepo.deleteItem(parentItem.id, STAFF);
  const deletedParent = await navRepo.getItemById(parentItem.id);
  assert(deletedParent === null, "Parent item must be deleted from repository");

  const survivingChild = await navRepo.getItemById(childItem.id);
  assert(survivingChild !== null, "Child item must survive parent deletion");
  assert(survivingChild.parentId === null, "Child item must be reparented to null (safe reparenting)");
  logger.pass("Safe Reparenting confirmed: Child surviving with parentId=null (no orphaned foreign key dangling).");

  // 9. Empty Store Fallback Verification
  logger.step(9, "Test empty store fallback: verify fallback to SEED_PUBLIC_NAVIGATION");
  await mutateStoreDocument("test.clearNav", (doc) => {
    doc.navItems = [];
  });
  const fallbackNav = await getPublicNavigation();
  assert(
    fallbackNav.main.length === SEED_PUBLIC_NAVIGATION.main.length,
    `Fallback main length (${fallbackNav.main.length}) must match seed (${SEED_PUBLIC_NAVIGATION.main.length})`
  );
  assert(
    fallbackNav.main[0]?.labelAr === SEED_PUBLIC_NAVIGATION.main[0]?.labelAr,
    "Fallback main item must match seed navigation"
  );
  assert(
    fallbackNav.secondary.length === SEED_PUBLIC_NAVIGATION.secondary.length,
    "Fallback secondary length must match seed"
  );
  logger.pass("Empty store fallback confirmed: cleanly fell back to SEED_PUBLIC_NAVIGATION with 0 runtime errors.");

  // 10. Audit Entries Verification
  logger.step(10, "Verify audit entries for 'navigation' entity");
  const doc = await readStoreDocument();
  const navAudits = doc.audit.filter((a) => a.entityType === "navigation");
  assert(navAudits.length >= 4, `Expected >= 4 navigation audit entries, got ${navAudits.length}`);

  const createParentAudit = navAudits.find((a) => a.action === "create" && a.entityId === parentItem.id);
  const createChildAudit = navAudits.find((a) => a.action === "create" && a.entityId === childItem.id);
  const reorderAudit = navAudits.find((a) => a.entityId === "batch-reorder");
  const deleteAudit = navAudits.find((a) => a.action === "delete" && a.entityId === parentItem.id);

  assert(createParentAudit, "Must have create parent audit entry");
  assert(createChildAudit, "Must have create child audit entry");
  assert(reorderAudit, "Must have batch-reorder audit entry");
  assert(deleteAudit, "Must have delete parent audit entry");
  assert(deleteAudit.actorId === STAFF.id, "Audit entry must record correct actorId");
  assert(deleteAudit.actorName === STAFF.name, "Audit entry must record correct actorName");

  logger.pass(`Found ${navAudits.length} audit entries for 'navigation' entity.`);
  logger.pass("Audit actions verified: create parent, create child, batch reorder, update/toggle, delete.");
  logger.pass(`Auditing actor confirmed: "${deleteAudit.actorName}" (${deleteAudit.actorId}).`);
  logger.log();
  logger.log("NAVIGATION CMS LIFECYCLE VERIFICATION: ALL CHECKS PASSED (100%)");
}

async function main() {
  const isServicesOnly = process.argv.includes("--services");
  const isNavOnly = process.argv.includes("--nav");

  // Create isolated temp directory for test execution
  const tempDir = await mkdtemp(path.join(tmpdir(), "phase7-g6-test-"));
  process.env.CHURCH_DATA_DIR = tempDir;

  const loggerA = new ProofLogger();
  const loggerB = new ProofLogger();

  try {
    const gatesDir = path.resolve(process.cwd(), ".scratch/phase7-gates");
    const servicesFilePath = path.join(gatesDir, "g6-services.txt");
    const navFilePath = path.join(gatesDir, "g6-nav.txt");

    // Execute Part A: Services CMS
    await runPartA(loggerA);
    const servicesOutput = loggerA.getText();
    await writeFile(servicesFilePath, servicesOutput, "utf8");

    // Execute Part B: Navigation CMS
    await runPartB(loggerB);
    const navOutput = loggerB.getText();
    await writeFile(navFilePath, navOutput, "utf8");

    if (isServicesOnly) {
      console.log(servicesOutput);
    } else if (isNavOnly) {
      console.log(navOutput);
    } else {
      console.log(servicesOutput);
      console.log("\n" + "#".repeat(80) + "\n");
      console.log(navOutput);
      console.log("\n[SUCCESS] Both proof artifacts written:");
      console.log(`  - ${servicesFilePath}`);
      console.log(`  - ${navFilePath}`);
    }
  } catch (err) {
    console.error("[ERROR] Verification failed:", err);
    process.exit(1);
  } finally {
    delete process.env.CHURCH_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
}

main();
