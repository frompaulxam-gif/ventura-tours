CREATE TABLE IF NOT EXISTS feedback (
  round_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  draft TEXT NOT NULL,
  report TEXT NOT NULL,
  submitted_at TEXT,
  PRIMARY KEY (round_id, reviewer_id)
);
