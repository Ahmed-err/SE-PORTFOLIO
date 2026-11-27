-- Contact-form messages, read and updated by the Sarmadax Console
-- through /api/internal/console/leads*. Run once against DATABASE_URL.
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'won', 'lost', 'spam')),
  note TEXT,
  updated_at TIMESTAMPTZ,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS messages_status_created ON messages (status, created_at DESC);
