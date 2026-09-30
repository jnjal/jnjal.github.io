-- جدول محتوای Archive — فقط از طریق Worker قابل دسترسیه
CREATE TABLE IF NOT EXISTS archive_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- وضعیت مکالمه‌ی ربات (برای /add مرحله‌به‌مرحله با دکمه‌ها)
CREATE TABLE IF NOT EXISTS bot_state (
  chat_id TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'idle',
  payload TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

-- اجرا:
--   wrangler d1 create archive
--   wrangler d1 execute archive --remote --file=./schema.sql
--
-- توی wrangler.toml:
--   [[d1_databases]]
--   binding = "DB"
--   database_name = "archive"
--
-- رمز:
--   wrangler secret put ARCHIVE_PASSWORD
