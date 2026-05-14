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
