# ADR-0005: Managed Supabase Backups and Off-App Runbook (Zero In-App Cron)

- **Status**: Accepted
- **Date**: 2026-09-18
- **Deciders**: Parish Priest / Owner, Lead Architect, Senior Engineering Lead
- **Invariants**: **Zero In-App Cron / Zero New Dependencies**, **Fail-Closed Production Integrity**, **Infrastructure-Level Decoupling**

---

## 1. Context & Problem Statement

The parish database contains crucial records: liturgical schedules, clergy biographies, parish announcements, sacramental booking calendars, content entries, and tamper-resistant audit logs. Reliable disaster recovery and backup policies are mandatory.

Initial proposals considered embedding automated cron jobs inside the Next.js portal application (e.g. using `node-cron` or background timers inside server processes to execute periodic SQL exports and upload them to S3).

This in-app cron approach was evaluated and rejected:
1. **Serverless & Edge Incompatibility**: `apps/web` and `apps/admin` run in serverless / ephemeral environments (Vercel / Node.js container instances). Ephemeral runtimes spin down on idle; long-running daemon timers are unreliable, leak memory, or get killed prematurely.
2. **Blast Radius & Security**: Granting the public/admin web server full dump/restore privileges increases the attack surface and couples operational database maintenance to application code.
3. **Dependency Bloat**: Running cron in-app violates the core invariant of zero dependency churn and bloats the production bundle.

---

## 2. Decision: Two Official Infrastructure Paths

The parish adopts two decoupled, infrastructure-level backup paths with **zero in-app cron or dependencies**:

### Path A: Managed Cloud Backups (Supabase Paid / Pro Plan — Recommended)
- **Mechanism**: Managed physical and logical automated backups managed natively by Supabase infrastructure.
- **Features**:
  - Daily automatic snapshots retained up to 7 or 30 days.
  - Point-in-time recovery (PITR) down to the second.
  - Zero performance impact on the parish portal.
- **Operational Requirement**: Enabled directly via the Supabase project dashboard (`Project Settings -> Database -> Backups`).

### Path B: Off-App CLI Dump Runbook (Supabase Free Plan / Local Archival)
- **Mechanism**: External backups executed using the official Supabase CLI (`supabase db dump`) or scheduled GitHub Actions workflows running entirely outside the web application runtime.
- **Features**:
  - Encrypted logical dump (`schema` and `data`).
  - Stored in off-site secure storage (e.g. encrypted parish Google Drive or private repository artifacts).
  - Fully decoupled from Vercel / Next.js web instances.

---

## 3. Restore & Disaster Recovery Drill

A step-by-step restore drill is formalized in `docs/backup-restore.md` and `docs/runbook.md`:
1. **Schema Integrity**: Migrations `0001` through `0014` are strictly immutable and version-controlled in `supabase/migrations/`.
2. **Rehydration**:
   ```bash
   # Dump schema and data from source
   supabase db dump --data-only -f parish_backup_$(date +%Y%m%d).sql
   
   # Restore to clean staging / target instance
   supabase db push
   psql "$SUPABASE_DB_URL" < parish_backup_$(date +%Y%m%d).sql
   ```
3. **Verification**: Run `pnpm test` and verify public read projections.

---

## 4. Consequences & Benefits

- **Zero App Code Overhead**: Application bundle remains lightweight, static-first, and pure.
- **High Reliability**: Backups are guaranteed by Postgres WAL / Supabase infrastructure rather than fragile web timers.
- **Transparent Maintenance**: Parish administrators follow standard, battle-tested database administration runbooks.
