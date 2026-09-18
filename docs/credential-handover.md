# Credential Handover / تسليم المفاتيح والبيانات الحساسة

A checklist for handing the deployment over to the parish (or to a new maintainer): which secrets
exist, where each one is used, how to rotate it, and what breaks while it is being changed.

**Rules that apply to every row of this document**

1. Secrets live in the **host's environment-variable settings** (Vercel → Project → Settings →
   Environment Variables, or the systemd unit / `.env` file of a self-hosted box). They are never
   committed: this repository has no `.env` file, `.gitignore` covers `.env*`, and the CI workflow
   fails if any `SUPABASE_*` / `TURNSTILE_*` / `NEXT_PUBLIC_*` variable is present during a build.
2. Server-only secrets must **never** be prefixed `NEXT_PUBLIC_` — that prefix inlines the value into
   the browser bundle, where every visitor can read it.
3. Hand over the values through a password manager or a sealed message, never e-mail, never a chat
   message, never a screenshot.
4. After handing over, **rotate** — a secret that has been copied between people is a secret with an
   unknown audience.

---

## 1. The checklist

| # | Credential | Where it comes from | Where it is used | Public? | Rotate how often |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | every Supabase client; also selects the store driver | public (it is in the browser bundle) | only if the project moves |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page | the public read path (`src/lib/supabase/public.ts`) — RLS-constrained | public | on suspicion, and annually |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` | same page (**reveal once**) | server only: `src/lib/supabase/admin.ts` → the public write path, and the store driver's public `subscribe()` | **SECRET — server only** | annually, and immediately on any leak or staff departure |
| 4 | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare → Turnstile → your widget | renders the widget in the four public forms | public | with the secret (they are a pair) |
| 5 | `TURNSTILE_SECRET_KEY` | same page | server only: `src/lib/security/turnstile.ts` | **SECRET — server only** | with the site key |
| 6 | `NEXT_PUBLIC_SITE_URL` | you (the parish domain) | canonical URLs / metadata | public | only if the domain changes |
| 7 | `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` | the parish's channel | `/live` link block | public | only if the channel changes |
| 8 | `YOUTUBE_API_KEY` | Google Cloud console | **nothing yet** (Phase 2) — do not create it until the polling feature exists | secret if it ever exists | n/a |
| 9 | Supabase database password (and `SUPABASE_DB_URL`) | Supabase → Database → Connection string | `pg_dump`/`pg_restore` (`docs/backup-restore.md`) — **not** used by the application | **SECRET — operator only** | quarterly, and on any operator change |
| 10 | Host account (Vercel / server SSH) | the host | deployments, env vars | **SECRET** | on any maintainer change; enable 2FA |
| 11 | Supabase account / project ownership | the parish's e-mail | the database and Auth | **SECRET** | transfer ownership to a parish-controlled address |
| 12 | `MAIL_PROVIDER` | deployment config | selects active mailer implementation (`resend` or `noop`) | operational switch | only when changing providers |
| 13 | `RESEND_API_KEY` | Resend → API Keys | authenticates transactional email via built-in `fetch` | **SECRET — server only** | on suspicion or operator change |
| 14 | `RESEND_FROM_EMAIL` | Resend → Domains | verified sender address (e.g. `alerts@stmaximus.church`) | server-side config | when sender address changes |

### Also hand over (not secrets, but you cannot run the site without them)

- The **first-admin bootstrap step**: `UPDATE profiles SET role = 'admin' WHERE id = '<uuid>';`
  (`supabase/README.md`). Without it nobody can administer anything.
- The **store data**: the Supabase backup, or `.data/church-store.json` for a file-store deployment.
- The **backup schedule** and where the copies live (`docs/backup-restore.md` §1.6).

---

## 2. Where each credential is read in the code

Knowing the consumer is what tells you the blast radius of a rotation:

| Variable | Read by | Consumer |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/env.ts` → `getSupabaseUrl()` | all three Supabase clients, and `hasSupabaseAdminEnv()` (driver selection) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/env.ts` → `getSupabaseAnonKey()` | `src/lib/supabase/public.ts` (public reads), `hasSupabaseEnv()` (admin session) |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/env.ts` → `getSupabaseServiceRoleKey()` | `src/lib/supabase/admin.ts` only — the public write path and the store's public `subscribe()` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | read **literally** in `src/components/security/TurnstileWidget.tsx` (so Next inlines it into the browser bundle) and via `getTurnstileSiteKey()` for the "is the token mandatory" rule | the widget |
| `TURNSTILE_SECRET_KEY` | `src/lib/security/turnstile.ts` | server-side verification of every public form |
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` | `src/lib/env.ts` | metadata + `/live` |
| `CHURCH_DATA_DIR`, `EVENTS_SUBSCRIPTIONS_ENABLED`, `MAIL_PROVIDER` | read directly at call time (`src/lib/store/json-store.ts`, `src/lib/env.ts`, `src/lib/notify/mailer.ts`) | operational switches — **not secrets**; see `docs/runbook.md` §3 |

A useful property of this codebase: **nothing reads the environment at import time**. Every value is
read at call time, so a wrong variable surfaces as a specific error or a logged fallback line rather
than a crash at startup — which is also why the whole site still builds and runs with an empty
environment.

---

## 3. Rotation, one credential at a time

The pattern is always: **create/rotate → update the host's variables → redeploy → verify → revoke the
old value**.

### 3.1 Supabase service-role key (the powerful one)

```bash
# 1. Supabase → Project Settings → API → "service_role" → Rotate/Reveal, copy the new key
# 2. update the host variable SUPABASE_SERVICE_ROLE_KEY and redeploy  (this is the only step that
#    assumes a deployment host; locally the value lives in your shell or is simply absent)
# 3. verify: submit ONE public form (e.g. /subscribe) and confirm a row appears; if it answers
#    "service unavailable", the new key is wrong or the deployment did not pick it up
# 4. the old key is invalid the moment it is rotated
```

Impact while rotating: for the seconds between the rotate and the redeploy, public **writes** fail
closed (the site keeps serving; nothing is silently lost). Admin sign-in is unaffected — it uses the
anon key plus the user's session.

### 3.2 Supabase anon key

Same flow with `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Impact: public reads fall back to the seeded dataset
(the log prints `[queries] database read skipped …`) until the redeploy lands — the site stays up. The
anon key is public by design; rotating it is a cleanliness measure, not an emergency action.

### 3.3 Turnstile pair (site key + secret)

```bash
# 1. Cloudflare → Turnstile → your widget → "Rotate" (or add a new widget and keep the old one live
#    during the change)
# 2. update NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY together, redeploy
# 3. verify in a browser: load /contact, confirm the widget renders and one submission succeeds
```

Impact: a **mismatched pair** (new site key, old secret) makes every public submission fail
verification — the site looks fine and silently rejects visitors. Always change both in one deploy and
submit one form afterwards. If TURNSTILE is rotated to "no widget" in production (secret removed
entirely), the code fails closed and refuses every submission: that is intentional, not a bug.

### 3.4 Database password

Rotate in Supabase → Database → Reset password, then update wherever `SUPABASE_DB_URL` is used (the
backup scripts and your own terminal). The application does **not** use this password — it connects
through the API keys — so the site is unaffected.

### 3.5 Host account / project ownership

Enable 2FA, move the account to a parish-controlled e-mail, and grant the new maintainer access with
the least role that lets them deploy. Record who holds it in the parish office — not in this
repository.

### 3.6 Resend transactional email & domain verification

When using real email delivery (`MAIL_PROVIDER=resend`):
1. **Account setup**: Create account at [resend.com](https://resend.com) with a parish-controlled email.
2. **Domain verification**: In Resend Dashboard → **Domains** → **Add Domain** (e.g. `stmaximus.church`).
3. **DNS configuration**: Configure the following records at your DNS registrar:
   - **DKIM**: TXT record named `resend._domainkey` with value provided by Resend.
   - **SPF**: TXT record on root or subdomain with `v=spf1 include:resend.com ~all`.
   - **MX**: MX record pointing to `feedback-smtp.resend.com` (priority 10) for bounce tracking.
4. **API Key**: Generate a restricted or full-access API Key in Resend → **API Keys** (`re_...`).
5. **Environment variables**:
   - `MAIL_PROVIDER=resend`
   - `RESEND_API_KEY=re_...`
   - `RESEND_FROM_EMAIL=alerts@stmaximus.church` (must match verified domain).

### 3.7 Supabase CLI owner login & linking

To run off-app database dumps or apply schema migrations via the Supabase CLI:
1. **Login**: In terminal, run:
   ```bash
   supabase login
   ```
   Follow the browser prompt to generate a Personal Access Token (PAT).
2. **Link project**:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
3. **Test connectivity**:
   ```bash
   supabase db dump --data-only -f test_dump.sql
   ```
   Confirm the file is populated and remove it.

---

## 4. After the handover: a five-minute verification

```bash
# 1. the site answers and the admin fails closed without a session
curl -s -o /dev/null -w "%{http_code} /\n"      https://<domain>/
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" https://<domain>/admin

# 2. the database is actually the source of truth (not the seed fallback)
#    → sign in to /admin and read the driver name on /admin/events ("آخر تعديل على المحتوى" line)
#    → the server log must NOT contain "[queries] database read skipped"

# 3. one public write works end to end
#    → /subscribe with a real address: the confirmation appears and the row shows in /admin/subscribers

# 4. the audit trail is written
#    → /admin/audit shows the newest entries with the acting staff member's name
```

Anything that fails here is a credential problem, not a code problem: check the variable name
character by character (the commonest failure is a `SUPABASE_SERVICE_ROLE_KEY` pasted with a trailing
space, or a server-only secret given a `NEXT_PUBLIC_` prefix by mistake).
