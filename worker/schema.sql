-- جدول محتوای Archive — فقط از طریق Worker قابل دسترسیه
CREATE TABLE IF NOT EXISTS archive_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
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
