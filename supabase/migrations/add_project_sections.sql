alter table projects
  add column if not exists sections jsonb default null;
