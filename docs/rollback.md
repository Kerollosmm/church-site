# Rollback — Recovering from a Failed Release / خطة التراجع

Three independent things can go wrong, and they have three different fixes. Decide which one you have
**before** typing anything: rolling back a code defect when the data is the problem (or the other way
round) turns one incident into two.

| Symptom | Almost certainly | Go to |
| :--- | :--- | :--- |
| The new build errors, or a page that worked is broken, **content still correct** | code defect | §1 or §2 |
| Content is wrong/missing (events vanished, dates changed, a bad import) | data | §3 |
| Sign-in works but a role sees nothing / a table is unreachable | schema or policy | §4 |
| Only one feature misbehaves (e.g. the subscribe form) | could be either | §5 |

**The one rule that outranks everything here:** take a backup *before* you start (`docs/backup-restore.md`).
A rollback that loses the last hour of entries is a second incident.

---

## 1. Roll back the code (git revert) — the default

Preferred when the previous release is known-good and the data is fine. It keeps the history honest:
the bad commit is still there, with the revert in front of it.

```bash
cd <repo>

# 1. what is deployed, and what came before it?
git log --oneline -10
git status                 # must be clean — do not roll back on top of uncommitted work

# 2. revert the release commit (add -m 1 if it was a merge)
git revert --no-edit <release-commit-sha>

# 3. the gates, in order — a rollback that does not build is not a rollback
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm run build

# 4. ship it the same way the original release went out (git push / your host's redeploy)
git push origin main
```

Prefer reverting the **merge/release commit** rather than reversing individual files: a hand-built
"undo" is how unrelated changes get reverted by accident.

## 2. Roll back the deployment (redeploy the previous build)

Preferred when the code is fine but the *deployment* is not (a bad environment variable, a host-side
change), or when you cannot wait for a build. Every mainstream host keeps the previous deployment:

```bash
# Vercel (the assumed host): promote the previous production deployment
vercel ls                       # find the last good deployment URL
vercel promote <deployment-url> # instant, no rebuild

# rollback to a specific earlier deployment instead
vercel rollback <deployment-url>
```

```bash
# Self-hosted: keep the previous build directory and switch a symlink atomically
ls -l /srv/church-site/releases/            # e.g. 2026-09-14T18-02-11, 2026-09-15T09-31-40
ln -sfn /srv/church-site/releases/<previous> /srv/church-site/current
systemctl restart church-site               # or: pm2 restart church-site
```

Decision point: **redeploying is faster and safer than rebuilding** when the previous artefact still
exists. Rebuild only if it does not.

## 3. Roll back the data

See `docs/backup-restore.md` for the full procedure; the decision is which copy to go back to.

- **Supabase**: restore the last good `pg_dump` (§2 there). Prefer restoring into a *new* project and
  repointing the environment variables, so the damaged database is still there to inspect.
- **File store**: stop the app, `cp` the backup over `.data/church-store.json`, start the app (§1
  there). Verified byte-identical on 2026-09-16.

**What a data rollback costs:** every mutation made after the backup is gone — including entries added
by the parish office. Before restoring, list what will be lost so the loss is a decision, not a
surprise:

```sql
-- Supabase: what happened since the backup was taken?
SELECT at, actor_name, action, entity_type, summary
FROM audit_log WHERE at > '<backup-timestamp>' ORDER BY at;
```

```bash
# File store: the same question, answered from the live document
node -e "const d=require('./.data/church-store.json');console.log(d.audit.slice(-20).map(a=>a.at+' '+a.actorName+' '+a.action+' '+a.entityType).join('\n'))"
```

## 4. Roll back a schema change

Migrations are forward-only files; there is no `down` migration in this repository. Two honest options:

1. **Restore the pre-migration backup** (the reason the runbook tells you to back up before applying).
   This is the routine answer and the only one that returns the database to a known state.
2. **Write a compensating migration** as a new numbered file (§e.g. `2026…_revert_x.sql`) and apply it
   in order — appropriate when the change is additive (a new column, a new table) and the data must
   survive. Never edit an applied migration file: another environment may already have run it.

Policy/RLS incidents (a table suddenly readable, a staff member locked out) belong here too: re-check
the boundary with the counts in `docs/release-readiness.md` §3 before and after.

## 5. Roll back a single feature (the safe first move)

Several features can be switched off without a code change, which buys time without a deployment:

| Feature | How to stop it | Effect |
| :--- | :--- | :--- |
| Public event subscriptions | set `EVENTS_SUBSCRIPTIONS_ENABLED=0` and restart | `/subscribe` shows a notice, the server action refuses, `/admin/subscribers` becomes read-only |
| Public forms (contact, condolence, enrolment) | remove `TURNSTILE_SECRET_KEY` in production | **fails closed**: every public submission is refused (may be the opposite of what you want) |
| Broadcast embed on `/live` | clear `stream_url` on the live row in `/admin` | the page shows "بث غير نشط" instead of the frame |
| The whole admin area | nothing to switch — it already fails closed without the Supabase pair | signed-in staff are redirected to `/admin/login?reason=session` |

## 6. After any rollback

1. `pnpm exec tsc --noEmit` and `pnpm run build` must pass on exactly what you deployed.
2. Press «مسح ذاكرة الموقع المؤقتة» on `/admin/events` so no cached page keeps the rolled-back content.
3. Write down what happened, with the commit SHA / backup filename and the times — the audit log already
   holds the data side of it.

---

## 7. What was and was not tested (read this before trusting the commands)

This document was written on 2026-09-16 in a repository checkout with **no deployment host, no
Supabase project and no Git remote**. Precisely:

| Statement | Status |
| :--- | :--- |
| The gates (`pnpm install --frozen-lockfile`, `tsc --noEmit`, `build`) run locally | **TESTED** — all exit 0, build produces 53/53 static pages with no environment |
| `git revert` produces a buildable tree | **NOT TESTED** — no release commit to revert; the command is standard git |
| `vercel promote` / `vercel rollback` / symlink switching | **NOT TESTED** — no host, no CLI session; commands are from the vendors' documented interfaces and must be confirmed on staging |
| The file-store data rollback | **TESTED** — see `docs/backup-restore.md` §1.5 (byte-identical restore, public state back to baseline) |
| The Supabase data rollback | **NOT TESTED** — no reachable database |
| The feature switches in §5 | **`EVENTS_SUBSCRIPTIONS_ENABLED` TESTED** (flag returns `false`, the page renders the disabled state, the action refuses). The Turnstile fail-closed and `/live` behaviours were verified in earlier passes from build output and served HTML, not by submitting a form. |

Anything marked NOT TESTED must be rehearsed once on staging **before** the incident, not during it.
