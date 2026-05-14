alter table projects
  add column if not exists case_study_title text default null,
  add column if not exists client           text default null,
  add column if not exists industry         text default null,
  add column if not exists category         text default null,
  add column if not exists role             text default null,
  add column if not exists team             text default null,
  add column if not exists duration         text default null;
