import getDb from './client';

export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role        TEXT NOT NULL CHECK (role IN ('submitter', 'admin')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL,
      description     TEXT NOT NULL,
      category        TEXT NOT NULL CHECK (category IN ('Process Improvement','Technology','Customer Experience','Other')),
      status          TEXT NOT NULL DEFAULT 'submitted'
                        CHECK (status IN ('submitted','under_review','accepted','rejected')),
      attachment_path TEXT,
      submitted_by    TEXT NOT NULL REFERENCES users(id),
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS evaluation_comments (
      id           TEXT PRIMARY KEY,
      idea_id      TEXT UNIQUE NOT NULL REFERENCES ideas(id),
      admin_id     TEXT NOT NULL REFERENCES users(id),
      comment_text TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS idea_metadata (
      id        TEXT PRIMARY KEY,
      idea_id   TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      field_key TEXT NOT NULL,
      field_val TEXT NOT NULL,
      UNIQUE (idea_id, field_key)
    );
  `);
}
