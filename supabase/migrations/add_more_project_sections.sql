-- Records the more_projects.sections column in the repo.
-- This column already exists on production (and dev); it was added out-of-band and
-- never captured as a migration, causing drift when the dev schema was rebuilt.
-- IF NOT EXISTS makes this safe/idempotent on any environment.
alter table more_projects
  add column if not exists sections jsonb default null;
