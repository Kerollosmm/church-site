# Runbook — Running the Parish Portal / دليل التشغيل

Operational handbook for the site operator: what to run, in which environment, with which variables,
and how to tell whether the site is healthy.

**Companions**

| Document | What it covers |
| :--- | :--- |
| `docs/release-readiness.md` | the five go-live gates, the env-var table with consumers, post-migration SQL checks, human sign-off list |
| `docs/backup-restore.md` | the exact backup + restore procedure for both store drivers (file backup/restore is **tested**) |
| `docs/rollback.md` | what to do when a release goes wrong |
| `docs/credential-handover.md` | the secrets checklist and rotation guidance |
| `docs/admin-guide.md` | the non-technical guide for the parish office |
| `supabase/README.md` | migration order, first-admin bootstrap, RLS boundary |

---

## 1. Environments

| | Local development | Staging | Production |
| :--- | :--- | :--- | :--- |
| Purpose | authoring, review, screenshots | pre-release verification with real credentials | the public site |
| Store driver | **file** (`json`) | Supabase recommended (same as production) | **Supabase** for multi-writer publishing; the file driver is supported only on a single-instance host with a persistent volume |
| Supabase project | none needed | a separate project (`church-site-staging`) | the parish project |
| Turnstile | real *test* keys or none | test keys | live keys (site key + secret) |
| Variables | usually none at all — the repo builds and runs with an empty environment | the full set from `BACKEND_AND_DATA_SPEC.md` §9.1 | same, with production values |
| Data | `<repo>/.data/church-store.json` (gitignored) | the staging database | the production database — **back it up before every migration** |

There is no third mode: the portal is designed so that **no environment variables at all** is a
supported, working configuration (seeded content, file store), and adding the Supabase pair switches
both the read path and the store driver without a code change.

---

## 2. Requirements

- **Node 20+** with full ICU data (verified on Node **v22.22.0**). The site formats every date and time
  in `Africa/Cairo` through `Intl.DateTimeFormat`, and the recurrence engine builds a formatter per
  IANA zone — a Node build without full ICU data will produce wrong times or throw.
- **pnpm 10** (verified on 10.33.0) and a committed `pnpm-lock.yaml`.
- A writable directory for the file store (only when the Supabase pair is absent).

---

## 3. Environment variables (BACKEND_AND_DATA_SPEC.md §9.1)

| Variable | Required? | What it does | If it is missing |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | for a database-backed deployment | project URL; used by every Supabase client | public reads fall back to the seed, `/admin` fails closed |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for a database-backed deployment | anon key for the public read path (RLS-constrained) | public reads keep using the seed (the store can still be Supabase — see §4) |
| `SUPABASE_SERVICE_ROLE_KEY` | for a database-backed deployment | **server-only**; the public write path (`src/lib/supabase/admin.ts`) | public forms answer "service unavailable"; the store falls back to the file driver |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | production | renders the Turnstile widget in the four public forms | the widget renders nothing; the forms still work (dev only) |
| `TURNSTILE_SECRET_KEY` | production | server-side token verification | **fails closed in production**: every public submission is refused |
| `NEXT_PUBLIC_SITE_URL` | optional | canonical origin for metadata/sitemap | falls back to `http://localhost:3000` |
| `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` | optional | link to the parish broadcast channel | `/live` shows «لم تُضبط قناة البث الرسمية على هذا الموقع بعد» |
| `YOUTUBE_API_KEY` | optional (Phase 2) | automatic broadcast-status polling | no effect today — no code consumes it yet |
| `CHURCH_DATA_DIR` | optional | data directory of the file store | defaults to `<repo>/.data` |
| `EVENTS_SUBSCRIPTIONS_ENABLED` | optional | public "subscribe to updates" feature | **enabled**. Set it to `0`, `false`, `off` or `no` to switch the public form off (the server action refuses and `/subscribe` shows a notice) |
| `MAIL_PROVIDER` | optional | selects the mail implementation | `noop` (default, simulated) or `resend` (Phase 5 real delivery via built-in `fetch`) |
| `RESEND_API_KEY` | required if `MAIL_PROVIDER=resend` | Resend API key (`re_...`) | server-only; missing key falls back to `noop` with loud warning |
| `RESEND_FROM_EMAIL` | required if `MAIL_PROVIDER=resend` | verified sender address (e.g. `alerts@stmaximus.church`) | server-only |

Secrets rule: `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY` are
**server-side only** and must never be prefixed `NEXT_PUBLIC_`. Only the two public Turnstile/Supabase
values, the channel URL and the site URL are readable by the browser.

---

## 4. How the store driver is selected

ONE factory decides where the events data lives (`src/lib/store/index.ts`):

```
NEXT_PUBLIC_SUPABASE_URL  AND  SUPABASE_SERVICE_ROLE_KEY  present   →  driver "supabase"
anything else (including a completely empty environment)            →  driver "json"  (file store)
```

Consequences worth knowing before a deployment:

- The **file store is the default, not a degraded mode**. With no Supabase variables the site serves
  seeded parish content and every admin write lands in `<repo>/.data/church-store.json`.
- The **public read path** (`src/lib/queries.ts`) uses a *different* condition: it needs the URL + the
  **anon** key (`hasSupabaseEnv()`). A deployment that sets URL + service-role but forgets the anon key
  runs the Supabase *store* while the public pages silently serve seed data — the log will show
  `[queries] database read skipped { reason: 'environment_not_configured' }`. Set all three variables
  together.
- The driver and the data location are visible at runtime: sign in to `/admin` and read the republish
  control on `/admin/events` («آخر تعديل على المحتوى» + the driver name), or call `status()` through
  `getStoreStatusAction()`.
- The selection is logged once per process: `[store] repository driver selected { driver, dataDir }`.

---

## 5. Build and run

```bash
pnpm install --frozen-lockfile

# quality gates (all five are expected to exit 0; see docs/release-readiness.md §1)
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build          # MUST be run with NO application env vars set
pnpm audit --prod
```

```bash
# local development
pnpm run dev            # http://localhost:3000

# production-style run (after a build)
pnpm run build
pnpm run start          # honours PORT, default 3000
```

The build is expected to end with `✓ Generating static pages (53/53)` plus the dynamic routes
(`ƒ`) for `/events`, `/events/[slug]`, `/events/[slug]/calendar.ics`, `/subscribe`, `/ministries`,
`/sitemap.xml` and the `/admin` area. A build that suddenly reports far fewer pages usually means a
route became dynamic or failed.

> **The no-env invariant.** `pnpm run build` must succeed with no `NEXT_PUBLIC_*`, `SUPABASE_*`,
> `TURNSTILE_*` or `YOUTUBE_*` variable in the environment. The CI workflow enforces it before the
> build; never "fix" a red build by exporting a variable locally.

---

## 6. Database migrations

Fourteen SQL files in `supabase/migrations/`, named so that lexicographic order = apply order. Nothing in
them seeds data. The apply table, the first-admin bootstrap and the RLS boundary live in
`supabase/README.md`.

```bash
# A. with the Supabase CLI, linked to the target project
supabase link --project-ref <project-ref>
supabase db push                 # applies every pending file in order (01 through 14)

# B. without the CLI: paste the files into the SQL editor in numeric order
#    (Supabase dashboard → SQL Editor → New query → one file at a time, 01 → 14)
```

**Before applying anything to production: take a database backup** (`docs/backup-restore.md` §2) and
read `supabase/README.md`. Applying a file twice is tolerated (guarded `DO` blocks,
`CREATE ... IF NOT EXISTS`, `DROP POLICY IF EXISTS`), but a backup is what makes a bad migration
recoverable.

After applying, run the verification queries in `docs/release-readiness.md` §3 (table/policy/RLS/enum
counts and the constraint names the application matches on).

---

## 7. Publishing and cache revalidation

Two mechanisms, and they are easy to confuse:

**1. `revalidateTag` — the automatic one.** Every successful admin mutation ends with
`revalidateEventSurfaces()` (`src/lib/store/revalidate.ts`), which drops three tags from
`src/lib/tags.ts`:

```
events            event-taxonomy            event-media
```

and then invalidates the public EVENT_SURFACE_PATHS:

```
/                 /events            /events/[slug]            /ministries
```

**2. `revalidatePath` on that path list — the "which page" half.** `/events/[slug]` is listed as the
**dynamic-route pattern**, which is what `revalidatePath(path, "page")` expands over every generated
slug. A new public page that renders events must be added to `EVENT_SURFACE_PATHS`, or its cached copy
will stay stale. Pages that read the store per request are deliberately NOT in the list — an entry for
an uncached route would be a no-op that reads like a guarantee:

- `/admin/**` is `force-dynamic` (the protected layout sets it, and it must: the session check has to
  be re-evaluated per request), so admin screens never show a cached row;
- `/subscribe` reads the vocabulary per request for the same reason (and because the visitor's locale
  comes from a cookie).

**3. The manual republish control.** `/admin/events` carries «مسح ذاكرة الموقع المؤقتة» (the
`RepublishControl` component → `republishEventsAction`). It re-runs the same invalidation on demand and
reports the driver name and «آخر تعديل على المحتوى» (the store's `lastUpdatedAt`). Use it when:

- a page still shows old content after a change you *know* was saved (a CDN or browser cache is the
  usual culprit — check the response headers first);
- content was changed **outside** the admin screens (a hand-edited store file, a `psql` update);
- after restoring a backup, so any cached page is rebuilt from the restored data.

What "real-time" means here, precisely: a change made through the admin is visible on the next request
to the public pages. There is no websocket and no push — the site is server-rendered, and the tags are
what make that fast.

---

## 8. Where the data lives, and how to back it up

| Driver | Data location | Backup |
| :--- | :--- | :--- |
| `json` (file) | `<repo>/.data/church-store.json`, or `$CHURCH_DATA_DIR/church-store.json` | copy the file (§`docs/backup-restore.md` §1) |
| `supabase` | the project's PostgreSQL database | Supabase Managed Backups (PITR + daily automatic backups) or pg_dump / supabase db dump (§`docs/backup-restore.md` §2) |

Notes on the file store:

- `.data/` is **gitignored** (`.gitignore: /.data/`), so it is never committed and never deployed by
  `git push` — it must be copied by hand or mounted.
- Every mutation is **one atomic write** (a temporary file in the same directory, then `rename`), and
  the mutation plus its audit line are in that single document: a crash can never leave a change
  recorded without its audit entry.
- The document carries a `schemaVersion` (currently **4**; Phase 3 added Content Types at version 3, Phase 4 added Parish Videos at version 4). Older schema documents are automatically upgraded in place on read and rewritten at version 4 by subsequent mutations — logged as `[store] upgraded the file-backed store document`. An unsupported future or corrupt version fails loudly instead of being replaced by the seed.
- The write queue is **per process**. Two Node processes sharing one data directory are not
  coordinated: never point two instances at the same `.data/` directory. That is what the Supabase
  driver is for.

---

## 9. E-mail and notifications (Phase 5 Hardening)

The notification system supports two providers configured via `MAIL_PROVIDER`:

1. **`MAIL_PROVIDER=noop` (Default)**:
   - When unset or set to `noop`, no emails are sent.
   - Used for zero-env builds, offline operations, and local development.
   - Logs `[notify] would-send — NO EMAIL IS SENT` and appends an `audit_log` note.
   - Both the public `/subscribe` form and admin screen state plainly that no email is sent.

2. **`MAIL_PROVIDER=resend` (Phase 5 Real Delivery)**:
   - Uses native `fetch` to send transactional email through `https://api.resend.com/emails`.
   - Requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
   - Follows honest delivery semantics: HTTP 2xx logs success with message ID; 4xx/5xx or network drops log a delivery note on the subscriber row without failing the subscription transaction.
   - Public `/subscribe` page displays truthful copy confirming email will be sent.
   - See `docs/email-setup-guide.md` and `docs/phase5-hardening.md` for full instructions.

---

## 10. Health checks

```bash
# 1. the sign-in page and the public surfaces answer
curl -s -o /dev/null -w "%{http_code} /\n"           http://localhost:3000/
curl -s -o /dev/null -w "%{http_code} /events\n"     http://localhost:3000/events
curl -s -o /dev/null -w "%{http_code} /subscribe\n"  http://localhost:3000/subscribe

# 2. the admin area fails CLOSED when there is no session (Admin App on port 3001)
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://localhost:3001/
#    expected: 307 -> /login?reason=session

# 3. the six security headers are present on a static page
curl -sD - -o /dev/null http://localhost:3000/masses | head -20

# 4. the sitemap and robots are generated
curl -s -o /dev/null -w "%{http_code} /sitemap.xml\n" http://localhost:3000/sitemap.xml
curl -s -o /dev/null -w "%{http_code} /robots.txt\n"  http://localhost:3000/robots.txt
```

Server log lines worth watching (all structured, all greppable):

| Line | Meaning |
| :--- | :--- |
| `[store] repository driver selected { driver, dataDir }` | which driver this process resolved to |
| `[store] seeded the file-backed store { path, series, events, terms }` | first use created `.data/church-store.json` |
| `[store] upgraded the file-backed store document { from, to }` | an older document was read and will be rewritten |
| `[queries] database read skipped/failed { query, served: 'seed-data', reason }` | a public read fell back to the seed — **investigate**, this is never silent |
| `[notify] would-send — NO EMAIL IS SENT` | a subscription was stored and nothing was e-mailed |
| `[events] capability denied { capability, role, userId }` | an admin attempted something their role does not allow (also recorded in the audit log) |

Operational content checks (behind the login on `http://localhost:3001` or `admin.<parish-domain>`): `/` shows real counts, `/audit` lists every
mutation, `/events` shows the driver and «آخر تعديل على المحتوى», `/content-types` and `/videos` list dynamic collections.

---

## 11. Common tasks, in one line each

```bash
# apply a code change
pnpm exec tsc --noEmit && pnpm run build && pnpm run start

# move the file store to another disk
CHURCH_DATA_DIR=/var/lib/church-store pnpm run start

# stop the public subscribe feature without a deploy
EVENTS_SUBSCRIPTIONS_ENABLED=0 pnpm run start

# confirm the store was written atomically (no leftover temp files)
ls -la .data/           # only church-store.json
```
