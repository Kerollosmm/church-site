import React from "react";
import Link from "next/link";
import { FileClock } from "lucide-react";
import { getCondolenceBookings } from "@church-site/data-access";
import { requireStaff } from "@/lib/auth/require-staff";
import { ADMIN_ROLE_LABELS_AR, adminRoleFromStaffRole } from "@church-site/domain";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { BookingsManager } from "./BookingsManager";

export const metadata = {
  title: "حجوزات قاعة العزاء — لوحة تحكم كنيسة القديسين",
};

/**
 * `/admin/bookings` — reads the REAL bookings through `getCondolenceBookings()` (session-scoped,
 * never cached) and hands them to the interactive manager. There is no seeded fallback for this
 * table: when there is nothing to show, the page shows an empty state, never fabricated rows.
 *
 * Approval/rejection are Server Actions in `src/actions/admin-booking-actions.ts`, each of which
 * re-runs `requireStaff()` before touching the database.
 */
export default async function AdminBookingsPage() {
  const [session, { bookings, errorMessageAr }] = await Promise.all([
    requireStaff(),
    getCondolenceBookings(),
  ]);

  const role = adminRoleFromStaffRole(session.role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title="حجوزات قاعة العزاء (المناسبات)"
        description="مراجعة واعتماد أو الاعتذار عن طلبات حجز قاعة العزاء الواردة من شعب الكنيسة، مع إمكانية البحث والتصفية حسب الحالة."
        roleLabel={roleLabel}
      >
        <Link href="/audit" className={ADMIN_BUTTON_SECONDARY}>
          <FileClock aria-hidden="true" className="h-4 w-4" />
          <span>سجل التدقيق</span>
        </Link>
      </AdminPageHeader>

      <BookingsManager bookings={bookings} loadErrorAr={errorMessageAr} />
    </div>
  );
}

