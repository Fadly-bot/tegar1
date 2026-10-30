PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  package TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  deadline TEXT NOT NULL,
  drive_url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Menunggu konfirmasi'
    CHECK (status IN ('Menunggu konfirmasi', 'Dalam pengerjaan', 'Selesai')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
