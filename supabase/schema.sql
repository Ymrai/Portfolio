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
