# portfolio-dev — schema setup (manual, browser SQL Editor)

Recreate the full schema on the empty **portfolio-dev** Supabase project. **Structure only —
no production data.** You run this yourself in the browser; no CLI needed.

## Recommended: one consolidated paste
1. Supabase → open **portfolio-dev** → **SQL Editor** → **New query**.
2. Open **`portfolio-dev-schema.sql`** (in this folder), copy the whole file, paste, **Run**.
3. Done. It's idempotent — safe to re-run if you tweak and want to reapply.

This file is just the repo's SQL concatenated **verbatim** in dependency order:
`schema.sql` → `schema_v2.sql` → the 6 additive migrations → `explicit_api_grants.sql` →
`security_advisor_fixes.sql`, with a `pgcrypto` guard prepended.

## Alternative: run the source files one by one
Same result; just run these **in this exact order** (each is its own paste + Run):
1. `supabase/schema.sql`
2. `supabase/schema_v2.sql`
3. `supabase/migrations/add_page_content_fields.sql`
4. `supabase/migrations/add_project_company_card_hero.sql`
5. `supabase/migrations/add_project_hero_bg_color.sql`
6. `supabase/migrations/add_project_sections.sql`
7. `supabase/migrations/add_project_snapshot_fields.sql`
8. `supabase/migrations/add_settings_table.sql`  ← must come before #10
9. `supabase/migrations/explicit_api_grants.sql`
10. `supabase/migrations/security_advisor_fixes.sql`

The consolidated single-paste is less error-prone (no chance of wrong order / skipping one).

## What gets created
- Tables: `portfolio_info`, `projects`, `more_projects`, `about_me`, `settings`.
- Function `set_updated_at()` + `updated_at` triggers on the four content tables.
- RLS enabled + public-read policies; explicit anon GRANTs (matches prod's access model).
- Storage bucket `portfolio-assets` (public) + storage.objects policies for upload/replace/delete.
- **Seed rows are empty scaffolding only:** `portfolio_info(id=1)`, `about_me(id=1)` (all-blank
  singletons the app expects), and default `settings` (`portfolio_password=''`,
  `cookie_duration_hours='24'`). These are NOT your production content.

## Fresh-project gotchas (and how they're handled)
- **`gen_random_uuid()`** (project PK default) — built into Postgres 13+, which Supabase runs,
  so it works out of the box. The script still prepends `CREATE EXTENSION IF NOT EXISTS
  pgcrypto;` as a belt-and-suspenders guard. No action needed.
- **`storage.buckets` / `storage.objects`** — Supabase pre-installs the `storage` schema on
  every project, and the SQL Editor runs as a privileged role, so the bucket INSERT and the
  storage policies apply cleanly. No extension/setup required.
- **No `auth.users` references** anywhere — nothing depends on Supabase Auth, so there's
  nothing to enable or seed there.
- **Roles `anon` / `authenticated`** exist by default → the GRANTs succeed.
- **Everything is idempotent** → re-running the file (or any single migration) is safe.

## Two optional storage tweaks (only if you hit them while testing)
1. **Résumé (PDF) uploads.** `schema_v2`'s bucket definition allows images but **not**
   `application/pdf`, and the browser uploader doesn't auto-fix the bucket. If you want to test
   the résumé replace flow on dev, run this once after setup:
   ```sql
   update storage.buckets
   set allowed_mime_types = array[
     'image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml','application/pdf'
   ]
   where id = 'portfolio-assets';
   ```
2. **Match prod's "no anon listing".** `schema_v2` adds an anon SELECT (list) policy that the
   later security fix (which targets differently-named default policies) doesn't remove, so on
   dev anon can still List the bucket. Harmless for a dev project; uploads/reads/deletes are
   unaffected. To mirror prod's locked-down listing exactly:
   ```sql
   drop policy if exists portfolio_assets_public_read on storage.objects;
   ```
   (Public CDN image reads keep working — they bypass RLS.)

## Verify it worked
```sql
-- 5 tables expected:
select table_name from information_schema.tables
where table_schema='public' order by table_name;

-- bucket exists and is public:
select id, public, allowed_mime_types from storage.buckets where id='portfolio-assets';
```

## Reminder
This sets up the **database** only. Do **not** switch `.env` yet — keep developing against
prod until you've filled in `.env.local.dev` AND run this schema on portfolio-dev. Then switch
with `cp .env.local.dev .env.local` (and back with `cp .env.local.prod-backup .env.local`).
</content>
