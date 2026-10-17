CREATE TABLE IF NOT EXISTS drafts(round_id TEXT NOT NULL,reviewer_id TEXT NOT NULL,draft TEXT NOT NULL,report TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(round_id,reviewer_id));
CREATE TABLE IF NOT EXISTS submissions(round_id TEXT NOT NULL,reviewer_id TEXT NOT NULL,name_key TEXT NOT NULL,submission TEXT NOT NULL,submitted_at TEXT NOT NULL,PRIMARY KEY(round_id,reviewer_id,name_key));
