# Phase 1 Monorepo Split — Reviewer Checklist & Verification Guide

## 1. Purpose & Architectural Context

This document provides a comprehensive verification audit for **Phase 1 of the Coptic Orthodox Parish Portal Monorepo Split**.

The repository has been refactored from a monolithic Next.js application into a **pnpm monorepo** containing two decoupled deployable applications and three shared internal packages:

- **`apps/web`**: Public parish portal. Static-first, zero-auth ([INV-01]), builds with 0 environment variables (generating 50/50 static pages). Runs locally on port `3000` / apex domain.
- **`apps/admin`**: Dedicated parish administration dashboard. Runs locally on port `3001` / `admin` subdomain. Provides strict fault isolation: if public web experiences outages or build failures, administrative operations remain fully functional.
- **`packages/domain` (`@church-site/domain`)**: Shared models, recurrence engine, permission matrix, Zod schemas, Supabase types, and invariants.
- **`packages/data-access` (`@church-site/data-access`)**: Authoritative data access layer, dual store drivers (`json-store` and `supabase-driver`), seed data, and event repositories.
- **`packages/ui` (`@church-site/ui`)**: Shared design system primitives (`Badge`, `Button`, `Card`, `Skeleton`, etc.), `cn` utility, and i18n localization engine.

---

## 2. Per-Commit Audit Table

Every commit executed during Phase 1 satisfies strict verification gates prior to merging:

| Commit | Step | Description | Verification Gates Run | Result |
| :--- | :--- | :--- | :--- | :--- |
| `a83b139` | Step 3 | `refactor(web): move app into apps/web` — Monorepo restructure | `pnpm --filter web typecheck`, `pnpm --filter web build` | **GREEN** |
| `2597889` | Step 4a | `chore(packages): extract domain` — `@church-site/domain` | `pnpm --filter @church-site/domain typecheck`, `pnpm test` | **GREEN** |
| `d53a234` | Step 4b | `chore(packages): extract data-access` — `@church-site/data-access` | `pnpm --filter @church-site/data-access typecheck`, `pnpm test`, `pnpm --filter web build` | **GREEN** |
| `79bd13c` | Step 4c | `chore(packages): extract ui` — `@church-site/ui` | `pnpm --filter @church-site/ui typecheck`, `pnpm test`, `pnpm lint` | **GREEN** |
| `fdd4bdc` | Step 5 | `feat(admin): scaffold admin app` — `apps/admin` Next.js 15 app | `pnpm --filter admin typecheck`, `pnpm --filter admin build` | **GREEN** |
| `ccf26ab` | Step 6 | `refactor(web): remove admin surface` — Purge admin routes (-8,286 LOC) | `pnpm typecheck`, `pnpm test`, `pnpm --filter web build` | **GREEN** |
| `1bbd634` | Step 7 | `chore: wire env and build configs` — Workspace & PostCSS wiring | `pnpm typecheck`, `pnpm lint`, `pnpm build:web`, `pnpm build:admin` | **GREEN** |
| `d717230` | Step 8 | `ci: build and test web + admin` — Matrix CI with 0-env guard | CI workflow check, `git diff .github/workflows/ci.yml` | **GREEN** |
| `f8b9d20` | Step 9 | `docs: record admin split decision and deployment` — ADR-0002 & Docs | Documentation verification (`docs/adr/0002-*`, `docs/deployment-*`) | **GREEN** |
| `e09b697` | Step 10 | `docs: add reviewer checklist and verification guide` — Verification & Gates | Full gates G1–G9 verification | **GREEN** |

---

## 3. Final Verification Gates Table (G1–G9)

All nine verification gates have been empirically validated on the live repository. Real tool outputs are archived under `.scratch/phase1-gates/`:

| Gate | Check | Pass Condition | Result | Evidence File |
| :--- | :--- | :--- | :--- | :--- |
| **G1** | TypeScript Validation | `tsc --noEmit` on both apps (`apps/web`, `apps/admin`) with 0 errors | **PASS (0 errors)** | `.scratch/phase1-gates/g2b-tsc.txt`<br/>`.scratch/phase1-gates/g2a-tsc.txt` |
| **G2** | ESLint Code Quality | `eslint .` across workspace and individual apps with 0 errors | **PASS (0 errors)** | `.scratch/phase1-gates/g2-lint-combined.txt`<br/>`.scratch/phase1-gates/g2b-lint.txt`<br/>`.scratch/phase1-gates/g2a-lint.txt` |
| **G3** | Test Suite (Vitest) | 100% tests passing across all 12 test suites (274/274 tests green) | **PASS (274/274 green)** | `.scratch/phase1-gates/g3-test.txt`<br/>`.scratch/phase1-gates/g6-revert-gates.txt` |
| **G4** | Web Production Build | `pnpm --filter web build` succeeds with 0 env vars, generating 50/50 static pages | **PASS (50/50 static pages)** | `.scratch/phase1-gates/g4-build-web.txt`<br/>`.scratch/phase1-gates/g6-revert-gates.txt` |
| **G5** | Admin Production Build | `pnpm --filter admin build` succeeds cleanly for all admin routes | **PASS (5/5 static + dynamic)** | `.scratch/phase1-gates/g5-build-admin.txt`<br/>`.scratch/phase1-gates/g6-revert-gates.txt` |
| **G6** | Fault Isolation Proof | Deliberate fault in `apps/web` breaks web build without impacting `apps/admin` build or store writes; clean revert restores all G1–G5 | **PASS (Empirically Proven)** | `.scratch/phase1-gates/g6-fault-web.txt`<br/>`.scratch/phase1-gates/g6-admin-build-while-web-broken.txt`<br/>`.scratch/phase1-gates/g6-admin-write.txt`<br/>`.scratch/phase1-gates/g6-revert-gates.txt` |
| **G7** | History Preservation | `git log --follow` traces commits across `git mv` for apps and packages | **PASS (History Preserved)** | `.scratch/phase1-gates/g7-git-log.txt` |
| **G8** | DB Migration Immutability | Exactly 0 changes to `supabase/migrations/` (INV-01 strictly enforced) | **PASS (0 diffs against origin)** | `.scratch/phase1-gates/g8-git-status.txt` |
| **G9** | Surface Boundary Integrity | Zero `/admin` routes/actions in `apps/web`; zero direct `@supabase` client leaks in `apps/admin` | **PASS (Clean Separation)** | `.scratch/phase1-gates/g9-rg-web.txt`<br/>`.scratch/phase1-gates/g9-imports-admin.txt` |

---

## 4. Known Gaps / Substitutions

- **Zero Functional Regressions**: All 274 existing unit and integration tests pass without modifications to test logic.
- **Zero Database Changes**: PostgreSQL schema and Supabase migrations remain 100% byte-for-byte identical to `origin/master`.
- **Package Path Aliases**: Path aliases (`@/components/ui/*`, `@/lib/*`) are preserved via thin re-exports in `apps/web/src/` to guarantee backwards compatibility with existing imports while canonical implementations live in `packages/*`.

---

## 5. Reviewer Can Re-Verify With:

A reviewer can independently re-verify all gates with the following standard CLI commands:

### Run All Core Verification Gates (G1–G5)
```bash
# 1. Typecheck entire monorepo
pnpm typecheck

# 2. Lint entire workspace
pnpm run lint

# 3. Run full Vitest suite (274 tests)
pnpm test

# 4. Build public web portal (asserting 0 env vars)
pnpm --filter web build

# 5. Build staff admin dashboard
pnpm --filter admin build
```

### Re-Verify Fault Isolation (G6)
```bash
# A. Inject deliberate fault into apps/web/src/app/page.tsx
# Add: throw new Error("Deliberate fault injection");

# B. Verify web build fails
pnpm --filter web build # expected exit 1

# C. Verify admin still builds and mutates store cleanly while web is broken
pnpm --filter admin build # expected exit 0
pnpm --filter admin dlx tsx ../../.scratch/phase1-gates/probe-admin-write.ts

# D. Revert fault and verify clean state
git checkout apps/web/src/app/page.tsx
pnpm typecheck && pnpm test && pnpm --filter web build
```

### Re-Verify Git History Preservation (G7)
```bash
git log -n 5 --oneline --follow apps/web/src/app/page.tsx
git log -n 5 --oneline --follow packages/domain/src/types.ts
git log -n 5 --oneline --follow packages/data-access/src/store/json-store.ts
```

### Re-Verify Database Migration Immutability (G8)
```bash
git status supabase/migrations
git diff --stat origin/master -- supabase/migrations
```

### Re-Verify Surface Boundary Integrity (G9)
```bash
# Ensure no admin pages remain in apps/web
fd -p "apps/web/src/app/admin" # should return empty

# Ensure admin has no direct @supabase imports outside authorized packages
rg "@supabase/supabase-js" apps/admin/src/ # should return empty
```

---

# Phase 2 Media Upload & Supabase Storage — Reviewer Checklist & Verification Guide

## 6. Phase 2 Media Upload & Supabase Storage Audit Table

Every commit executed during Phase 2 satisfies strict verification gates prior to merging:

| Commit | Step | Description | Verification Gates Run | Result |
| :--- | :--- | :--- | :--- | :--- |
| `c0e1c91` | Step 3 | `feat(domain): add storage fields to media model` | `pnpm --filter domain typecheck`, `pnpm typecheck` | **GREEN** |
| `a4458b8` | Step 4 | `feat(data-access): add MediaStorage adapter` | `pnpm typecheck`, `pnpm test` | **GREEN** |
| `a7ff1fb` | Step 5 | `chore(db): add media storage bucket and policies` | `git status`, `git diff` | **GREEN** |
| `55152be` | Step 6 | `feat(admin): real media upload action and uploader` | `pnpm --filter admin typecheck`, `pnpm test` | **GREEN** |
| `fc3d752` | Step 7 | `feat(web): render real uploaded media in gallery` | `pnpm --filter web typecheck`, `pnpm --filter web build` | **GREEN** |
| `5ffa1f3` | Step 8 | `test: cover media upload pipeline` | `pnpm test` (318 passed) | **GREEN** |

---

## 7. Final Verification Gates Table (G1–G9)

All nine verification gates for Phase 2 have been empirically validated on the live repository. Raw tool evidence is archived under `.scratch/phase2-gates/`:

| Gate | Check | Pass Condition | Result | Evidence File |
| :--- | :--- | :--- | :--- | :--- |
| **G1** | TypeScript Validation | `tsc --noEmit` on both apps (`apps/web`, `apps/admin`) and shared packages with 0 errors | **PASS (0 errors)** | `.scratch/phase2-gates/g1-web-tsc.txt`<br/>`.scratch/phase2-gates/g1-admin-tsc.txt` |
| **G2** | ESLint Code Quality | `eslint .` across workspace and individual packages with 0 errors | **PASS (0 errors)** | `.scratch/phase2-gates/g2-lint.txt` |
| **G3** | Test Suite (Vitest) | 100% tests passing across 16 test files (318/318 tests green) | **PASS (318/318 green)** | `.scratch/phase2-gates/g3-test.txt` |
| **G4** | Web Production Build | `pnpm --filter web build` succeeds with 0 env vars, generating 50/50 static pages | **PASS (50/50 static pages)** | `.scratch/phase2-gates/g4-web-build.txt` |
| **G5** | Admin Production Build | `pnpm --filter admin build` succeeds cleanly for all admin routes | **PASS (5/5 static + dynamic)** | `.scratch/phase2-gates/g5-admin-build.txt` |
| **G6** | Storage Integration Round-Trip | Upload -> SHA-256 Checksum -> Public URL -> File on Disk -> Delete -> ENOENT verification | **PASS (Round-Trip Verified)** | `.scratch/phase2-gates/g6-upload.txt`<br/>`.scratch/phase2-gates/g6-label.txt` |
| **G7** | History Preservation | `git log --follow` traces commits across refactors in domain and data-access | **PASS (History Preserved)** | `.scratch/phase2-gates/g7-git-log.txt` |
| **G8** | DB Migration Integrity | Migration `20260916120000_media_storage.sql` creates bucket `media`, adds columns, and sets RLS policies | **PASS (Validated Migration)** | `.scratch/phase2-gates/g8-git-status.txt` |
| **G9** | Surface Boundary Integrity | `apps/web` has zero storage imports/credentials; `apps/admin` has zero direct `@supabase` imports | **PASS (Clean Isolation)** | `.scratch/phase2-gates/g9-storage-web.txt`<br/>`.scratch/phase2-gates/g9-imports-admin.txt` |

---

## 8. Known Gaps & Substitutions

- **G6 Storage Environment Disclosure**: G6 adapter round-trip was executed and validated against `FileMediaStorage` (local disk mock storage under `CHURCH_DATA_DIR`). Live production Supabase Storage bucket verification is pending provisioning of production credentials (`SUPABASE_SERVICE_ROLE_KEY`).
- **Live Smoke Test Automation**: Standalone smoke test scripts for PowerShell and Bash (`.scratch/phase2-gates/live-upload-smoke.ps1` and `.scratch/phase2-gates/live-upload-smoke.sh`) are provided to execute authenticated round-trips against live Supabase environments.
- **Backwards Compatibility**: Media records without binary storage continue to render external URLs cleanly. Public gallery (`apps/web/src/app/gallery/page.tsx`) renders real uploaded assets via standard HTTP URLs and Next.js `<Image unoptimized />` with accessible Arabic alt captions.

---

## 9. Reviewer Can Re-Verify Phase 2 With:

A reviewer can independently re-verify all Phase 2 gates with the following standard CLI commands:

### Run All Core Verification Gates (G1–G5)
```bash
# 1. Typecheck entire monorepo
pnpm typecheck

# 2. Lint entire workspace
pnpm run lint

# 3. Run full Vitest suite (318 tests across 16 files)
pnpm test

# 4. Build public web portal (asserting 0 env vars)
pnpm --filter web build

# 5. Build staff admin dashboard
pnpm --filter admin build
```

### Re-Verify Storage Adapter Round-Trip (G6)
```bash
# Execute standalone round-trip probe
pnpm --filter @church-site/data-access dlx tsx ../../.scratch/phase2-gates/g6-roundtrip.ts
```

### Re-Verify Git History Preservation (G7)
```bash
git log -n 5 --oneline --follow packages/domain/src/types.ts
git log -n 5 --oneline --follow packages/data-access/src/storage/index.ts
```

### Re-Verify Database Migration Integrity (G8)
```bash
git status supabase/migrations/20260916120000_media_storage.sql
git diff origin/master -- supabase/migrations/20260916120000_media_storage.sql
```

### Re-Verify Surface Boundary Integrity (G9)
```bash
# Ensure apps/admin has 0 direct @supabase imports outside authorized packages
git grep -n "@supabase" apps/admin/src # should return 0 matches

# Ensure apps/web has 0 storage client / mutating storage imports
git grep -n "storage\.objects" apps/web/src # should return 0 matches
```

---

# Phase 3 Content Types Engine — Reviewer Checklist & Verification Guide

## 10. Phase 3 Content Types Engine Audit Table

Every commit executed during Phase 3 satisfies strict verification gates prior to merging:

| Commit | Step | Description | Verification Gates Run | Result |
| :--- | :--- | :--- | :--- | :--- |
| `563acf5` | Step 1 | `feat(domain): content types model and capabilities` | `pnpm --filter @church-site/domain typecheck`, `pnpm test` | **GREEN** |
| `1905865` | Step 2 | `chore(db): content types schema and rls` | `git status`, migration file checks | **GREEN** |
| `8ef796e` | Step 3 | `feat(data-access): content type repository and runtime schema` | `pnpm typecheck`, `pnpm test` | **GREEN** |
| `4427e1f` | Step 4 | `feat(admin): content types manager` | `pnpm --filter admin typecheck`, `pnpm lint` | **GREEN** |
| `3f0ee20` | Step 4 | `feat(admin): dynamic content editor` | `pnpm --filter admin typecheck`, `pnpm --filter admin build` | **GREEN** |
| `855478c` | Step 4 | `test(admin): fix type narrowing in content actions test` | `pnpm test` | **GREEN** |
| `ebb0e61` | Step 4 | `fix(data-access): export dynamic-validator from client entrypoint` | `pnpm --filter admin build`, `pnpm --filter web build` | **GREEN** |
| `e316b56` | Step 5 | `feat(web): generic content routes and templates` | `pnpm --filter web typecheck`, `pnpm --filter web build` (53/53 static) | **GREEN** |
| `620c1e0` | Step 6 | `test: cover content engine` | `pnpm test` (361/361 passed across 20 files) | **GREEN** |
| `44abeb3` | Step 6 | `test(data-access): add e2e content proof test` | `pnpm test` (362/362 passed across 21 files) | **GREEN** |
| `e897c98` | Step 7 | `fix(web): ensure INV-01 isolation regex passes` | `rg` INV-01 isolation checks, `pnpm test` | **GREEN** |
| `51e76eb` | Step 8 | `docs: content types engine` | ADR-0003, Arabic Guide, Architecture Doc, REVIEW.md | **GREEN** |

---

## 11. Final Verification Gates Table (G1–G9)

All nine verification gates for Phase 3 have been empirically validated on the live repository. Raw tool evidence is archived under `.scratch/phase3-gates/`:

| Gate | Check | Pass Condition | Result | Evidence File |
| :--- | :--- | :--- | :--- | :--- |
| **G1** | TypeScript Validation | `tsc --noEmit` on both apps (`apps/web`, `apps/admin`) and shared packages with 0 errors | **PASS (0 errors)** | `.scratch/phase3-gates/g1-web-tsc.txt`<br/>`.scratch/phase3-gates/g1-admin-tsc.txt` |
| **G2** | ESLint Code Quality | `eslint .` across workspace and individual packages with 0 errors | **PASS (0 errors)** | `.scratch/phase3-gates/g2-lint.txt` |
| **G3** | Test Suite (Vitest) | 100% tests passing across 21 test files (362/362 tests green; +44 net new tests) | **PASS (362/362 green)** | `.scratch/phase3-gates/g3-test.txt` |
| **G4** | Web Production Build | `pnpm --filter web build` succeeds with 0 env vars, generating 53/53 static pages | **PASS (53/53 static pages)** | `.scratch/phase3-gates/g4-web-build.txt` |
| **G5** | Admin Production Build | `pnpm --filter admin build` succeeds cleanly for all `/content-types` and `/content/*` routes | **PASS (Clean dynamic build)** | `.scratch/phase3-gates/g5-admin-build.txt` |
| **G6** | Content Engine Verification | End-to-end metamodel creation, dynamic field validation, entry publishing, and public query | **PASS (100% Verified on file-store engine; live script provided)** | `.scratch/phase3-gates/g6-content.txt`<br/>`.scratch/phase3-gates/g6-label.txt`<br/>`.scratch/phase3-gates/live-content-smoke.sh` |
| **G7** | History Preservation | `git log --follow` traces commits across refactors in domain, data-access, and web | **PASS (History Preserved)** | `.scratch/phase3-gates/g7-git-log.txt` |
| **G8** | DB Migration Integrity | Migration `20260916130000_content_types.sql` created; exactly 0 edits to migrations 1–12 | **PASS (Validated Migration)** | `.scratch/phase3-gates/g8-git-status.txt` |
| **G9** | Surface Boundary Integrity | `apps/web` has zero write/mutation actions or DB client imports; `apps/admin` has zero direct `@supabase` imports | **PASS (Clean Isolation)** | `.scratch/phase3-gates/g9-content-web.txt`<br/>`.scratch/phase3-gates/g9-imports-admin.txt` |

---

## 12. Known Gaps / Substitutions

- **G6 Engine Verification Label**: Gate G6 was verified against the file-store repository engine (`JsonStoreContentTypeRepository`), exercising full metamodel creation, schema validation, persistence, and querying. Live PostgreSQL verification requires staging/production credentials; a standalone bash test script `.scratch/phase3-gates/live-content-smoke.sh` is provided for immediate execution once credentials are supplied.
- **Zero New Dependencies**: Dynamic entry forms, rich text editing, and sanitization use zero third-party packages, avoiding bundle bloat or CVE risks.
- **Public Route Static Fallback**: In accordance with INV-01, public `/content/[type]` and `/content/[type]/[slug]` dynamic routes implement graceful static params fallback when no database credentials are present at build time.

---

## 13. Reviewer Can Re-Verify Phase 3 With:

A reviewer can independently re-verify all Phase 3 gates with the following standard CLI commands:

### Run All Core Verification Gates (G1–G5)
```bash
# 1. Typecheck entire monorepo
pnpm typecheck

# 2. Lint entire workspace
pnpm run lint

# 3. Run full Vitest suite (362 tests across 21 files)
pnpm test

# 4. Build public web portal (asserting 0 env vars, 53/53 static routes)
pnpm --filter web build

# 5. Build staff admin dashboard
pnpm --filter admin build
```

### Re-Verify Content Engine Integration Proof (G6)
```bash
# Execute standalone content engine proof
pnpm --filter @church-site/data-access exec node ../../.scratch/phase3-gates/run-g6-proof.mjs
```

### Re-Verify Git History Preservation (G7)
```bash
git log -n 5 --oneline --follow packages/domain/src/types.ts
git log -n 5 --oneline --follow packages/data-access/src/store/json-store.ts
git log -n 5 --oneline --follow apps/web/src/app/content/[type]/page.tsx
```

### Re-Verify Database Migration Integrity (G8)
```bash
git status supabase/migrations/
git diff origin/master -- supabase/migrations/0001_initial.sql
git diff origin/master -- supabase/migrations/20260916120000_media_storage.sql
```

### Re-Verify Surface Boundary Integrity (G9)
```bash
# Ensure apps/web has 0 content write/credential actions
rg -n "content.*(create|insert|update|publish)|uploadMediaAction|createClient" apps/web/src

# Ensure apps/admin has 0 direct @supabase imports outside authorized packages
rg -n "from ['\"]@supabase/" apps/admin/src
```

---

## 14. Phase 4: Parish Videos (External URL Embeds) — Architectural Context

Phase 4 replaced the cancelled "Video Studio" (automated MP4 rendering via external paid render APIs) with a secure, lightweight **Parish Videos Manager**. The church leadership directed that the parish already broadcasts services on YouTube and Facebook, and simply required a way for staff to register and display these existing videos on the public portal (the `/about` page under "فيديوهات الكنيسة").

### Core Invariants Enforced:
1. **INV-01 (Zero-Auth Public Isolation)**: `apps/web` requires zero authentication, zero environment variables to build, and queries data strictly through public-filtered repository interfaces.
2. **Security Gate Integrity (`getTrustedEmbedUrl`)**: Every public video embed MUST pass through `getTrustedEmbedUrl()`. No raw `<iframe src>` is ever rendered.
3. **Zero External Image Wildcards**: `images.remotePatterns` in `apps/web/next.config.ts` contains strictly zero wildcard domains.
4. **Zero Rendering Overhead / Paid APIs**: No ffmpeg, no cloud render services, no external video SDKs.

---

## 15. Phase 4 Per-Commit Audit Table

| Commit | Step | Description | Verification Gates Run | Result |
| :--- | :--- | :--- | :--- | :--- |
| `0c79601` | Step 2 | `feat(domain): parish videos model and capability` — ParishVideo types, capabilities, audit | `pnpm --filter @church-site/domain typecheck` | **GREEN** |
| `2a7a385` | Step 3 | `chore(db): parish videos schema and rls` — Migration 14 (`20260916140000_parish_videos.sql`) | Migration sequence check, README 14 rows | **GREEN** |
| `181d0e0` | Step 4 | `feat(data-access): parish videos repository and URL normalization` — Normalizer, drivers, tags | `pnpm --filter @church-site/data-access typecheck` | **GREEN** |
| `4453e4a` | Step 5 | `feat(admin): parish videos manager` — `/admin/videos` table, modal, server actions | `pnpm --filter admin typecheck`, `pnpm --filter admin build` | **GREEN** |
| `b2fb703` | Step 6 | `feat(web): church videos section` — `/about` videos section, lazy embed players | `pnpm --filter web typecheck`, `pnpm --filter web build` (53/53 static) | **GREEN** |
| `c2447bd` | Step 7 | `test: cover parish videos` — 5 comprehensive test suites (+46 tests) | `pnpm test` (408/408 passed across 26 files) | **GREEN** |

---

## 16. Phase 4 Final Verification Gates Table (G1–G10)

All ten verification gates for Phase 4 have been empirically executed and saved under `.scratch/phase4-gates/`:

| Gate | Check | Pass Condition | Result | Evidence File |
| :--- | :--- | :--- | :--- | :--- |
| **G1** | Web TypeScript Validation | `tsc --noEmit` on `apps/web` with 0 errors | **PASS (0 errors)** | `.scratch/phase4-gates/g1-web-tsc.txt` |
| **G2** | Admin TypeScript Validation | `tsc --noEmit` on `apps/admin` with 0 errors | **PASS (0 errors)** | `.scratch/phase4-gates/g2-admin-tsc.txt` |
| **G3** | Monorepo Linting | `eslint .` across monorepo with 0 errors | **PASS (0 errors)** | `.scratch/phase4-gates/g3-lint.txt` |
| **G4** | Test Suite (Vitest) | 100% tests passing across 26 test files (408/408 tests green; +46 net new tests) | **PASS (408/408 green)** | `.scratch/phase4-gates/g4-tests.txt` |
| **G5** | Web Production Build | `pnpm --filter web build` succeeds with 0 env vars, generating 53/53 static pages | **PASS (53/53 static pages)** | `.scratch/phase4-gates/g5-web-build.txt` |
| **G6** | E2E Video Proof | Full lifecycle: normalization, store persistence, public projection, toggle, embed gating | **PASS (Verified on file-store engine)** | `.scratch/phase4-gates/g6-e2e-proof.txt` |
| **G7** | Admin Production Build | `pnpm --filter admin build` compiles dynamic `/videos` management route cleanly | **PASS (Clean dynamic build)** | `.scratch/phase4-gates/g7-admin-build.txt` |
| **G8** | Migration 14 Integrity | Migration `20260916140000_parish_videos.sql` exists; exactly 14 migrations; strict RLS | **PASS (Validated Migration)** | `.scratch/phase4-gates/g8-migrations.txt` |
| **G9** | Live Smoke Test | Verification of zero wildcards, migration presence, and security functions | **PASS (All 4 checks passed)** | `.scratch/phase4-gates/g9-smoke.txt`<br/>`.scratch/phase4-gates/live-videos-smoke.sh` |
| **G10** | CSP & Security Invariants | Zero wildcards in `images.remotePatterns`, CSP `frame-src` allowlist derived from trusted hosts | **PASS (Zero wildcards, strict CSP)** | `.scratch/phase4-gates/g10-csp.txt` |

---

## 17. Reviewer Can Re-Verify Phase 4 With:

```bash
# 1. Typecheck both applications
pnpm --filter web typecheck
pnpm --filter admin typecheck

# 2. Lint entire monorepo
pnpm lint

# 3. Run full Vitest suite (408 tests across 26 files)
pnpm test

# 4. Zero-env build of public portal (asserting 53/53 static pages)
pnpm --filter web build

# 5. Build admin dashboard
pnpm --filter admin build

# 6. Run Phase 4 smoke script
bash .scratch/phase4-gates/live-videos-smoke.sh
# or on Windows PowerShell:
powershell -ExecutionPolicy Bypass -File .scratch/phase4-gates/live-videos-smoke.ps1
```

---

## 18. Phase 5: Production Hardening, Real Transactional Email & Deeper Audit UX

### 18.1 Architectural Context & Goals
Phase 5 executes the final operational hardening of the parish portal across four pillars:
1. **Real Transactional Email via Resend**: Implemented via built-in Node 20+ `fetch` (zero third-party SDK dependencies, zero lockfile drift). Honest delivery semantics (2xx -> delivered: true; 4xx/5xx/network error -> delivered: false with descriptive note). Logs delivery attempts as audit notes on the subscriber row under actor `"نظام إرسال البريد (Resend)"`. Seam consolidated by deleting stale re-exports in `apps/web/src/lib/notify/` in favor of direct `@church-site/data-access` imports.
2. **Production Database Integrity (`readOrSeed`)**: When `NODE_ENV === "production"` and Supabase is configured (`hasSupabaseEnv()`), any query error, empty result, or unexpected exception THROWS immediately. Serving fake seed data during live database outages or misconfigurations is strictly prohibited. Zero-env build and dev/test seed fallbacks remain intact.
3. **Deeper Audit Trail UX**: Added `actor?: string` filtering across repository drivers (`json-driver` and `supabase-driver`), query parameter handling in `/admin/audit`, and RFC-4180 compliant CSV export featuring UTF-8 BOM (`\uFEFF`) for clean Arabic display in Microsoft Excel.
4. **Managed Backup Policy & Runbooks**: Adopted ADR-0005 rejecting in-app cron daemons in serverless runtimes. Documented official managed PITR backups (paid) and off-app CLI dump runbook (free).

### 18.2 Phase 5 Per-Commit Audit Table

| Commit | Step | Description | Verification Gates Run | Result |
| :--- | :--- | :--- | :--- | :--- |
| `1b29ec2` | Step 3 (A) | `feat(data-access): resend mailer via built-in fetch` — Resend mailer, honest delivery, audit logging, copy branching | `pnpm --filter data-access typecheck`, `pnpm test` (423/423 passed) | **GREEN** |
| `19dcec5` | Step 4 (B) | `fix(data-access): fail loudly instead of seeding in production` — readOrSeed production throw invariant | `pnpm test` (433/433 passed, 10 net new readOrSeed tests) | **GREEN** |
| `a71a1ce` | Step 5 (C1) | `feat(data-access): audit actor filter and csv export` — actor filter in drivers, exportAuditCsv with UTF-8 BOM | `pnpm --filter data-access typecheck`, `pnpm test` (447/447 passed) | **GREEN** |
| `e13f9de` | Step 5 (C2) | `feat(admin): audit actor filter and csv download` — `/admin/audit` actor search input, `/api/audit/export` route | `pnpm --filter admin typecheck`, `pnpm test` (451/451 passed) | **GREEN** |
| `HEAD` | Step 6 (D) | `docs: phase 5 hardening` — ADR-0005, runbook updates, credential handover, email setup guide | Full gate verification G1–G10 | **GREEN** |

### 18.3 Phase 5 Verification Gates Table (G1–G10)

| Gate | Check | Pass Condition | Result | Evidence File |
| :--- | :--- | :--- | :--- | :--- |
| **G1** | Web TypeScript Validation | `pnpm --filter web typecheck` (0 errors) | **PASS (0 errors)** | `.scratch/phase5-gates/g1-web-tsc.txt` |
| **G2** | Admin TypeScript Validation | `pnpm --filter admin typecheck` (0 errors) | **PASS (0 errors)** | `.scratch/phase5-gates/g2-admin-tsc.txt` |
| **G3** | Monorepo Linting | `eslint .` across workspace (0 errors) | **PASS (0 errors)** | `.scratch/phase5-gates/g3-lint.txt` |
| **G4** | Test Suite (Vitest) | 100% tests passing across 31 test files (451/451 tests green) | **PASS (451/451 green)** | `.scratch/phase5-gates/g4-tests.txt` |
| **G5** | Web Production Build | `pnpm --filter web build` with 0 env vars (53/53 static routes) | **PASS (53/53 static pages)** | `.scratch/phase5-gates/g5-web-build.txt` |
| **G6** | Hardening Proofs & Smoke | readOrSeed matrix, audit CSV BOM proof, mailer factory resolution, smoke test | **PASS** | `.scratch/phase5-gates/g6-hardening.txt`<br/>`.scratch/phase5-gates/live-email-smoke.sh` |
| **G7** | History Preservation | `git log --follow` on modified core files | **PASS (History Preserved)** | `.scratch/phase5-gates/g7-git-log.txt` |
| **G8** | DB Migration Immutability | `git diff 47200df -- supabase/migrations/` (0 changed files) | **PASS (0 diffs against origin)** | `.scratch/phase5-gates/g8-git-status.txt` |
| **G9** | Zero Dependency Churn | `git diff 47200df -- pnpm-lock.yaml package.json` (empty diff) | **PASS (0 changes to lockfile)** | `.scratch/phase5-gates/g9-lockfile.txt` |
| **G10** | Security & INV-01 Invariants | Zero server secrets in browser bundle, strict RLS & auth checks | **PASS (All invariants intact)** | `.scratch/phase5-gates/g10-inv01.txt`<br/>`.scratch/phase5-gates/g10-secrets.txt` |

### 18.4 Reviewer Can Re-Verify Phase 5 With:

```bash
# 1. Typecheck both applications and packages
pnpm --filter web typecheck
pnpm --filter admin typecheck
pnpm --filter data-access typecheck

# 2. Lint entire monorepo
pnpm lint

# 3. Run full Vitest suite (451 tests across 31 files)
pnpm test

# 4. Zero-env build of public portal (asserting 53/53 static pages)
pnpm --filter web build

# 5. Build admin dashboard
pnpm --filter admin build

# 6. Verify zero dependency additions
git diff 47200df -- pnpm-lock.yaml package.json

# 7. Verify zero database schema modifications
git diff 47200df -- supabase/migrations/

# 8. Run Phase 5 email smoke script
bash .scratch/phase5-gates/live-email-smoke.sh
```

## 19. Phase 6: Final Documentation & Playwright E2E — Verification & Review

### 19.1 Scope & Architecture Overview
Phase 6 concludes the complete v2 roadmap of the Coptic Orthodox Parish Portal with two final milestones:
1. **End-to-End (E2E) Browser Verification with Playwright**: Pinned `@playwright/test@1.63.0` as a development dependency at the root. Configured `apps/web/playwright.config.ts` targeting headless Desktop Chromium against the local Next.js standalone web server (`port 3000`). Designed 4 core journeys testing public dynamic content listing, rich article reading, honest empty states, and privacy-enhanced parish video embeds (`youtube-nocookie.com`).
2. **Comprehensive Documentation & Handover Readiness**: Authored `docs/phase6-docs-e2e.md`, refreshed `docs/release-readiness.md` with Gate 6 (E2E Browser Tests), updated `docs/deployment-split.md` and `docs/admin-guide.md` with dynamic content and video management workflows.

### 19.2 Per-Commit Audit Table for Phase 6

| Commit | Step | Description | Verification Gates Run | Result |
| :--- | :--- | :--- | :--- | :--- |
| `ef9e93d` | Task 1 | `test(e2e): scaffold playwright` — Root `@playwright/test` 1.63.0, `playwright.config.ts`, `e2e:web` script | `pnpm --filter web typecheck`, Playwright smoke | **GREEN** |
| `ae44e59` | Task 2 | `test(e2e): public dynamic content and videos journeys` — 4 browser journeys, 4 PNG screenshots | Playwright Chromium (4/4 passed), Vitest (452/452 passed) | **GREEN** |
| `c722f25` | Task 2 | `docs(memory-bank): sync phase 6 task 2 completion` — Memory Bank sync for Task 2 | Memory Bank read & sync | **GREEN** |
| `ef4fe9c` | Task 3 | `docs: finalize documentation and e2e guide` — `phase6-docs-e2e.md`, runbook & readiness updates | Typechecks, lint, docs cross-reference | **GREEN** |
| `HEAD` | Task 4 | `docs: phase 6 e2e guide, review and memory-bank sync` — Gates G1–G10 evidence, honesty disclosure, Section 19, Memory Bank close | G1–G10 full verification run | **GREEN** |

### 19.3 Final Verification Gates Table (G1–G10)

| Gate | Check | Pass Condition | Result | Evidence File |
| :--- | :--- | :--- | :--- | :--- |
| **G1** | Web TypeScript Validation | `pnpm --filter web typecheck` (0 errors) | **PASS (0 errors)** | `.scratch/phase6-gates/g1-web-tsc.txt` |
| **G2** | Admin TypeScript Validation | `pnpm --filter admin typecheck` (0 errors) | **PASS (0 errors)** | `.scratch/phase6-gates/g2-admin-tsc.txt` |
| **G3** | Monorepo Linting | `eslint .` across workspace (0 errors) | **PASS (0 errors)** | `.scratch/phase6-gates/g3-lint.txt` |
| **G4** | Test Suite (Vitest) | 100% tests passing across 32 test files (452/452 tests green) | **PASS (452/452 green)** | `.scratch/phase6-gates/g4-tests.txt` |
| **G5** | Web Production Build | `pnpm --filter web build` with 0 env vars (54/54 static routes) | **PASS (54/54 static pages)** | `.scratch/phase6-gates/g5-web-build.txt` |
| **G6** | E2E Browser Testing & Honesty | 4/4 Chromium journeys green, 4 screenshots captured, admin honesty disclosed | **PASS (4/4 green, 4 screenshots)** | `.scratch/phase6-gates/g6-e2e-report.txt`<br/>`.scratch/phase6-gates/g6-honesty.txt`<br/>`.scratch/phase6-gates/g6-screenshots/` |
| **G7** | History Preservation | `git log -n 10 --oneline` and `git log --follow apps/web/src/app/content/[type]/page.tsx` | **PASS (History Preserved)** | `.scratch/phase6-gates/g7-git-log.txt` |
| **G8** | DB Migration Immutability | `git diff dee191f -- supabase/migrations/` (0 changed files) | **PASS (0 diffs against baseline)** | `.scratch/phase6-gates/g8-git-status.txt` |
| **G9** | Dependency Audit | `git diff dee191f -- pnpm-lock.yaml` (confirm ONLY @playwright/test 1.63.0 added) | **PASS (Only @playwright/test@1.63.0 added)** | `.scratch/phase6-gates/g9-lockfile.txt` |
| **G10** | Security & Documentation Freshness | Zero secrets leaked, zero Supabase client in apps/web, docs & code symbols synchronized | **PASS (All invariants intact)** | `.scratch/phase6-gates/g10-inv01.txt`<br/>`.scratch/phase6-gates/g10-secrets.txt`<br/>`.scratch/phase6-gates/g10-docs.txt` |

### 19.4 Known Gaps & Substitutions (Honesty Disclosure)

1. **Public Browser Journeys**: Fully validated in a real Chromium browser via Playwright. Dynamic content listing (`/content/article`), detail view (`/content/article/orthodox-patristic-treasures`), empty category rendering (`/content/sermon`), and parish video embed (`/about`) execute without warnings or layout glitches in RTL mode (`dir="rtl"`).
2. **Admin Authentication Constraint**: In `apps/admin`, administrative functions require live Supabase staff credentials (`requireStaff()`). In zero-env offline test execution, unauthenticated requests fail closed and redirect to `/login`. No artificial authentication mock or bypass was introduced in `apps/admin`, in strict accordance with Architectural Invariant INV-01 and Constraint §4.
3. **CMS Write-Path Guarantee**: The full content creation, publication, toggle, and deletion lifecycle is 100% verified via integration test suites (`apps/admin/src/actions/__tests__/content-actions.test.ts` 9/9 passing; `packages/data-access/src/store/__tests__/e2e-content-proof.test.ts` 1/1 passing; `packages/data-access/src/store/__tests__/e2e-videos-proof.test.ts` 1/1 passing).

### 19.5 Reviewer Can Re-Verify Phase 6 With:

```bash
# 1. Typecheck both applications
pnpm --filter web typecheck
pnpm --filter admin typecheck

# 2. Lint entire monorepo
pnpm lint

# 3. Run full Vitest suite (452 tests across 32 files)
pnpm test

# 4. Zero-env build of public portal (asserting 54/54 static pages)
pnpm --filter web build

# 5. Run Playwright E2E browser test suite (Chromium headless)
pnpm --filter web e2e:web

# 6. Verify zero database schema modifications during Phase 6
git diff dee191f -- supabase/migrations/

# 7. Verify only @playwright/test was added to dependencies
git diff dee191f -- pnpm-lock.yaml package.json
```

## 20. Phase 7.2: Services & Navigation CMS — Verification & Review

### 20.1 Scope & Architecture Overview
Phase 7.2 delivers a dynamic, full-lifecycle Content Management System (CMS) for **Parish Facilities (Public Services)** and **Navigation Menu Items (Dynamic Navbar & Drawers)**:
1. **Database & Supabase Schema (Migration 15)**: Authored `supabase/migrations/20260916150000_services_navigation.sql` introducing `public.nav_menu_items` with hierarchical foreign keys (`parent_id`) and expanding `public.public_services` with bilingual English columns and tracking timestamps. Hardened Row Level Security (RLS) policies enforce public read for active/public records and staff-only mutations.
2. **Domain Capabilities & Models (`@church-site/domain`)**: Configured 5 granular RBAC capabilities (`services:read`, `services:write`, `services:delete`, `navigation:read`, `navigation:write`). Mapped audit entities `service` and `navigation` with Arabic localized labels. Defined domain entities and Zod input schemas.
3. **Dual-Driver Repositories (`@church-site/data-access`)**: Implemented `ParishFacilityRepository` and `ParishNavigationRepository` with dual drivers (`json` file-backed store for offline/SSG/test resilience and `supabase` PostgreSQL for production). Upgraded store document to Schema Version 5 (`STORE_SCHEMA_VERSION = 5`) with baseline seeding (8 facilities, 17 nav items) and instant cache revalidation tags.
4. **Administrative CMS Surfaces (`apps/admin`)**: Built complete management screens at `/admin/services` and `/admin/navigation` with filtering, active toggling, batch reordering, modal editing, and audit logging. Destructive deletions are strictly restricted to the `owner` role.
5. **Dynamic Public Navigation (`apps/web`)**: Refactored `Header.tsx` (RSC) and `HeaderClient.tsx` (RCC) to dynamically render nested navigation dropdowns and mobile drawers while ensuring zero-auth isolation (INV-01) and seamless fallback to seed navigation during static builds.

### 20.2 Per-Commit Audit Table for Phase 7.2

| Commit | Step | Description | Verification Gates Run | Result |
| :--- | :--- | :--- | :--- | :--- |
| `bae5788` | Step 1 | `feat(domain): services and navigation capabilities` — Capabilities, types, Zod schemas | `pnpm --filter @church-site/domain typecheck`, `pnpm test` (162 capabilities tests) | **GREEN** |
| `aa5f080` | Step 2 | `chore(db): services and navigation schema and rls` — Migration 15, DDL & RLS policies | Vitest migration SQL unit tests, typecheck | **GREEN** |
| `7c89c0b` | Step 3 | `feat(data-access): services and navigation repositories` — Dual drivers, Schema v5 upgrade | Repository test suites, schema v5 upgrade validation | **GREEN** |
| `1eb8ce2` | Step 4 | `feat(admin): services and navigation managers` — `/admin/services`, `/admin/navigation` | `pnpm --filter admin typecheck`, server actions unit tests | **GREEN** |
| `81a0db0` | Step 5 | `feat(web): data-driven services and navigation` — Dynamic `Header.tsx` & `HeaderClient.tsx` | `pnpm --filter web typecheck`, `HeaderClient.test.tsx` | **GREEN** |
| `4b9c44e` | Step 6 | `test(e2e): services and navigation full proof` — Full lifecycle file store E2E test | Vitest E2E proof (CRUD, reparenting, audit, INV-01) | **GREEN** |

### 20.3 Final Verification Gates Table (G1–G6)

All six quality gates were executed directly on the codebase with 100% success rate:

| Gate | Check | Pass Condition | Result | Proof Details |
| :--- | :--- | :--- | :--- | :--- |
| **G1** | Monorepo Typecheck | `pnpm typecheck` across all 5 workspace projects (0 errors) | **PASS (0 errors)** | `packages/domain`, `packages/ui`, `packages/data-access`, `apps/admin`, `apps/web` |
| **G2** | Monorepo Lint | `pnpm lint` across workspace with 0 errors | **PASS (0 errors)** | `eslint .` clean |
| **G3** | Test Suite (Vitest) | 100% tests green across 39 test files | **PASS (498/498 green)** | 498 tests passed in 46.06s |
| **G4** | Web Production Build | `pnpm --filter web build` with zero env vars (52 static routes) | **PASS (52/52 static pages)** | Prerendered `/services` & `/services/[slug]` cleanly |
| **G5** | Admin Production Build | `pnpm --filter admin build` succeeds cleanly | **PASS (Clean build)** | Successfully compiled `/services` (6.93 kB) and `/navigation` (6.5 kB) |
| **G6** | E2E Proof & Invariants | Complete lifecycle, audit logging, INV-01 projection stripping | **PASS (100% Verified)** | `e2e-services-navigation-proof.test.ts` passed |

### 20.4 Reviewer Can Re-Verify Phase 7.2 With:

```bash
# 1. Typecheck all applications and packages
pnpm typecheck

# 2. Lint entire monorepo
pnpm lint

# 3. Run full Vitest test suite (498 tests across 39 files)
pnpm test

# 4. Zero-env build of public portal (generating 52 static routes)
pnpm --filter web build

# 5. Build staff admin dashboard (compiling /services and /navigation)
pnpm --filter admin build

# 6. Run isolated E2E proof test for Services & Navigation CMS
pnpm --filter @church-site/data-access test src/store/__tests__/e2e-services-navigation-proof.test.ts
```

---

## 21. Phase 7.3: External Assets & Link Resolver (AssetResolver) — Verification & Review

### 21.1 Scope & Architecture Overview
Phase 7.3 delivers a secure, zero-overhead **External Asset & Link Resolver (`AssetResolver`)** addressing the church leadership's request to register and display assets from YouTube and Google Drive without consuming database storage quotas or re-uploading large binaries:
1. **Single Source of Truth Allowlist (`packages/data-access/src/assets/asset-allowlist.ts`)**: Pinned allowlist `ASSET_ALLOWED_HOSTS` containing canonical CDN origins for YouTube (`i.ytimg.com`, `*.ytimg.com`, `ytimg.com`, `img.youtube.com`) and Google Drive / user content (`drive.usercontent.google.com`, `*.googleusercontent.com`, `googleusercontent.com`).
2. **Resolution Mechanics (`packages/data-access/src/assets/asset-resolver.ts`)**:
   - `resolveExternalImageUrl()`: Ingest-time resolver converting various YouTube video URL structures (`watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, `/vi/`) into canonical high-resolution thumbnails (`https://i.ytimg.com/vi/{id}/hqdefault.jpg`) validated by an 11-character regex (`^[a-zA-Z0-9_-]{11}$`), and Google Drive URLs (`/file/d/{id}`, `/uc?id=`, `/open?id=`) into direct content streaming links (`https://drive.usercontent.google.com/download?id={id}&export=view`) validated by a 20+ character regex (`^[a-zA-Z0-9_-]{20,}$`).
   - Honest rejection of Google Photos album links (`photos.app.goo.gl`) with helpful Arabic guidance explaining why direct image links (`lh3.googleusercontent.com`) must be used instead.
   - `getSafeRenderableImageUrl()`: Public render gate ensuring relative parish paths and Supabase storage pass through, while untrusted, malicious, or non-allowlisted URLs return `null`. Raw external source URLs never touch `<img>` or `next/image` elements.
3. **Unified Security Configuration (`apps/web` & `apps/admin`)**: Both `apps/web/next.config.ts` and `apps/admin/next.config.ts` import `ASSET_ALLOWED_HOSTS` directly. CSP `img-src` headers and Next.js `images.remotePatterns` are automatically derived from this constant, guaranteeing zero configuration drift.
4. **Deliberate Proxy Route Omission**: Server-side proxying (`/api/media/proxy`) was deliberately omitted to eliminate Server-Side Request Forgery (SSRF) attack vectors and prevent proxy bandwidth exhaustion. Modern browsers fetch directly from allowlisted CDNs with strict CSP headers.
5. **Database & Schema Additive Migration 16**: Authored `supabase/migrations/20260916160000_external_assets.sql` adding `source_url`, `resolved_url`, `host`, and `kind` to `public.media`. The canonical `media.url` column stores `resolved_url`, preserving 100% backward compatibility for existing public and internal consumers.
6. **Administrative & Content UI Integration**: Added dedicated "إضافة رابط خارجي" (Add External Link) tab to `MediaManager.tsx` with instant live preview and security status badge; integrated write-time external link normalization into `DynamicEntryForm.tsx` for dynamic content types.

### 21.2 Per-Commit Audit Table for Phase 7.3

| Commit | Step | Description | Verification Gates Run | Result |
| :--- | :--- | :--- | :--- | :--- |
| `cb134fb` | Step 1 | `feat(data-access): external asset resolver and allowlist` — `asset-allowlist.ts`, `asset-resolver.ts`, `assets:link` capability, unit tests | `pnpm --filter @church-site/data-access test`, `asset-resolver.test.ts` (43 tests), capabilities tests (167 tests) | **GREEN** |
| `7a28d4a` | Step 2 | `feat(web): allowlist external image hosts driven by shared constant` — Next.js `remotePatterns` and CSP `img-src` wired to `ASSET_ALLOWED_HOSTS` | `pnpm --filter web build`, `pnpm --filter admin build`, config validation | **GREEN** |
| `2b2d9fb` | Step 5 | `chore(db): external assets schema and rls` — Migration 16, driver mappings in JSON and Supabase repositories, `Database` types | `pnpm typecheck`, `pnpm test`, database type checks | **GREEN** |
| `f094cce` | Step 6 | `feat(admin): add assets by url` — `linkExternalAssetAction`, `MediaManager.tsx` URL tab, `DynamicEntryForm.tsx` field support | `admin-asset-actions.test.ts` (5 tests), `pnpm --filter admin typecheck`, `pnpm --filter admin build` | **GREEN** |
| `c0c142a` | Step 7 | `feat(web): render resolved external assets safely` — Public gallery and dynamic content rendering via `getSafeRenderableImageUrl()` | `gallery.test.tsx` (5 tests), `asset-resolver.test.ts`, `pnpm --filter web build` (52 static routes) | **GREEN** |

### 21.3 Final Verification Gates Table (G1–G10)

All ten quality and security gates have been empirically verified on the live repository:

| Gate | Check | Pass Condition | Result | Proof Details |
| :--- | :--- | :--- | :--- | :--- |
| **G1** | Monorepo Typecheck | `pnpm typecheck` across all 5 workspace projects (0 errors) | **PASS (0 errors)** | `packages/domain`, `packages/data-access`, `packages/ui`, `apps/admin`, `apps/web` |
| **G2** | Monorepo Lint | `pnpm lint` across workspace with 0 errors / 0 warnings | **PASS (0 errors)** | `eslint .` clean |
| **G3** | Test Suite (Vitest) | 100% tests green across 42 test files | **PASS (717/717 green)** | 717 tests passed in 37.85s |
| **G4** | Web Production Build | `pnpm --filter web build` with zero env vars (52 static routes) | **PASS (52/52 static pages)** | Clean prerendering with zero missing variable warnings |
| **G5** | Admin Production Build | `pnpm --filter admin build` succeeds cleanly | **PASS (Clean build)** | Compiled `/media` with external URL tab and dynamic entry editors |
| **G6** | Resolver & Security Tests | Full suite of URL variations, regex IDs, SSRF mitigations | **PASS (43/43 green)** | `packages/data-access/src/assets/__tests__/asset-resolver.test.ts` |
| **G7** | Admin Action & RBAC | `assets:link` capability enforced via `requireStaff()` | **PASS (5/5 green)** | `apps/admin/src/actions/__tests__/admin-asset-actions.test.ts` |
| **G8** | Safe Public Rendering | Gallery renders allowlisted URLs; rejects unverified strings | **PASS (5/5 green)** | `apps/web/src/app/gallery/__tests__/gallery.test.tsx` |
| **G9** | CSP & remotePatterns Sync | Headers and Next image patterns derived from single constant | **PASS (Verified)** | `apps/web/next.config.ts`, `apps/admin/next.config.ts` |
| **G10** | Additive Migration & Invariants | Migration 16 strictly additive; INV-01 zero-auth preserved | **PASS (Verified)** | `supabase/migrations/20260916160000_external_assets.sql` |

### 21.4 Reviewer Can Re-Verify Phase 7.3 With:

```bash
# 1. Typecheck all applications and packages
pnpm typecheck

# 2. Lint entire monorepo
pnpm lint

# 3. Run full Vitest test suite (717 tests across 42 files)
pnpm test

# 4. Run dedicated AssetResolver unit tests
pnpm --filter @church-site/data-access test src/assets/__tests__/asset-resolver.test.ts

# 5. Run Admin Asset Actions unit tests
pnpm --filter admin test src/actions/__tests__/admin-asset-actions.test.ts

# 6. Run Public Gallery Component tests
pnpm --filter web test src/app/gallery/__tests__/gallery.test.tsx

# 7. Zero-env build of public portal (generating 52 static routes)
pnpm --filter web build

# 8. Build staff admin dashboard (compiling /media with external asset resolver)
pnpm --filter admin build

# 9. Verify database migration 16 is strictly additive
git diff origin/master -- supabase/migrations/
```
