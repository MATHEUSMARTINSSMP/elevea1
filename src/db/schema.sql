-- ELEVEA Database Schema
-- SQLite Implementation

-- Users table (admins and clients)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  site_slug TEXT,
  plan TEXT CHECK (plan IN ('vip', 'essential')) DEFAULT 'essential',
  billing_status TEXT DEFAULT 'pending',
  billing_next DATETIME,
  billing_amount DECIMAL(10,2) DEFAULT 0.00,
  billing_currency TEXT DEFAULT 'BRL',
  billing_provider TEXT DEFAULT 'mercadopago',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT 1,
  notes TEXT,
  vip_pin_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings snapshots per site
CREATE TABLE IF NOT EXISTS settings_kv (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_slug TEXT NOT NULL,
  settings_json TEXT NOT NULL, -- JSON containing sections: {defs: [], data: {}}, NO security.vip_pin
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Assets (files) per site
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_slug TEXT NOT NULL,
  key TEXT NOT NULL, -- 'media_1', 'hero', 'logo', etc.
  url TEXT NOT NULL, -- public URL path
  original_name TEXT,
  mimetype TEXT,
  size INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leads captured from sites
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'website',
  metadata TEXT DEFAULT '{}', -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Feedbacks/testimonials from sites
CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_slug TEXT NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  approved BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Traffic hits for telemetry
CREATE TABLE IF NOT EXISTS traffic_hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_slug TEXT NOT NULL,
  path TEXT DEFAULT '/',
  ip TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Site hooks (for future external automation)
CREATE TABLE IF NOT EXISTS site_hooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_slug TEXT NOT NULL,
  notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_site_slug ON users(site_slug);
CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);
CREATE INDEX IF NOT EXISTS idx_settings_site_slug ON settings_kv(site_slug);
CREATE INDEX IF NOT EXISTS idx_assets_site_slug ON assets(site_slug);
CREATE INDEX IF NOT EXISTS idx_assets_key ON assets(site_slug, key);
CREATE INDEX IF NOT EXISTS idx_leads_site_slug ON leads(site_slug);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_site_slug ON feedbacks(site_slug);
CREATE INDEX IF NOT EXISTS idx_feedbacks_approved ON feedbacks(approved);
CREATE INDEX IF NOT EXISTS idx_traffic_site_slug ON traffic_hits(site_slug);
CREATE INDEX IF NOT EXISTS idx_traffic_created_at ON traffic_hits(created_at DESC);

-- Triggers to update updated_at
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
  AFTER UPDATE ON users
  BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_sites_updated_at 
  AFTER UPDATE ON sites
  BEGIN
    UPDATE sites SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;