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
