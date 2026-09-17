# supabase/ — Database schema (SQL migrations)

Versioned PostgreSQL migration files for the parish portal. **Schema only — no seed
rows, no data of any kind.** The files are a faithful encoding of
`BACKEND_AND_DATA_SPEC.md` §2 (roles & profiles), §3 (DDL), §4 (indexes) and §5 (RLS),
with column names/nullability reconciled against `src/types/database.types.ts`, which is
the application's contract.

Target: PostgreSQL 15 on Supabase. The `auth` schema (Supabase Auth) must already exist —
`profiles.id` references `auth.users(id)` and the `on_auth_user_created` trigger is
attached to `auth.users`.

## Apply order

Files are named with a timestamp prefix so that lexicographic order == apply order:

| # | File | Contents |
| :-: | :--- | :--- |
| 1 | `migrations/20260916090000_extensions_and_enums.sql` | `uuid-ossp`, `pg_trgm`, all 9 ENUM types |
| 2 | `migrations/20260916090100_profiles_and_helpers.sql` | `profiles`, `handle_new_user()` + `on_auth_user_created`, `is_staff()`, `is_admin()`, `normalize_arabic()` |
| 3 | `migrations/20260916090200_public_content_tables.sql` | 12 public content tables of §3.2 |
| 4 | `migrations/20260916090300_v11_tables.sql` | 8 v1.1 tables of §3.3 (`bible_verses.text_normalized` generated column) |
| 5 | `migrations/20260916090400_rpc_functions.sql` | `track_condolence_booking()`, `search_bible()` + `GRANT EXECUTE` to `anon, authenticated` |
| 6 | `migrations/20260916090500_indexes.sql` | all 12 indexes of §4, including `uq_condolence_active_date` |
| 7 | `migrations/20260916090600_row_level_security.sql` | `ENABLE ROW LEVEL SECURITY` on all 21 tables + every policy of §5.1–§5.4 |
| 8 | `migrations/20260916090700_events_taxonomy_media_audit.sql` | events layer: 5 ENUMs (`event_status`, `recurrence_freq`, `event_exception_kind`, `taxonomy_dimension`, `audit_action`) + 7 tables (`taxonomy_terms`, `event_series`, `events`, `event_exceptions`, `event_terms`, `media`, `audit_log`) + its indexes |
| 9 | `migrations/20260916090800_events_rls_policies.sql` | RLS on those 7 tables: public read of published/active rows, `is_staff()` for every write, and an append-only `audit_log` (no UPDATE/DELETE policy at all) |
| 10 | `migrations/20260916090900_subscribers.sql` | notification subscribers: `locale_enum`, `subscribers` (`email` UNIQUE, `topics TEXT[]`, `confirmed_at`, `is_active`) + its indexes, and the new `notify` value of `audit_action_enum` |
| 11 | `migrations/20260916091000_subscribers_rls_policies.sql` | RLS on `subscribers`: **no public read and no public insert policy at all** — staff `SELECT`/`UPDATE` through `is_staff()`, and no `DELETE` policy (stopping a subscription is `is_active = FALSE`) |
| 12 | `migrations/20260916120000_media_storage.sql` | media storage: `media` bucket in `storage.buckets`, `storage_path` + `checksum` on `public.media`, RLS on `storage.objects` (public read, staff write for `admin`/`secretary`) |
| 13 | `migrations/20260916130000_content_types.sql` | content types engine: `field_type_enum`, `content_status_enum`, tables `content_types`, `content_fields`, `content_entries`, GIN and composite indexes, RLS policies (public read of active types/fields and published entries; staff read/write for `admin`/`secretary`) |
| 14 | `migrations/20260916140000_parish_videos.sql` | parish videos: `video_provider_enum` (`youtube`, `facebook`, `direct`), `parish_videos` table, `idx_parish_videos_public_active` index, RLS policies (public read of active/public videos; staff read/write for `admin`/`secretary`) |

Applying in any other order fails: types must exist before tables, tables before
indexes/policies, and `normalize_arabic()` before `bible_verses`.

Files 8–11 extend the schema beyond `BACKEND_AND_DATA_SPEC.md`: they carry the data layer of the
events/taxonomy/i18n feature (files 8–9) and of the notification subscriptions (files 10–11), and are
mirrored column-for-column in `src/types/database.types.ts` (6 new ENUM entries + 8 new table
entries, including `event_series.default_term_ids`, an array whose elements are validated by the
application because PostgreSQL cannot express an FK over array elements). The repository that reads
them lives in `src/lib/store/supabase-driver.ts`.

File 12 (`20260916120000_media_storage.sql`) provisions Supabase Storage infrastructure for Phase 2 media uploads (`media` bucket, storage RLS policies, and `storage_path`/`checksum` columns on `public.media`).

File 13 (`20260916130000_content_types.sql`) provisions the schema-driven Content Types CMS Engine for Phase 3: custom content types, customizable dynamic fields with validation rules and options, JSONB content entries with status lifecycle (`draft`, `published`, `archived`), GIN indexing, and strict RLS isolation.

File 14 (`20260916140000_parish_videos.sql`) provisions the external Parish Videos embed manager for Phase 4: `video_provider_enum` (`youtube`, `facebook`, `direct`), table `public.parish_videos` with source and normalized embed URLs, sort ordering, public/active visibility toggles, composite index on `(is_public, is_active, sort_order)`, and strict RLS policies (public read for active/public videos; staff mutations restricted to authenticated `admin`/`secretary`).

## Mandatory manual bootstrap step

There is **no other path to a first admin**. Every staff profile is created by the
`on_auth_user_created` trigger with the default role `servant`, which carries no
administrative write access; the `"Admins manage profiles"` policy is itself gated by
`is_admin()`, so an admin cannot be created from the application.

After the first staff account has been created through Supabase Auth, promote it once,
manually, in the SQL editor:

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<uuid-of-first-admin>';
```

Role changes are a spiritual/administrative decision (spec §2 — `ready-for-human`), not a
product feature.

## Security boundary

The RLS policies in `20260916090600_row_level_security.sql` **are** the security boundary
of the portal. Row Level Security is enabled on all 21 tables and every table is covered
by explicit policies:

- public read is limited to active/published rows through `USING` clauses;
- public writes are limited to `INSERT` into the five public forms
  (`condolence_bookings`, `contact_messages`, `program_applications`, `job_applications`,
  `clinic_alert_subscriptions`) — no public `UPDATE`/`DELETE` policy exists anywhere;
- every administrative write goes through `is_staff()` and profile management through
  `is_admin()`, both `SECURITY DEFINER` with a fixed `search_path`.

There is **no `TO authenticated USING (true)` policy anywhere** — an authenticated session
whose profile is missing, inactive, or non-staff has no write access to any table.
`condolence_bookings` deliberately has **no public `SELECT` policy**; booking status is
readable only through the `track_condolence_booking()` RPC by exact reference code.

The events layer added by files 8–9 follows the same rules: published/active rows are publicly
readable, every write is `is_staff()`, and `audit_log` is **append-only** — it has an `INSERT`
policy for staff and no `UPDATE`/`DELETE` policy at all, so a recorded mutation cannot be edited
away through the API.

`subscribers` (files 10–11) is the one table added by the events feature with **no public policy of
any kind**: an e-mail address is personal data, so it is neither readable nor insertable with the
anon key. The public subscribe form writes through the server with the service-role client (after
rate limiting, zod validation and Turnstile verification — the same contract the other public forms
follow in `src/actions/`), and the parish office manages the list through `is_staff()`. There is no
`DELETE` policy: stopping a subscription sets `is_active = FALSE`.

`storage.objects` (file 12) enforces public read on `bucket_id = 'media'` and restricts write operations (`INSERT`, `UPDATE`, `DELETE`) strictly to authenticated staff profiles with `role IN ('admin', 'secretary')`. Bare authenticated access is prohibited.

## Contract names relied on by the application

- `condolence_bookings_booking_reference_code_key` — auto-generated by the inline
  `UNIQUE` on `booking_reference_code`; a collision with an existing code is reported as a
  transient failure (`src/actions/condolence-actions.ts`).
- `uq_condolence_active_date` — partial unique index enforcing one live booking per
  calendar day; a violation is reported as "date already booked" (same action).
- Foreign keys are declared inline so PostgreSQL auto-names them `<table>_<column>_fkey`
  (e.g. `mass_schedules_altar_id_fkey`, `bible_verses_book_id_fkey`), matching
  `src/types/database.types.ts`.
- `uq_taxonomy_term_dimension_slug` — unique `(dimension, slug)`; a violation is reported as a
  slug conflict (`src/lib/store/supabase-driver.ts` → `StoreError("conflict")`).
- `uq_event_exception_occurrence` — unique `(series_id, occurrence_date)`; the per-occurrence
  cancel/move path upserts on exactly this pair via `onConflict: "series_id,occurrence_date"`.
- The events-layer foreign keys follow the same convention (`events_series_id_fkey`,
  `events_venue_id_fkey`, `event_exceptions_series_id_fkey`, …) and are listed in the
  `Relationships` arrays of the seven new tables in `src/types/database.types.ts`.
- `subscribers_email_key` — the UNIQUE constraint on `subscribers.email`. The application
  normalises the address (trimmed, lower-cased) in ONE place
  (`src/lib/domain/subscribers.ts` → `normalizeSubscriberEmail`) before writing, so this constraint
  means "one subscription per address". A lost race between two simultaneous submissions surfaces as
  `23505`, which the driver resolves by updating the row that won instead of failing the visitor
  (`src/lib/store/supabase-driver.ts` → `subscribe()`).

## Notes on fidelity to the spec

- Columns that carry a `DEFAULT` in §3 are declared `NOT NULL` here, because
  `src/types/database.types.ts` types them as non-nullable. All names, types, defaults,
  inline `REFERENCES`/`ON DELETE` actions and constraint names are otherwise verbatim.
- `CREATE TABLE/INDEX IF NOT EXISTS` and guarded `DO` blocks around `CREATE TYPE` keep the
  files re-runnable; functions use `CREATE OR REPLACE`, triggers and policies are preceded
  by `DROP ... IF EXISTS`.
