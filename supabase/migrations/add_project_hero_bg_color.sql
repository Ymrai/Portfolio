alter table projects
  add column if not exists hero_bg_color text default null;
