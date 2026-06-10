-- ============================================================================
-- portfolio-dev — FULL SCHEMA SETUP (structure only, NO production data)
-- Paste this entire file into: portfolio-dev → SQL Editor → New query → Run.
-- Idempotent & safe to re-run. Sections are concatenated from supabase/
-- (schema.sql, schema_v2.sql, then migrations) in dependency order.
-- The only INSERTs are EMPTY singleton/default rows (scaffolding the app
-- needs to boot) and default settings — none of your real content.
-- ============================================================================

-- gen_random_uuid() is built into Postgres 13+ (Supabase runs 15+), but this
-- guard makes the script robust on any project:
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================================
-- STEP 1  —  supabase/schema.sql
-- ============================================================================
-- ============================================================
-- Portfolio CMS — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Portfolio Info (singleton row, id = 1) ──────────────────
CREATE TABLE IF NOT EXISTS portfolio_info (
  id          BIGINT PRIMARY KEY DEFAULT 1,
  name        TEXT NOT NULL DEFAULT '',
  tagline     TEXT,
  bio_short   TEXT,
  email       TEXT,
  github_url  TEXT,
  linkedin_url TEXT,
  resume_url  TEXT,
  avatar_url  TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT portfolio_info_singleton CHECK (id = 1)
);

-- Seed the singleton row so it always exists
INSERT INTO portfolio_info (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ── Projects (featured / main projects) ─────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  long_description TEXT,
  tech_stack       TEXT[]    NOT NULL DEFAULT '{}',
  live_url         TEXT,
  github_url       TEXT,
  image_url        TEXT,
  featured         BOOLEAN   NOT NULL DEFAULT false,
  order_index      INT       NOT NULL DEFAULT 0,
  status           TEXT      NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'published')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_status_order_idx
  ON projects (status, order_index);

-- ── More Projects (lighter side-project entries) ────────────
CREATE TABLE IF NOT EXISTS more_projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  tech_stack  TEXT[]    NOT NULL DEFAULT '{}',
  live_url    TEXT,
  github_url  TEXT,
  order_index INT       NOT NULL DEFAULT 0,
  status      TEXT      NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'published')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS more_projects_status_order_idx
  ON more_projects (status, order_index);

-- ── About Me (singleton row, id = 1) ────────────────────────
-- experience / education stored as JSONB arrays:
--   experience: [{ company, role, start_date, end_date, description }]
--   education:  [{ institution, degree, field, graduation_year }]
CREATE TABLE IF NOT EXISTS about_me (
  id          BIGINT PRIMARY KEY DEFAULT 1,
  bio         TEXT,
  skills      TEXT[]    NOT NULL DEFAULT '{}',
  experience  JSONB     NOT NULL DEFAULT '[]',
  education   JSONB     NOT NULL DEFAULT '[]',
  interests   TEXT[]    NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT about_me_singleton CHECK (id = 1)
);

-- Seed the singleton row so it always exists
INSERT INTO about_me (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ── updated_at trigger (shared) ──────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_portfolio_info_updated_at
  BEFORE UPDATE ON portfolio_info
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_more_projects_updated_at
  BEFORE UPDATE ON more_projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_about_me_updated_at
  BEFORE UPDATE ON about_me
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ───────────────────────────────────────
-- Public read, no public write. Admin writes go through service_role key.
ALTER TABLE portfolio_info  ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE more_projects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_me        ENABLE ROW LEVEL SECURITY;

-- Anyone can read published content
CREATE POLICY "public_read_portfolio_info"
  ON portfolio_info FOR SELECT USING (true);

CREATE POLICY "public_read_published_projects"
  ON projects FOR SELECT USING (status = 'published');

CREATE POLICY "public_read_published_more_projects"
  ON more_projects FOR SELECT USING (status = 'published');

CREATE POLICY "public_read_about_me"
  ON about_me FOR SELECT USING (true);

-- ── Done ─────────────────────────────────────────────────────
-- service_role key bypasses RLS, so admin mutations work without extra policies.


-- ============================================================================
-- STEP 2  —  supabase/schema_v2.sql
-- ============================================================================
-- ============================================================
-- Portfolio CMS — Schema v2 Migration
-- Safe to run on a fresh database or one that already has
-- schema.sql applied. All statements are idempotent.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Projects: add gallery + structured case study ────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS case_study     JSONB;

-- ── More Projects: add images, industry, kind, slug ──────────
ALTER TABLE more_projects
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images  TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS industry        TEXT,
  ADD COLUMN IF NOT EXISTS kind            TEXT,
  ADD COLUMN IF NOT EXISTS slug            TEXT UNIQUE;

-- ── Supabase Storage bucket ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-assets',
  'portfolio-assets',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage policies (drop first so re-runs never fail) ──────
DROP POLICY IF EXISTS portfolio_assets_public_read  ON storage.objects;
DROP POLICY IF EXISTS portfolio_assets_insert        ON storage.objects;
DROP POLICY IF EXISTS portfolio_assets_update        ON storage.objects;
DROP POLICY IF EXISTS portfolio_assets_delete        ON storage.objects;

CREATE POLICY portfolio_assets_public_read
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'portfolio-assets');

CREATE POLICY portfolio_assets_insert
  ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'portfolio-assets');

CREATE POLICY portfolio_assets_update
  ON storage.objects FOR UPDATE TO public
  USING (bucket_id = 'portfolio-assets');

CREATE POLICY portfolio_assets_delete
  ON storage.objects FOR DELETE TO public
  USING (bucket_id = 'portfolio-assets');


-- ============================================================================
-- STEP 3  —  supabase/migrations/add_page_content_fields.sql
-- ============================================================================
-- Add editable page content fields to portfolio_info
ALTER TABLE portfolio_info
  ADD COLUMN IF NOT EXISTS home_intro_text         TEXT,
  ADD COLUMN IF NOT EXISTS home_case_studies_title       TEXT,
  ADD COLUMN IF NOT EXISTS home_case_studies_subtitle    TEXT,
  ADD COLUMN IF NOT EXISTS home_case_studies_description TEXT,
  ADD COLUMN IF NOT EXISTS more_page_title         TEXT,
  ADD COLUMN IF NOT EXISTS more_page_subtitle      TEXT,
  ADD COLUMN IF NOT EXISTS more_page_description   TEXT,
  ADD COLUMN IF NOT EXISTS about_page_title        TEXT,
  ADD COLUMN IF NOT EXISTS about_page_subtitle     TEXT,
  ADD COLUMN IF NOT EXISTS footer_title            TEXT,
  ADD COLUMN IF NOT EXISTS footer_subtitle         TEXT;


-- ============================================================================
-- STEP 4  —  supabase/migrations/add_project_company_card_hero.sql
-- ============================================================================
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS company        TEXT,
  ADD COLUMN IF NOT EXISTS card_bg_color  TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;


-- ============================================================================
-- STEP 5  —  supabase/migrations/add_project_hero_bg_color.sql
-- ============================================================================
alter table projects
  add column if not exists hero_bg_color text default null;


-- ============================================================================
-- STEP 6  —  supabase/migrations/add_project_sections.sql
-- ============================================================================
alter table projects
  add column if not exists sections jsonb default null;


-- ============================================================================
-- STEP 7  —  supabase/migrations/add_project_snapshot_fields.sql
-- ============================================================================
alter table projects
  add column if not exists case_study_title text default null,
  add column if not exists client           text default null,
  add column if not exists industry         text default null,
  add column if not exists category         text default null,
  add column if not exists role             text default null,
  add column if not exists team             text default null,
  add column if not exists duration         text default null;


-- ============================================================================
-- STEP 8  —  supabase/migrations/add_settings_table.sql
-- ============================================================================
-- ============================================================
-- Portfolio CMS — Settings table
-- Stores runtime-configurable key/value pairs (password, cookie
-- duration, etc.) readable only via the service role.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  id    TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Seed default rows (idempotent)
INSERT INTO settings (id, value) VALUES
  ('portfolio_password',    ''),
  ('cookie_duration_hours', '24')
ON CONFLICT (id) DO NOTHING;

-- ── RLS: enable, but grant nothing to anon/authenticated ─────
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so this script is safely re-runnable
DROP POLICY IF EXISTS settings_service_role_all ON settings;

-- Service role bypasses RLS entirely, so no explicit policy is
-- needed for it. The DROP+no-CREATE pattern ensures anon and
-- authenticated roles can never read or write this table.
-- (No policies = deny all for non-service-role callers.)


-- ============================================================================
-- STEP 9  —  supabase/migrations/explicit_api_grants.sql
-- ============================================================================
-- ============================================================
-- Explicit Data API GRANTs
--
-- From October 30, 2026, Supabase will no longer automatically
-- grant table access to the `anon` and `authenticated` roles for
-- new tables in the public schema. This migration makes all
-- required grants explicit so the project is not affected by
-- that breaking change, and to document the intended access model.
--
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run (all statements are idempotent).
-- ============================================================

-- ── Schema usage ─────────────────────────────────────────────
-- Both roles need USAGE on the public schema to call the Data API.

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;


-- ── portfolio_info ───────────────────────────────────────────
-- Read: public site reads via createClient() (anon).
-- Write: admin /info page writes via browser client (anon).
--   RLS should restrict writes to authenticated admin sessions
--   if Supabase Auth is added in future; for now the admin area
--   is protected only by the admin_auth cookie at the app layer.

GRANT SELECT ON TABLE public.portfolio_info TO anon;
GRANT UPDATE ON TABLE public.portfolio_info TO anon;


-- ── projects ─────────────────────────────────────────────────
-- Read: public site and admin list page both use createClient().
-- Write: Server Actions use createServiceClient() (service role).
--   Service role bypasses RLS and needs no explicit grant.
--
-- NOTE: getAllProjects() (admin list) uses the anon client with
--   no status filter. If RLS enforces status='published' for anon,
--   drafts will be invisible in the admin — see queries.ts note.
--   Recommend migrating getAllProjects() to createServiceClient().

GRANT SELECT ON TABLE public.projects TO anon;


-- ── more_projects ────────────────────────────────────────────
-- Read: public site uses createClient() (anon).
-- Write: Server Actions use createServiceClient().
-- Admin list: getAllMoreProjects() correctly uses createServiceClient().

GRANT SELECT ON TABLE public.more_projects TO anon;


-- ── about_me ─────────────────────────────────────────────────
-- Read: public About page uses createClient() (anon).
-- Write: admin /about page writes directly via browser anon client.

GRANT SELECT ON TABLE public.about_me TO anon;
GRANT UPDATE ON TABLE public.about_me TO anon;


-- ── settings ─────────────────────────────────────────────────
-- All access is via createServiceClient() (service role only).
-- RLS is enabled with no policies → anon/authenticated are denied.
-- No grants for anon or authenticated — this is intentional.
-- Service role bypasses RLS automatically; no grant needed.

-- (no GRANT statements for settings)


-- ── Summary of access model ──────────────────────────────────
--
-- Table            anon SELECT  anon UPDATE  service_role
-- ─────────────────────────────────────────────────────────────
-- portfolio_info   ✅           ✅           ✅ (bypasses RLS)
-- projects         ✅           ❌           ✅ (bypasses RLS)
-- more_projects    ✅           ❌           ✅ (bypasses RLS)
-- about_me         ✅           ✅           ✅ (bypasses RLS)
-- settings         ❌           ❌           ✅ (bypasses RLS)
--
-- ── Security Advisor recommendations to check in dashboard ───
--
-- 1. Ensure RLS is ENABLED on all tables (prevents anon from
--    reading/writing rows that policies don't explicitly allow).
--
-- 2. Recommended RLS policies for portfolio_info and about_me
--    (if not already present):
--
--    CREATE POLICY "Public can read portfolio_info"
--      ON public.portfolio_info FOR SELECT TO anon USING (true);
--
--    CREATE POLICY "Public can read about_me"
--      ON public.about_me FOR SELECT TO anon USING (true);
--
--    CREATE POLICY "Public can read published projects"
--      ON public.projects FOR SELECT TO anon
--      USING (status = 'published');
--
--    CREATE POLICY "Public can read published more_projects"
--      ON public.more_projects FOR SELECT TO anon
--      USING (status = 'published');
--
-- 3. The anon UPDATE grants on portfolio_info and about_me are
--    protected only by the admin_auth cookie at the app layer —
--    not by RLS. If stricter security is needed, migrate the
--    admin /about and /info pages to use Server Actions with
--    createServiceClient() and remove the UPDATE grants from anon.


-- ============================================================================
-- STEP 10  —  supabase/migrations/security_advisor_fixes.sql
-- ============================================================================
-- ============================================================
-- Security Advisor Fixes
--
-- Addresses the three issues flagged by Supabase Security Advisor:
--   1. Function Search Path Mutable  — set_updated_at
--   2. Public Bucket Allows Listing  — portfolio-assets storage bucket
--   3. RLS Enabled No Policy         — public.settings table
--
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run (all statements are idempotent).
-- ============================================================


-- ── Fix 1: Function Search Path Mutable ──────────────────────
--
-- The set_updated_at trigger function is missing SET search_path,
-- which means a malicious user with CREATE privilege could shadow
-- public objects by injecting a schema earlier in the search path.
-- Adding SET search_path = public pins the function to the correct
-- schema regardless of the caller's search_path setting.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ── Fix 2: Public Bucket Allows Listing ──────────────────────
--
-- The portfolio-assets bucket is public (files are served via CDN
-- without any auth). The Security Advisor flags a broad SELECT
-- policy that allows the anon role to list ALL objects in the
-- bucket via the Storage List API — a data exposure risk.
--
-- Strategy:
--   • Public files are served directly by the CDN (no RLS check
--     on CDN reads), so we don't need a SELECT policy for anon.
--   • Drop the broad SELECT policy so anon cannot call the List
--     API and enumerate every uploaded filename.
--   • Keep (or add) INSERT/UPDATE/DELETE policies so the admin
--     can still upload and manage files via the browser client
--     (upload.ts uses createClient / anon key).
--   • Service role always bypasses RLS, so server-side ops are
--     unaffected.
--
-- NOTE: If your dashboard shows different policy names, replace
-- the names below with the exact names shown in
-- Storage → portfolio-assets → Policies.

-- Drop the overly-broad SELECT policy (common default names):
DROP POLICY IF EXISTS "Public Access"           ON storage.objects;
DROP POLICY IF EXISTS "Give public access"      ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public read"             ON storage.objects;

-- Ensure anon can upload files (required by upload.ts browser client):
DROP POLICY IF EXISTS "Allow anon uploads" ON storage.objects;
CREATE POLICY "Allow anon uploads"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'portfolio-assets');

-- Ensure anon can update/replace existing files:
DROP POLICY IF EXISTS "Allow anon updates" ON storage.objects;
CREATE POLICY "Allow anon updates"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'portfolio-assets');

-- Ensure anon can delete files (admin image replacement removes old file):
DROP POLICY IF EXISTS "Allow anon deletes" ON storage.objects;
CREATE POLICY "Allow anon deletes"
  ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'portfolio-assets');

-- No SELECT policy for anon → listing is blocked.
-- CDN reads (https://<project>.supabase.co/storage/v1/object/public/...)
-- bypass RLS entirely, so public image URLs continue to work.


-- ── Fix 3: RLS Enabled No Policy ─────────────────────────────
--
-- The settings table has RLS enabled but no explicit policies.
-- With no policies, all roles (including authenticated) are denied
-- by default — but the Security Advisor flags the absence of any
-- explicit policy as a misconfiguration to document intent.
--
-- All settings access in queries.ts already uses createServiceClient()
-- (service role), which bypasses RLS entirely. Adding an explicit
-- USING (false) policy for anon and authenticated makes the intent
-- clear: only service role may access this table.

DROP POLICY IF EXISTS "Deny anon and authenticated access to settings"
  ON public.settings;

CREATE POLICY "Deny anon and authenticated access to settings"
  ON public.settings
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- ── Summary of changes ───────────────────────────────────────
--
-- 1. set_updated_at now has a fixed search_path = public — no
--    behaviour change, eliminates the search_path injection risk.
--
-- 2. storage.objects: broad anon SELECT removed; anon retains
--    INSERT / UPDATE / DELETE for the portfolio-assets bucket so
--    the admin upload flow keeps working. CDN public reads are
--    unaffected (they don't go through RLS).
--
-- 3. settings: explicit USING (false) policy documents that only
--    service role (which bypasses RLS) may read or write this
--    table. No functional change — the deny was already implicit.


