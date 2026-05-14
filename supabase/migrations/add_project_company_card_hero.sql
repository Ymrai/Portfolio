ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS company        TEXT,
  ADD COLUMN IF NOT EXISTS card_bg_color  TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
