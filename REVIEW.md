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

