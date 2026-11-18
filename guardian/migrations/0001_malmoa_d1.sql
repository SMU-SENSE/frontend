-- 말모아 독립 Cloudflare D1 데이터베이스
-- 기존 PostgreSQL 데이터를 가져오거나 변경하지 않는다.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  profile_image_url TEXT,
  account_type TEXT,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  phone_number TEXT,
  marketing_agreed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  provider_email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, provider_subject)
);
CREATE INDEX IF NOT EXISTS idx_oauth_account ON oauth_accounts(account_id);

CREATE TABLE IF NOT EXISTS oauth_flows (
  flow_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  nonce TEXT NOT NULL,
  code_verifier TEXT,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);

CREATE TABLE IF NOT EXISTS aac_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'SIMPLE',
  grid_size TEXT NOT NULL DEFAULT 'GRID_3X3',
  active INTEGER NOT NULL DEFAULT 1,
  birth_date TEXT,
  emergency_contact TEXT,
  notes TEXT NOT NULL DEFAULT '',
  profile_image_url TEXT,
  relationship_type TEXT NOT NULL DEFAULT 'PARENT',
  relationship_detail TEXT,
  voice_type TEXT NOT NULL DEFAULT 'CHILD_FEMALE',
  speech_rate REAL NOT NULL DEFAULT 1.0,
  setup_step TEXT NOT NULL DEFAULT 'PROFILE_COMPLETED',
  sentence_level INTEGER NOT NULL DEFAULT 2,
  max_recommended_sentence_words INTEGER NOT NULL DEFAULT 5,
  easy_words_preferred INTEGER NOT NULL DEFAULT 1,
  abstract_expressions_restricted INTEGER NOT NULL DEFAULT 1,
  complex_grammar_restricted INTEGER NOT NULL DEFAULT 1,
  concise_direct_preferred INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'STABLE',
  board_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_aac_users_owner ON aac_users(owner_account_id);

CREATE TABLE IF NOT EXISTS board_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES aac_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#47B492',
  display_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_board_categories_user ON board_categories(user_id);
CREATE TABLE IF NOT EXISTS board_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES aac_users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES board_categories(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  image_url TEXT,
  tts_text TEXT,
  emergency INTEGER NOT NULL DEFAULT 0,
  favorite INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_board_cards_user ON board_cards(user_id);

CREATE TABLE IF NOT EXISTS device_pairings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES aac_users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pairings_user ON device_pairings(user_id, status);
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES aac_users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_type TEXT NOT NULL DEFAULT 'UNKNOWN',
  status TEXT NOT NULL DEFAULT 'CONNECTED',
  access_token_hash TEXT,
  access_token_expires_at INTEGER,
  paired_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

CREATE TABLE IF NOT EXISTS pairing_attempts (
  ip_hash TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tutorial_progress (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT
);
CREATE TABLE IF NOT EXISTS usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES aac_users(id) ON DELETE CASCADE,
  card_id INTEGER REFERENCES board_cards(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  spoken_text TEXT,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES aac_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  time_of_day TEXT NOT NULL DEFAULT '09:00',
  days_of_week TEXT NOT NULL DEFAULT '[]',
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  enabled INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES aac_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  place_type TEXT NOT NULL DEFAULT 'OTHER',
  address TEXT NOT NULL DEFAULT '',
  latitude REAL NOT NULL DEFAULT 0,
  longitude REAL NOT NULL DEFAULT 0,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  active_from TEXT NOT NULL DEFAULT '00:00',
  active_to TEXT NOT NULL DEFAULT '23:59'
);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES aac_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  acknowledged INTEGER NOT NULL DEFAULT 0,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);
