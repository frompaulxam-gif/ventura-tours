CREATE TABLE IF NOT EXISTS payment_attempts (
  quote_id TEXT PRIMARY KEY,
  source_id TEXT,
  started_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result_json TEXT
);
