const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---- Хүснэгтүүд үүсгэх (миграци) ----
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
  is_vip        INTEGER NOT NULL DEFAULT 0,      -- 0 | 1
  vip_expires_at TEXT,                           -- ISO огноо, NULL бол хугацаагүй
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movies (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  description  TEXT DEFAULT '',
  poster_url   TEXT DEFAULT '',
  year         INTEGER,
  genre        TEXT DEFAULT '',
  country      TEXT DEFAULT '',
  is_series    INTEGER NOT NULL DEFAULT 0,       -- 0=кино, 1=олон ангит
  featured     INTEGER NOT NULL DEFAULT 0,       -- нүүр хуудсанд онцлох
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS episodes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id    INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  number      INTEGER NOT NULL DEFAULT 1,        -- ангийн дугаар
  title       TEXT DEFAULT '',
  video_url   TEXT NOT NULL,                     -- mp4 / m3u8 / embed
  video_type  TEXT NOT NULL DEFAULT 'file',      -- 'file' | 'hls' | 'embed'
  duration    TEXT DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_episodes_movie ON episodes(movie_id);

-- Дараа нь QPay/SocialPay нэмэхэд ашиглах төлбөрийн бичлэгийн хүснэгт
CREATE TABLE IF NOT EXISTS payments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL DEFAULT 0,
  provider     TEXT NOT NULL DEFAULT 'manual',   -- 'manual' | 'qpay' | 'socialpay'
  status       TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'paid' | 'failed'
  invoice_id   TEXT,                             -- гадаад системийн invoice дугаар
  vip_days     INTEGER NOT NULL DEFAULT 30,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at      TEXT
);
`);

module.exports = db;
