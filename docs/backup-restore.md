# Backup & Restore / النسخ الاحتياطي والاستعادة

Two drivers, two procedures. **The file-store procedure in §1 was executed and verified in this
repository on 2026-09-16 — the full command output is pasted below.** The Supabase procedure in §2 is
written from the documented commands and has **not** been run against a live project in this
environment (no database is reachable here); §3 says exactly what is and is not proven.

| Driver | Selected when | What to back up |
| :--- | :--- | :--- |
| `json` (file) | `NEXT_PUBLIC_SUPABASE_URL` **or** `SUPABASE_SERVICE_ROLE_KEY` is missing | the single document `church-store.json` |
| `supabase` | both of those are present | the PostgreSQL database |

Both drivers hold the same content: events, recurring series, per-occurrence exceptions, taxonomy
terms, term links, media metadata, subscribers and the audit trail. Restoring either one restores all
of it.

---

## 1. File store (driver `json`)

### 1.1 Where the data is

- Default: `<repo>/.data/church-store.json`
- Or `$CHURCH_DATA_DIR/church-store.json` when that variable is set
  (`CHURCH_DATA_DIR=/var/lib/church-store` → `/var/lib/church-store/church-store.json`)
- `.data/` is gitignored, so it is never committed and never travels with a `git push` or a deploy.

Confirm the exact path from the running app instead of guessing:

```bash
# the path is printed on every start (and on the first store access)
#   [store] repository driver selected { driver: 'json', dataDir: 'C:\\Church-Site\\.data' }
ls -l .data/
# expected: exactly one file, church-store.json (no *.tmp leftovers: writes are atomic)
```

### 1.2 Back up

```bash
cd <repo>
mkdir -p .backups
cp .data/church-store.json ".backups/church-store.$(date +%Y%m%d-%H%M%S).json"
sha256sum .data/church-store.json .backups/church-store.*.json
```

The two hashes must be identical — that is the whole verification of a `cp`.

Stop the application first (or accept that a write in flight is lost): a copy taken while a mutation
is being renamed into place is either the old or the new document, never a half-written one, but it
can still be one mutation behind.

### 1.3 Restore

```bash
cd <repo>
# 1. stop the application (no writer may run during the copy)
# 2. copy the chosen backup over the live document
cp .backups/church-store.20260916-170657.json .data/church-store.json
# 3. confirm the bytes match the backup
sha256sum .data/church-store.json .backups/church-store.20260916-170657.json
# 4. start the application and clear the caches through the admin
```

Step 4 matters: after a restore, press «مسح ذاكرة الموقع المؤقتة» on `/admin/events` (or simply load
the public pages — they are revalidated by tag), so no cached page keeps serving pre-restore content.

### 1.4 Verification (the step that makes a restore trustworthy)

**For an operator, without any tooling** — the store is one JSON file, so a hash plus a look at the
public pages is enough:

```bash
# 1. the restored file is byte-identical to the backup
sha256sum .data/church-store.json .backups/church-store.<stamp>.json

# 2. the JSON is valid and carries the expected counts
node -e "const d=require('./.data/church-store.json');console.log({schemaVersion:d.schemaVersion,events:d.events.length,series:d.series.length,terms:d.terms.length,subscribers:d.subscribers.length,audit:d.audit.length})"

# 3. the running site renders them (start it, then compare a couple of pages against what you saw
#    just before the backup: the events list, the calendar, one event detail page)
curl -s -o /dev/null -w "%{http_code} /events\n" http://localhost:3000/events
```

**For a repeat of the full test** (what §1.5 did): a scratch harness read the feed the public pages
render (`getEventFeed()` over the current list window) and printed the store hash and document counts,
so "before backup" and "after restore" could be compared field by field. That harness was
**temporary and has been deleted** (`.scratch/` is gitignored and is not part of the deliverable); the
commands it ran are:

```bash
# baseline
node --experimental-strip-types --import <scratch>/register.mjs <scratch>/verify.mts check
# (it resolves the app's `@/` alias and stubs `next/headers`, then imports src/lib/store + src/lib/events/feed)

# after restoring: the SAME command — the output must be identical
node --experimental-strip-types --import <scratch>/register.mjs <scratch>/verify.mts check
```

Recreate it only if you want the full comparison; the operator-level check above proves the same two
facts (identical bytes, and pages that render the restored content).

### 1.5 Tested evidence — 2026-09-16 (Windows, Node v22.22.0, driver `json`)

The sequence actually executed: baseline → `cp` backup → mutate through the real repository (publish an
event, subscribe the same address twice, record a would-send notification, stop the subscription) →
restore with `cp` → re-check. Output as printed:

```
=========== STEP 1: BASELINE (public state) ===========
[store] repository driver selected { driver: 'json', dataDir: 'C:\\Church-Site\\.data' }
--- PUBLIC STATE (check) ---
store file : C:\Church-Site\.data\church-store.json
sha256     : 230ca458dc486f5ef0dde4c0848c445bcf8ce52f2657c95e4f43095411aef1df
document   : {"schemaVersion":2,"events":2,"series":16,"terms":37,"subscribers":0,"audit":0}
public     : {"publicItems":84,"markerVisible":false}
subscribers: []
exit=0

=========== STEP 2: BACK UP (file store) ===========
total 36
-rw-r--r-- 1 KimoStore 197121 33729 Sep 16 17:06 church-store.20260916-170657.json
230ca458dc486f5ef0dde4c0848c445bcf8ce52f2657c95e4f43095411aef1df *.data/church-store.json
230ca458dc486f5ef0dde4c0848c445bcf8ce52f2657c95e4f43095411aef1df *.backups/church-store.20260916-170657.json

=========== STEP 3: MUTATE (through the repository) ===========
--- BEFORE MUTATION ---
store file : C:\Church-Site\.data\church-store.json
sha256     : 230ca458dc486f5ef0dde4c0848c445bcf8ce52f2657c95e4f43095411aef1df
document   : {"schemaVersion":2,"events":2,"series":16,"terms":37,"subscribers":0,"audit":0}
public     : {"publicItems":84,"markerVisible":false}
created+published event: 99f77a8b-0999-41b5-bbd5-d8660e2c2267 event-933f7ed1
subscribe #1 created: true | stored email: verify.backup@example.com
subscribe #2 created: false | stored email: verify.backup@example.com
same row: true
[notify] would-send — NO EMAIL IS SENT (no mail provider configured) {
  to: 'verify.backup@example.com', kind: 'subscription-welcome',
  subject: 'Your parish events subscription', locale: 'en' }
[notify] subscription stored, NO e-mail sent {
  subscriberId: 'bd7962b6-cbef-4655-a513-0a16d51f6bb4', provider: 'noop', notificationLogged: true }
notification: {"provider":"noop","delivered":false,"notificationLogged":true}
deactivated: true
audit (newest first): [{"action":"update","entity":"subscriber"},{"action":"notify","entity":"subscriber"},
                       {"action":"update","entity":"subscriber"},{"action":"create","entity":"subscriber"},
                       {"action":"publish","entity":"event"},{"action":"create","entity":"event"}]
--- AFTER MUTATION ---
sha256     : 43c1d630cabbd67509449b59f8f6497ce06cb89dea5c7300ffa5839346063dd5
document   : {"schemaVersion":2,"events":3,"series":16,"terms":37,"subscribers":1,"audit":6}
public     : {"publicItems":85,"markerVisible":true}
exit=0

=========== STEP 4: RESTORE (copy the backup back over the store) ===========
230ca458dc486f5ef0dde4c0848c445bcf8ce52f2657c95e4f43095411aef1df *.data/church-store.json
230ca458dc486f5ef0dde4c0848c445bcf8ce52f2657c95e4f43095411aef1df *.backups/church-store.20260916-170657.json

=========== STEP 5: VERIFY RESTORED PUBLIC STATE ===========
[store] upgraded the file-backed store document { path: 'C:\\Church-Site\\.data\\church-store.json', from: 1, to: 2 }
--- PUBLIC STATE (check) ---
store file : C:\Church-Site\.data\church-store.json
sha256     : 230ca458dc486f5ef0dde4c0848c445bcf8ce52f2657c95e4f43095411aef1df
document   : {"schemaVersion":2,"events":2,"series":16,"terms":37,"subscribers":0,"audit":0}
public     : {"publicItems":84,"markerVisible":false}
subscribers: []
verify_exit=0

=========== STEP 6: BASELINE HASH COMPARISON ===========
baseline sha256: 230ca458dc486f5ef0dde4c0848c445bcf8ce52f2657c95e4f43095411aef1df
restored sha256: 230ca458dc486f5ef0dde4c0848c445bcf8ce52f2657c95e4f43095411aef1df
RESULT: byte-identical to the backup ✓
```

**The same cycle was also verified end-to-end through the running build** (`pnpm run build` then
`pnpm run start` on port 3111), so the "public state" claim is not only a repository-level claim:

```
=== 1) /events WITHOUT the marker (baseline) ===
0                                  # occurrences of the temporary event title
=== 3) MUTATE again ===            # published event + subscriber, through the repository
sha256     : 3e6b886a50c64e9a9686a21877551e0126c3184a16c590ae85b32452522f6c8a
document   : {"schemaVersion":2,"events":3,"series":16,"terms":37,"subscribers":1,"audit":6}
public     : {"publicItems":85,"markerVisible":true}
=== 4) /events WITH the marker (served by the running build) ===
1                                  # the event created through the repository IS rendered
=== 5) RESTORE ===
230ca458dc486f5ef0dde4c0848c445bcf8ce52f2657c95e4f43095411aef1df *.data/church-store.json
=== 6) /events AFTER restore (marker gone again) ===
0                                  # and it is gone from the rendered page
=== 7) store counts after restore ===
document   : {"schemaVersion":2,"events":2,"series":16,"terms":37,"subscribers":0,"audit":0}
public     : {"publicItems":84,"markerVisible":false}
```

What this proves: a `cp` backup restores the store **byte-identically**, and the public pages served by
a running production build return to the baseline (event count, list length, subscriber count and audit
length all back to their pre-mutation values).

What it does not prove: that a restore is safe while the application is **writing** (stop it first), or
anything about the Supabase driver (§2 is untested here).

Baseline values of this repository's file store, for comparison after a future restore:

```
sha256  230ca458dc486f5ef0dde4c0848c445bcf8ce52f2657c95e4f43095411aef1df   (33,729 bytes, schemaVersion 1
                                                                          — upgraded to 2 on read)
document {"events":2,"series":16,"terms":37,"subscribers":0,"audit":0}
public   {"publicItems":84}   # occurrences inside the current list window; this number moves with the date
```

### 1.6 Host-level scheduled backups (File store VPS only)

When running on a self-hosted Linux VPS, host-level scheduling (outside the application process) can be used:

```bash
# host crontab (outside Node process) daily at 02:15, keep 30 days
15 2 * * * cd /srv/church-site && mkdir -p .backups && \
  cp .data/church-store.json ".backups/church-store.$(date +\%Y\%m\%d).json" && \
  find .backups -name 'church-store.*.json' -mtime +30 -delete
```

Store the copies somewhere that is not the same disk (e.g. off-site encrypted storage). Because a write replaces the whole file atomically, a copy is always a complete, parseable document.

---

## 2. Supabase (driver `supabase`) — Two Official Paths (ADR-0005)

**ARCHITECTURAL INVARIANT (ADR-0005):** There is ZERO in-app cron code or dependencies. Running backup daemons inside Next.js serverless runtimes is prohibited. Backups are strictly decoupled from application processes.

### Path A: Managed Automated Backups (Supabase Paid / Pro Plan — Recommended)
- **Zero-Maintenance**: Managed entirely by Supabase infrastructure.
- **Daily Snapshots**: Automated daily backups retained up to 7 to 30 days.
- **Point-In-Time Recovery (PITR)**: Enables rolling back database state to any specific second in the past.
- **Enablement**: Navigate to Supabase Dashboard → **Project Settings → Database → Backups** and toggle PITR.

### Path B: Off-App CLI Dump Runbook (Supabase Free Plan / Local Archival)
When operating on the free tier without managed PITR, the parish administrator runs external dumps off-app via the Supabase CLI or scheduled GitHub Actions.

> **Status: not executed in this environment.** There is no reachable database here, so these commands
> come from the documented procedures (`supabase db dump` / `pg_dump` / `psql`) and from
> the schema in `supabase/migrations/` (migrations 0001 through 0014). Run them once on staging and correct anything that differs
> before relying on them.

### 2.1 Get the connection string

Supabase dashboard → **Project Settings → Database → Connection string → URI**. For `pg_dump`/`psql`
use the **session pooler** (port 5432) or the direct connection, and put the password in an environment
variable so it never lands in the shell history:

```bash
export SUPABASE_DB_URL='postgresql://postgres.<project-ref>:<password>@<host>:5432/postgres'
```

### 2.2 Back up

```bash
# schema + data, custom format (compressed, restorable table by table)
pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges \
  -Fc -f "backups/church-site-$(date +%Y%m%d-%H%M%S).dump"

# the data alone, as SQL (readable, greppable — useful as a second copy)
pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges --data-only \
  --schema=public -f "backups/church-site-data-$(date +%Y%m%d-%H%M%S).sql"

ls -l backups/
```

`--no-owner --no-privileges` keeps the dump restorable into a project whose role names differ (a
restore into a *new* Supabase project is a normal drill).

### 2.3 Restore

```bash
# A. full restore into an EMPTY database (the safe, recommended shape)
psql "$SUPABASE_DB_URL" -c 'CREATE SCHEMA IF NOT EXISTS restore_check;'
pg_restore --no-owner --no-privileges --schema=public -d "$SUPABASE_DB_URL" backups/church-site-<stamp>.dump

# B. data-only restore into an already-migrated database
#    (schema first: apply supabase/migrations/ 01 → 11, then load the data)
psql "$SUPABASE_DB_URL" -f backups/church-site-data-<stamp>.sql
```

Restoring into a **new** empty Supabase project is the safest recovery: it leaves the damaged project
untouched until you have verified the copy, and it re-runs the RLS policies from the migrations rather
than trusting the dump's.

### 2.4 Verification after a Supabase restore

```sql
-- row counts (compare against the values recorded when the backup was taken)
SELECT 'events' t, count(*) FROM events
UNION ALL SELECT 'event_series', count(*) FROM event_series
UNION ALL SELECT 'event_exceptions', count(*) FROM event_exceptions
UNION ALL SELECT 'taxonomy_terms', count(*) FROM taxonomy_terms
UNION ALL SELECT 'media', count(*) FROM media
UNION ALL SELECT 'subscribers', count(*) FROM subscribers
UNION ALL SELECT 'audit_log', count(*) FROM audit_log;

-- the most recent mutation instant must match the backup's "last updated"
SELECT max(at) FROM audit_log;

-- the RLS boundary must be intact (a restore that drops policies is a security incident)
SELECT count(*) FROM pg_policies WHERE schemaname = 'public';            -- expected: 56
SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity; -- expected: 29
```

Then check the live site: `/events` shows the right dates, `/admin/events` shows the right driver, and
`/admin/audit` ends at the timestamp you recorded.

---

## 3. What is and is not tested

| Claim | Status |
| :--- | :--- |
| File store: back up by copying `church-store.json` | **TESTED** 2026-09-16 — hashes of source and copy match |
| File store: restore returns the public state to the baseline | **TESTED** 2026-09-16 — byte-identical hash, feed back to 84 items, subscriber and audit counts back to 0 |
| File store: the app serves the restored data without a restart | **TESTED** — `/events` served the mutation and the restored (unmutated) content on the same running build |
| File store: upgrade of a version-1 document on read | **TESTED** — `[store] upgraded the file-backed store document { from: 1, to: 2 }` |
| Supabase: `pg_dump`/`pg_restore` commands as written | **NOT TESTED** (no reachable database). Run once on staging before relying on them. |
| Supabase: restore into a new project, RLS policy counts | **NOT TESTED** — the expected counts (56 policies, 29 tables with RLS, from the eleven migration files) must be confirmed against a real project |
| Restoring while the app is writing | **NOT TESTED** — stop the application first; the file driver's write queue is per process |
