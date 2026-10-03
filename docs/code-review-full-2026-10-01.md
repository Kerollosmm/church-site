# Full-Project Code Review — Final Report

**Date**: 2026-10-01 (review conducted 2026-09-30 → 10-01)
**Tree reviewed**: HEAD `fec46fa` + the large uncommitted working-tree refactor (monorepo deduplication)
**Method**: 4 axes (Standards / Spec / Performance / Bugs) per the `/code-review` skill, axes kept separate; delegated review agents run **one at a time** per owner instruction; every finding cites file:line with quoted evidence; high-severity claims cross-verified (one refutation recorded). Epistemic labels: [PROVEN] = verified live/by direct read.
**Full detail file**: [.scratch/code-review-2026-09-30/findings.md](../.scratch/code-review-2026-09-30/findings.md) (condensed per-finding evidence, agent verdicts, verification log)
**Scope note**: the dedicated Spec pass and the dedicated Performance pass were skipped by owner decision ("Final report now"); both received partial/incidental coverage, noted per axis below.

---

## 1. Executive Summary

The codebase is **structurally healthy and test-green, but carries a set of real security and correctness defects that must be fixed before the next production cycle**. All five quality gates pass live on this exact tree. The authorization spine, the domain layer (recurrence/zone-time), the fail-closed Server Actions for public writes, and 17 of 20 SQL migrations are verified solid. The problems cluster in five places: **(1) stale/bypassable RLS policies that let the public anon key bypass every server-side form control, (2) the two raw-Supabase admin action modules that violate the project's own fail-closed and audit contracts, (3) the home page's older pre-refactor surfaces shipping invented or wrong content, (4) Africa/Cairo timezone discipline leaking in ~8 places, and (5) a `*.supabase.co` wildcard cluster spread across four security layers.** Additionally — operationally — the live production database's content tables are **empty** (the parish's real data lives only in seed files), and the current build artifact bakes seed content into production pages.

**Totals**: 71 recorded findings — Standards 35 (7 HIGH), Bugs 33 (9 HIGH), Lead 3 (1 HIGH), plus 20+ verified-clean proofs and 1 refutation.

---

## 2. Quality Gates — verified LIVE on this exact tree [PROVEN]

| Gate | Command | Result |
| :--- | :--- | :--- |
| Typecheck (strict) | `pnpm typecheck` | **PASS** — 5/5 projects, 0 errors |
| Lint | `pnpm run lint` | **PASS** — 0 errors, 0 warnings |
| Unit/Integration | `pnpm test` (vitest) | **PASS** — **638/638 tests, 56 files** |
| Web production build | `pnpm --filter web build` | **PASS** — 60/60 static pages, exit 0 (First Load JS 102–191 kB/route) |
| Admin production build | `pnpm --filter admin build` | **PASS** — 23 routes, exit 0 |

Tool-level health is excellent. Everything below is what static tools cannot catch.

---

## 3. Lead-verified findings (direct probes, not agents)

**CR-1 · HIGH [PROVEN]** — **Production serves stale SEED content baked at build time; live DB content tables are empty; no error boundaries exist.**
Live anon REST probe: `clergy`, `activities`, `schools_academies`, `church_meetings`, `bible_books`, `news_articles`, `donation_accounts` all return HTTP 200 `[]` (RLS fine — `altars`, `mass_schedules`, `taxonomy_terms` have rows). `readOrSeed` (queries.ts:127-146) correctly throws in production on error/empty — but the build **baked seed content** into `education.html` / `about/clergy.html` via 13-day-old `.next/cache/fetch-cache` entries (stale-on-error), and **apps/web has no `error.tsx` anywhere**: on a fresh deploy against this DB, `/education`, `/about/clergy` render raw 500s.
**Fix**: seed the live DB tables; add root error.tsx + per-route catches; purge `.next/cache` between env modes (or add an env discriminator to cache keys).

**CR-2 · MEDIUM** — `readOrSeed` logs `served: 'seed-data'` even when it actually **throws/refuses** (queries.ts:85,137) — misleading production observability.

**CR-3 · Observation** — `/privacy`, `/gallery`, `/sermons`, `/about`, `/subscribe`, `/ministries` render dynamically (locale cookie) — deliberate per code comments; `/privacy` is the strongest candidate for static `DEFAULT_LOCALE` per Pattern 27.

---

## 4. Findings by Axis

### 4.1 Standards — 35 findings (7 HIGH, 14 MEDIUM, 14 LOW)

Sources: memory-bank/systemPatterns.md (42 patterns), AGENTS.md, CONTEXT.md, DESIGN.md, ADRs 0001–0005 + the Fowler smell baseline. Two agents covered all of apps/web.

**Worst in axis**: the home page **swaps the patron saints of the northern and southern altars** (SanctuaryAltarsShowcase.tsx:32-49 renders البحري = مارجرجس and القبلي = الأنبا موسى الأسود, contradicting CONTEXT.md §2.2, SEED_ALTARS seed-data.ts:22-39 and the site's own /about/history — verified [PROVEN]; the test bakes the swap in), and **fabricated "official" announcements** (LatestNewsCarousel defaultNews + BibleVerseDaily John-3:16 fallback shown when the production readOrSeed throws — muting the §36 operator alarm and inventing content per §32).

Highlights: placeholder emergency phone numbers bereaved families would actually dial (3 files) · hand-built `wa.me/201200000000` for donation receipts · `/media` link on the public gallery that 404s for every visitor · Bible reader showing John 1:1-5 under every selected book's heading · host-timezone date rendering in content templates · content store failures becoming silent 404s (`dynamicParams = false` + silent `catch { return [] }` in generateStaticParams) · education enrollment form losing typed data pre-hydration (no `method="post"`/isMounted) · 3 of 4 public forms missing label/live-region a11y · §40 keyboard/focus deviations in the site-wide header · SEED nav shipped in every JS bundle (client-side fallback) · dead admin residue (StaffSignInSchema, feast-calendar exports) · FOCUS_RING copy-pasted 7×.

### 4.2 Spec — not run (owner decision)

No dedicated PRD/IA/BACKEND conformance pass was run. Partial coverage exists via the Standards axis (CONTEXT.md vocabulary breaches above; pattern-cited deviations). A dedicated pass can be run later using the same one-at-a-time procedure.

### 4.3 Performance — no dedicated pass (owner decision); incidental findings [PROVEN where noted]

- Build evidence: 60/60 static pages, First Load JS 102–191 kB per route, shared chunks 102 kB — healthy baseline.
- **CR-1**: stale-cache seed baking = stale content served indefinitely while ISR revalidation keeps failing (both a correctness and cache-efficiency problem).
- Header "today's Coptic date" frozen up to 24h on `revalidate = 86400` pages (C.3#1) and the countdown card stuck on "بدأ الآن" for the whole liturgy (C.3#2) — ISR staleness handled incorrectly in the two most time-sensitive UI elements.
- 17-item seed navigation array shipped in every visitor's JS bundle via the client-side fallback (C.2#16).
- `search_bible` LIKE-wildcard CPU amplification via direct anon REST calls, bypassing app rate limiting (C.6#9).
- N+1/query-pattern hot paths were **not** systematically swept — recommend the dedicated perf pass before any traffic campaign.

### 4.4 Bugs — 33 findings (9 HIGH, 14 MEDIUM, 10 LOW)

**Worst in axis**: **five anon INSERT RLS policies** (migration 20260916090600:102-129 on condolence_bookings, contact_messages, program_applications, job_applications, clinic_alert_subscriptions) let anyone with the public anon key write directly to the DB, **bypassing Turnstile, zod, rate limits and audit entirely** — combined with `uq_condolence_active_date` this is a **trivial full-condolence-calendar lockout** (loop-insert squats every future date; families get 23505 clashes). This contradicts the repo's own documented intent (20260916091000:10-12: anon must NOT insert; forms go through the service-role action).

The other HIGHs: storage.objects staff policies missing the `is_active` check (deactivated staff keep media-bucket write access indefinitely) · admin mass update/toggle/delete report **success on DB failure or missing rows and write no audit_log at all** (silent data loss + unaudited Divine-Liturgy schedule changes; the modal fabricates the row client-side) · booking approve/reject decisions **untraceable** (no audit) · Supabase driver `deleteTerm` silently diverges from the JSON driver (deletes terms still carried by weekly series → badges/filters vanish) · non-atomic `replaceEventTerms` can wipe an event's taxonomy with **no audit entry** (delete commits, insert throws pre-audit).

---

## 5. Suggested Fix Order (cross-axis, for the owner — not an axis reranking)

### P0 — Security (before/with the next deploy)
1. Drop the 5 anon INSERT policies; add per-identity constraints on condolence inserts (C.6#1, C.6#3).
2. Add `is_active = TRUE` to the three storage.objects policies; revoke auth sessions on deactivation (C.6#2).
3. Ship the full security-header suite on **apps/admin** (CSP, frame-ancestors, nosniff, HSTS) — currently zero (C.6#7).
4. Close the `*.supabase.co` wildcard cluster: images.remotePatterns proxy (C.2#7), connect-src (C.2#13), trusted-embeds gate (C.2#8), asset-resolver (C.5#5), frame-src alignment (C.6#10) — pin to the project's own host everywhere.
5. Media upload: drop/scan `image/svg+xml`, sniff magic bytes, strict MIME allowlist (C.4#5 — stored XSS on the public bucket).
6. Secret scanner: add sk_live_/re_/sb_secret_/AIza rules, match unquoted assignments (C.6#6 — CI hard gate with false confidence today).

### P0 — Correctness / operations
7. Seed the live DB content tables; add root `error.tsx` + per-route catches; purge `.next/cache` between env modes (CR-1).
8. Make admin mass actions fail-closed (select-after-write; errors/catch → failure, never success) + audit every mass mutation (C.4#1, C.4#2); audit booking approve/reject with actor + reason (C.4#3).

### P1 — High-value fixes (next sprint)
Fabricated news/verse defaults → honest tagged states (C.1#1/C.2#1/#14) · altar-patron swap fixed with the parish + test (C.2#2) · placeholder phone numbers / wa.me / `/media` 404 (C.1#2/#3/#4) · Bible reader label (C.1#5) · header Coptic date via Cairo wall clock + short revalidate (C.3#1) · countdown re-arm (C.3#2) · Supabase-driver deleteTerm series check + replaceEventTerms atomicity/audit order (C.5#1/#2) · ICS all-day support (C.5#3) · LocaleSwitcher cookie sync (C.5#4) · host-timezone date rendering in content templates/admin lists (C.1#6, C.4#9) · CSV formula-injection neutralization (C.4#4) · audit_log `actor_id = auth.uid()` constraint (C.6#5) · rate-limit keying last-hop + shared storage (C.3#3) · EventsManager zone-key date filter (C.4#6) · eventDate Cairo wall-clock guard (C.3#5) · rework the pending InitPlan migration before applying (~19 policies untouched; body rewrites ineffective) (C.6#4) · re-encode mojibake literals in queries.ts (C.4#7, C.5#7) · delete/guard `refreshStreamData` (C.2#15/C.3#4) · surface media-link partial failure (C.4#8) · masses table re-sync + concurrent-edit guard (C.4#11) · content store failures are not 404s (C.1#7) · contact RPC fallback condition + fabricated audit id (C.2#18) · cvUrl https-only (C.2#19) · CI zero-env guard covers ADMIN_*/*_PORTAL_URL (C.6#8) · search_bible LIKE escaping (C.6#9).

### P2 — Hygiene
A11y gaps on 3 forms + header keyboard contract (C.1#12, C.2#5) · dedup: content-view helpers, FOCUS_RING, slot/hall defaults (C.1#10, C.2#17) · dead code: StaffSignInSchema, feast-calendar exports (+ its Nativity-fast bound bug), BibleVerseDaily fallback (C.2#10/#11/#14) · derived counts vs hardcoded numbers (C.1#9, C.2#12) · untagged empty states (C.1#13) · robots.ts stale comment (C.1#14) · SEED_* imports in [slug] pages (C.1#15) · honest unknowns (MassesExplorer altar name C.1#16; blanket per-record bullets C.1#17) · seed nav in client bundle (C.2#16) · seed broadcast-tagging of meeting events (C.5#6) · CR-2 log wording · admin content-list timezone + audit-export limit clamp (C.4#9/#10).

---

## 6. Verified Clean / Positive Results [PROVEN] (do not chase)

- Fail-closed holds on **all five public writes**; Turnstile widget reset after **every** submit in all four forms; `rel="noopener noreferrer"` everywhere; effect cleanup verified.
- **recordAuditLog never throws** (audit.ts:84-118) — refutes the "condolence audit fails the booking" scenario (kept as defense-in-depth only).
- Domain layer solid: recurrence **DST wall-clock expansion correct** for Africa/Cairo, zone-time double-pass, subscribers/booking-reference/capabilities, JSON store atomic rename + strict v1→v5 upgrades.
- Migrations: the **3 pending migrations apply cleanly and idempotently**; `handle_new_user` still fires after the EXECUTE revocation; no anon-facing policy calls a staff function; every SECURITY DEFINER function pins `search_path`; `audit_log` has no UPDATE/DELETE; anon cannot upload to the media bucket; index traps avoided; no NEXT_PUBLIC_-prefixed secrets.
- requireStaff coverage complete in apps/admin (pages, actions, both API routes); storage keys have no path traversal; repository-based admin actions throw not_found and append audit; CSV has BOM + RFC-4180 escaping.

## 7. Duplicates / corroborations / refutations recorded

- Fabricated news fallback: found independently by both Standards agents (corroboration).
- `refreshStreamData`, eventDate timezone, header Coptic date: found by multiple agents (corroboration).
- C.2#3 (condolence audit isolation) **refuted** as a visitor-facing bug [PROVEN via audit.ts:84-118] — remains a recommended §42 hardening.

---

*Report by the Lead (System 2) with six delegated review agents (one at a time). Detail file: `.scratch/code-review-2026-09-30/findings.md`.*
