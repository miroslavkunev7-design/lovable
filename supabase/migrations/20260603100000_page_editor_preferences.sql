-- User CRM preferences (theme, cover image)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  crm_theme VARCHAR(64) NOT NULL DEFAULT 'dark-crimson',
  cover_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Page layout configs (global per page slug)
CREATE TABLE IF NOT EXISTS page_layouts (
  id SERIAL PRIMARY KEY,
  page_slug VARCHAR(128) NOT NULL UNIQUE,
  layout_config JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default layouts
INSERT INTO page_layouts (page_slug, layout_config) VALUES
  ('home', '[{"id":"hero","label":"Главен банер (Hero)","visible":true,"order":0,"variant":"default"},{"id":"search","label":"Търсачка","visible":true,"order":1,"variant":"default"},{"id":"city-cards","label":"Карти на градовете","visible":true,"order":2,"variant":"marble"},{"id":"featured","label":"Препоръчани имоти","visible":true,"order":3,"variant":"default"},{"id":"cta","label":"Покана за действие (CTA)","visible":true,"order":4,"variant":"default"}]'),
  ('cities/burgas', '[{"id":"hero","label":"Главен банер","visible":true,"order":0,"variant":"default"},{"id":"about","label":"За Бургас","visible":true,"order":1,"variant":"default"},{"id":"search","label":"Търсачка","visible":true,"order":2,"variant":"default"},{"id":"quarters","label":"Карти на кварталите","visible":true,"order":3,"variant":"marble"}]'),
  ('cities/generic', '[{"id":"hero","label":"Главен банер","visible":true,"order":0,"variant":"default"},{"id":"search","label":"Търсачка","visible":true,"order":1,"variant":"default"},{"id":"properties","label":"Имоти","visible":true,"order":2,"variant":"grid"},{"id":"quarters","label":"Квартали","visible":true,"order":3,"variant":"marble"}]')
ON CONFLICT (page_slug) DO NOTHING;
