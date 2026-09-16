# Release Readiness — Go-Live Gates / قائمة الجاهزية للنشر

One page for whoever deploys the portal: the exact commands that must pass, the environment
variables that must exist, the database steps that must be applied, and the checks that only a
human can sign off.

Companions: `BACKEND_AND_DATA_SPEC.md` §9 (operational security + go-live checklist) and
`supabase/README.md` (migration order, first-admin bootstrap, RLS boundary).

---

## 1. Automated gates

Run from the repository root, in this order. All five are expected to exit **0**.

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit          # type-check
pnpm run lint                   # eslint .
pnpm run build                  # MUST run with no application env vars set
pnpm audit --prod               # production dependency audit
```

| # | Gate | Command | Pass condition | Last verified |
| :-: | :--- | :--- | :--- | :--- |
| 1 | Type-check | `pnpm exec tsc --noEmit` | exit 0, no output | 2026-09-16 — exit 0 |
| 2 | Lint | `pnpm run lint` | exit 0, 0 errors / 0 warnings | 2026-09-16 — exit 0, 0/0 |
| 3 | Build (no env) | `pnpm run build` | exit 0, `✓ Generating static pages (52/52)` + 4 dynamic `/admin` routes | 2026-09-16 — exit 0, 52/52 |
| 4 | Audit | `pnpm audit --prod` | `No known vulnerabilities found` | 2026-09-16 — exit 0 |
| 5 | CI | `.github/workflows/ci.yml` | green on the release commit | not yet run on GitHub |

### The no-env build invariant

The portal is static-first and **must** build and serve with an empty environment: the query layer
(`src/lib/queries.ts`) falls back to the seeded dataset and logs a structured line per query
(`[queries] database read skipped { query, served: 'seed-data', reason: 'environment_not_configured' }`).
Gate 3 is therefore only meaningful when no application variable is present. Guard — the same check
the CI workflow runs before the build:

```bash
unexpected=()
for name in $(compgen -e); do
  case "$name" in NEXT_PUBLIC_*|SUPABASE_*|TURNSTILE_*|YOUTUBE_*) unexpected+=("$name") ;; esac
done
[ ${#unexpected[@]} -eq 0 ] && echo "OK: no application env vars" || { echo "LEAK: ${unexpected[*]}"; exit 1; }
```

Do not deploy by relaxing this. A build that quietly succeeds only because a variable was present
hides a broken seed fallback.

---

## 2. Environment variables (BACKEND §9.1)

| Variable | Needed for | Consumed by | If missing |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `src/lib/env.ts` → all three clients | public reads fall back to seed data; writes and `/admin` fail closed |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (RLS-constrained) | `src/lib/env.ts` | same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only write path | `src/lib/supabase/admin.ts` | every public form returns a "service unavailable" message |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | renders the Turnstile widget | `src/components/security/TurnstileWidget.tsx` (literal `process.env` reference, inlined into the browser bundle) | forms render without the widget — acceptable in dev, **not** in production |
| `TURNSTILE_SECRET_KEY` | server-side token verification | `src/lib/security/turnstile.ts` | **FAIL CLOSED in production**: every public submission is rejected |
| `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` *(optional)* | link to the parish channel | `src/lib/env.ts` → `/live` | `/live` shows «لم تُضبط قناة البث الرسمية على هذا الموقع بعد» |
| `NEXT_PUBLIC_SITE_URL` | canonical URL / sitemap | **not consumed by any code yet** | no effect today — see §5 |
| `YOUTUBE_API_KEY` *(optional, Phase 2)* | automatic broadcast-status polling | **not consumed by any code yet** | no effect today |

Secrets: `SUPABASE_SERVICE_ROLE_KEY` and `TURNSTILE_SECRET_KEY` are server-side only and must never
be prefixed with `NEXT_PUBLIC_`. The only client-side variables are the two `NEXT_PUBLIC_` Turnstile
and Supabase values plus the optional channel URL.

---

## 3. Database

Apply the seven migrations in lexicographic (= apply) order, then run the manual bootstrap. Full
rationale and the apply table live in `supabase/README.md`.

```bash
# via the Supabase CLI, against the release project
supabase db push          # or paste the files into the SQL editor in numeric order
```

Mandatory manual step — there is no other path to a first admin:

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<uuid-of-first-admin>';
```

### Post-apply verification (all counts expected exactly)

```sql
SELECT count(*) FROM pg_tables    WHERE schemaname = 'public';                                  -- 21
SELECT count(*) FROM pg_policies  WHERE schemaname = 'public';                                  -- 40
SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity;                     -- 21
SELECT count(*) FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'public' AND t.typtype = 'e';                                          -- 9 enums

-- constraint / index names the application matches on (errors are translated by name)
SELECT conname FROM pg_constraint WHERE conname = 'condolence_bookings_booking_reference_code_key';
SELECT indexname FROM pg_indexes   WHERE indexname = 'uq_condolence_active_date';
```

Then verify the public read/write paths end to end on the live project:

1. an anonymous `INSERT` into `condolence_bookings` returns a row with a `COND-` reference;
2. `SELECT * FROM track_condolence_booking('<that-reference>')` works **as `anon`** (the RPC is the
   only public read path for bookings — there is no public `SELECT` policy on the table);
3. a second booking on the same calendar day is rejected by `uq_condolence_active_date`;
4. a `secretary` session can approve/reject from `/admin/bookings` (proves `is_staff()` is wired);
5. editing a seeded row makes the corresponding public page change after the tag is revalidated.

---

## 4. Manual checks — human sign-off required

The seeded dataset is a faithful *structure* with representative *values*. These cannot be verified
by any command; they need the parish.

| Item | Where it lives | What is there today |
| :--- | :--- | :--- |
| Bank accounts, IBAN, SWIFT, account titles | `SEED_DONATION_ACCOUNTS` (3 rows) | representative values (`NBEGEGCXXXX` is not a valid BIC; IBAN check digits unverified) |
| Parish / clergy phone numbers | `SEED_CLERGY` (`03-5551234`, `01220000001`…); the condolence-office number `01200000001` and the clinics reception `03-5500002` are hard-coded in `src/app/condolence/{page,track/page}.tsx`, `src/app/contact/page.tsx` and `src/app/clinics/page.tsx` | placeholders — note the same number is duplicated across three files, so change all of them together |
| WhatsApp group links | 14 rows (`chat.whatsapp.com/sample-*`) in `SEED_CHURCH_MEETINGS` and `SEED_ACTIVITIES` | placeholders — the shared `ContactLinks` block renders them as-is |
| Clergy names and titles | `SEED_CLERGY` | draft names — pastoral/administrative approval needed |
| Weekly mass schedule (times, altars, celebrants) | `SEED_MASS_SCHEDULES` | draft — every seeded mass runs in the morning (05:30–08:30), so the «مسائي» filter shows its empty state until evening masses are added |
| Consultation fee (`30`–`35` EGP) | `src/lib/constants.ts` | confirm the current charitable fee |
| Turnstile keys | deployment env | real site key **and** secret key; then submit one real booking end to end |
| Official broadcast channel | `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` | unset — no channel approved yet |
| Bible text | `bible_books` / `bible_verses` | canon only (73 books); verse text not loaded, the reader's excerpt is a fixed sample |
| CSP behaviour in a real browser | `next.config.ts` | verified from build output and served headers only, never in a browser |

---

## 5. Known gaps at go-live (accepted, none block the build)

- **Admin screens not implemented**: contact messages, programme enrolments, job applications,
  alert bar, stream scheduling, mass-schedule editing. The dashboard lists them explicitly as
  «وحدات إدارية لم تُنفَّذ بعد»; `/admin/masses` and `/admin/clinics` are read-only.
- **`NEXT_PUBLIC_SITE_URL` is unused** and `src/app/sitemap.ts` / `src/app/robots.ts` do not exist,
  so §9.3 item 7 (generated sitemap/robots + Search Console) is **not** met yet.
- **`submitClinicInquiry` has no form**: the action is hardened (rate limit + Turnstile + fail
  closed) but nothing mounts it — `/clinics` is a printed directory.
- **`refreshStreamData`** (`src/actions/stream-actions.ts`) has no caller yet; the revalidation tag
  registry entry `stream` is still used by the query layer, so the tag itself is not orphaned.
- **`pnpm.overrides.postcss` is temporary**: `next@15.5.25` pins `postcss@8.4.31`, which carried the
  four audit findings. Remove the override only after `next` itself pins a patched postcss.
- **CI has never run on GitHub**: workflow YAML and the environment guard were verified locally only.

---

## 6. Re-verification after any change

```bash
rm -rf .next
pnpm exec tsc --noEmit && pnpm run lint && pnpm run build && pnpm audit --prod
```

Then re-check the two artefacts that encode security policy, because a missed regeneration silently
ships the old policy:

```bash
# six security headers on the catch-all route (HSTS, CSP, Permissions-Policy, X-Frame-Options,
# X-Content-Type-Options, Referrer-Policy) and an empty images.remotePatterns
node -e "const m=require('./.next/routes-manifest.json');console.log(m.headers);console.log(m.images)"
```

```bash
# the served headers really reach static pages
pnpm run start &   # then, after it is up
curl -sD - -o /dev/null http://localhost:3000/masses | head -20
```
