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
