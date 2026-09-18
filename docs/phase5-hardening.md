# Phase 5: Production Hardening, Real Transactional Email & Audit Trail UX

- **Phase**: Phase 5 (Hardening)
- **Status**: Completed & Verified
- **Date**: 2026-09-18
- **Core Invariants**:
  - **Zero In-App Cron / Zero New Dependencies** (`pnpm-lock.yaml` unchanged, built-in `fetch` only).
  - **INV-01 (Zero-Auth Static Public Build)** (53/53 static routes build with 0 environment variables).
  - **Fail-Closed Production Integrity** (Refusal to serve fake seed data on live outages).
  - **Tamper-Evident Audit Accountability** (Every delivery attempt and mutation recorded).

---

## 1. Executive Summary

Phase 5 hardens the Coptic Orthodox parish portal across four operational pillars:
1. **Real Transactional Email via Resend**: Implemented via built-in Node 20+ `fetch` (zero third-party SDK dependencies). Follows honest delivery semantics (no false promises of delivery, single-attempt without blind retry storms) and logs tamper-resistant delivery notes to `audit_log`.
2. **Production Database Integrity (`readOrSeed`)**: Strict invariant preventing production database failures or outages from silently serving fake/stale seed data. When `NODE_ENV === "production"` and Supabase credentials are configured, any query failure throws immediately to trigger operational alerts.
3. **Deeper Audit Trail UX**: Enhanced parish staff audit trail with case-insensitive actor filtering (name and ID) across both SQLite/file JSON and Supabase PostgreSQL drivers, paired with a RFC-4180 compliant CSV export featuring UTF-8 BOM (`\uFEFF`) for seamless Arabic display in Microsoft Excel.
4. **Seam Consolidation & Backup Policy**: Consolidated duplicate email seams (`apps/web/src/lib/notify` deleted in favor of `@church-site/data-access`), established ADR-0005 rejecting in-app cron daemons in serverless runtimes, and documented official managed backup and off-app CLI dump runbooks.

---

## 2. Mailer Architecture & Resend Integration

### 2.1 Pure `fetch` Client (`packages/data-access/src/notify/resend-mailer.ts`)
- Calls `https://api.resend.com/emails` directly via global `fetch`.
- Zero SDK bloat; strict adherence to single dependency lockfile.
- Headers: `Authorization: Bearer <RESEND_API_KEY>`, `Content-Type: application/json`.
- Payload format:
  ```json
  {
    "from": "alerts@stmaximus.church",
    "to": ["subscriber@example.com"],
    "subject": "تسجيل الاشتراك في تنبيهات فعاليات الكنيسة",
    "text": "..."
  }
  ```

### 2.2 Honest Delivery Semantics
- **Success (HTTP 2xx)**: Resolves `{ delivered: true, provider: "resend", notificationLogged: true, note: "Resend message ID: msg_..." }`.
- **Rejection (HTTP 4xx / 5xx)**: Resolves `{ delivered: false, provider: "resend", notificationLogged: true, note: "Resend API error (HTTP ...): ..." }`.
- **Network Outage**: Catches network/timeout rejections gracefully without crashing the subscription transaction; records failure in note.
- **Audit Logging**: Appends an audit note on the subscriber row under actor `"نظام إرسال البريد (Resend)"`.

### 2.3 Factory Resolution & Fallbacks (`mailer.ts`)
- Configured via environment variables:
  - `MAIL_PROVIDER=resend`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
- If keys are missing when `MAIL_PROVIDER=resend` is requested, the system logs a loud error and safely falls back to `noopMailer` (`deliverEmails: false`).
- Public UI branch: Public `/subscribe` page and forms inspect `isEmailDeliveryConfigured()` to display truthful copy:
  - When enabled: «سوف نرسل لك رسالة تأكيد عبر البريد الإلكتروني»
  - When noop: «تم حفظ بريدك في القائمة، دون إرسال رسائل بريدية تلقائية حالياً»

### 2.4 Seam Consolidation
- Stale re-export shim files `apps/web/src/lib/notify/{index,mailer,noop-mailer}.ts` deleted.
- All callers across `apps/web` and `apps/admin` import exclusively from `@church-site/data-access`.

---

## 3. Production Database Integrity (`readOrSeed`)

### 3.1 The Invariant
On a live production deployment, serving mock/seed data during a database outage or misconfiguration is an unacceptable integrity failure (visitors may see fictitious liturgy times or wrong contact details without administrators knowing the DB is unreachable).

### 3.2 Decision Matrix
| `NODE_ENV` | `hasSupabaseEnv()` | DB Outcome | `readOrSeed` Behavior |
| :--- | :--- | :--- | :--- |
| `production` | `true` | Rows returned (`data.length > 0`) | Returns database rows |
| `production` | `true` | PostgREST error | **THROWS Error** (`[data-access] <query>: live query failed...`) |
| `production` | `true` | Empty rows (`data.length === 0`) | **THROWS Error** |
| `production` | `true` | Unexpected Exception | **THROWS Error** |
| `production` | `false` | None (zero-env build) | Returns seed copy (INV-01 offline build) |
| `test` / `development` | `true` / `false` | Error or empty rows | Returns seed copy with warning in log |

---

## 4. Deeper Audit Trail UX

### 4.1 Actor Filtering
- Interface: `AuditListFilter` updated with `actor?: string`.
- **JSON Driver (`json-driver.ts`)**: Filters entries case-insensitively against `entry.actorName` and `entry.actorId`.
- **Supabase Driver (`supabase-driver.ts`)**: Applies SQL query filters:
  - If actor string matches UUID format: `.or("actor_id.eq.<id>,actor_name.ilike.%<term>%")`.
  - Otherwise: `.ilike("actor_name", "%<term>%")`.
- **Admin UI (`apps/admin/src/app/(protected)/audit/page.tsx`)**:
  - Filter input bar with search by actor name or ID.
  - Preserves `actor` parameter across entity chips, action chips, and limit pagination.

### 4.2 RFC-4180 CSV Export with UTF-8 BOM
- Function: `exportAuditCsv(entries: readonly AuditLogEntry[]): string` (`packages/data-access/src/events/audit-csv.ts`).
- **UTF-8 BOM (`\uFEFF`)**: Preprended at byte offset 0 so Microsoft Excel on Windows/macOS correctly detects Arabic UTF-8 encoding without mojibake.
- **RFC-4180 Escaping**: Cells containing commas (including Arabic comma `،`), double quotes, or newlines are quoted, and internal quotes are doubled (`""`).
- **Arabic Headers**:
  `وقت التسجيل (بتوقيت القاهرة),المنفذ,الإجراء,الكيان,معرف السجل,الملخص,مرفوض`
- **Columns**:
  1. Formatted Cairo wall-clock date/time (`formatCairoDateTime`).
  2. Actor name (fallback to actor ID, fallback to "غير محدد").
  3. Action label in Arabic.
  4. Entity type label in Arabic.
  5. Entity ID.
  6. Arabic summary.
  7. Refusal status: `"نعم"` (for denied attempts) / `"لا"` (for normal mutations).
- **Access Endpoints**:
  - Route Handler: `GET /api/audit/export` returning `text/csv; charset=utf-8` with `Content-Disposition: attachment; filename="audit-log-YYYY-MM-DD.csv"`.
  - Server Action: `exportAuditCsvAction(filter)` in `apps/admin/src/actions/audit-actions.ts`.
  - Security: Gated behind `requireStaff()` and `can(role, "audit:read")` / `can(role, "event:read")`.
