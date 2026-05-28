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
