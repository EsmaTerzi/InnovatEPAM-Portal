import getDb from './client';
import type Database from 'better-sqlite3';

export function runMigrations(dbOverride?: Database.Database): void {
  const db = dbOverride ?? getDb();

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

    CREATE TABLE IF NOT EXISTS attachments (
      id            TEXT    PRIMARY KEY,
      idea_id       TEXT    NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      original_name TEXT    NOT NULL,
      stored_path   TEXT    NOT NULL,
      mime_type     TEXT    NOT NULL,
      size_bytes    INTEGER NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Phase 03: migrate legacy attachment_path column to attachments table,
  // then rebuild the ideas table without the column.
  //
  // Recovery: if a previous migration was interrupted and ideas_legacy still
  // exists, complete the migration rather than failing.
  const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>).map((r) => r.name);
  const hasLegacyTable = tables.includes('ideas_legacy');
  const columns = db.prepare("PRAGMA table_info(ideas)").all() as Array<{ name: string }>;
  const hasLegacyCol = columns.some((c) => c.name === 'attachment_path');

  if (hasLegacyCol || hasLegacyTable) {
    // Disable FK enforcement for the entire migration to avoid cascade issues
    // during table rename/rebuild.
    // legacy_alter_table = ON prevents SQLite 3.26.0+ from auto-updating FK
    // references in other tables when we rename ideas → ideas_legacy.
    // Without this, idea_metadata and attachments would get their FKs rewritten
    // to reference ideas_legacy, and after DROP TABLE ideas_legacy those FKs
    // would be broken.
    db.pragma('foreign_keys = OFF');
    db.pragma('legacy_alter_table = ON');

    // Step 1: Rename old ideas table to backup so we can read attachment_path later.
    // Skip if ideas_legacy already exists from a prior interrupted migration.
    if (!hasLegacyTable) {
      db.prepare('ALTER TABLE ideas RENAME TO ideas_legacy').run();
    }

    // Step 2: Create the clean ideas table (no attachment_path).
    // Skip if ideas already exists (prior run completed step 1 but crashed before step 5).
    const ideaTableExists = tables.includes('ideas') && !hasLegacyCol;
    if (!ideaTableExists) {
      db.prepare(`
        CREATE TABLE ideas (
          id              TEXT PRIMARY KEY,
          title           TEXT NOT NULL,
          description     TEXT NOT NULL,
          category        TEXT NOT NULL CHECK (category IN ('Process Improvement','Technology','Customer Experience','Other')),
          status          TEXT NOT NULL DEFAULT 'submitted'
                            CHECK (status IN ('submitted','under_review','accepted','rejected')),
          submitted_by    TEXT NOT NULL REFERENCES users(id),
          created_at      TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Step 3: Copy rows into clean ideas table.
      db.prepare(`
        INSERT INTO ideas (id, title, description, category, status, submitted_by, created_at, updated_at)
        SELECT id, title, description, category, status, submitted_by, created_at, updated_at
        FROM ideas_legacy
      `).run();
    }

    // Step 4: Migrate legacy single-file attachments into the attachments table.
    // Only run if ideas_legacy still exists at this point.
    const legacyExistsNow = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ideas_legacy'").get() as { name: string } | undefined) !== undefined;
    if (legacyExistsNow) {
      db.prepare(`
        INSERT OR IGNORE INTO attachments (id, idea_id, original_name, stored_path, mime_type, size_bytes)
        SELECT
          lower(hex(randomblob(16))),
          id,
          CASE
            WHEN attachment_path LIKE '%/%'
              THEN SUBSTR(attachment_path, LENGTH(attachment_path) - LENGTH(REPLACE(attachment_path, '/', '')) + 1)
            ELSE attachment_path
          END,
          attachment_path,
          CASE
            WHEN attachment_path LIKE '%.pdf'  THEN 'application/pdf'
            WHEN attachment_path LIKE '%.docx' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            WHEN attachment_path LIKE '%.pptx' THEN 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            WHEN attachment_path LIKE '%.png'  THEN 'image/png'
            WHEN attachment_path LIKE '%.jpg'  THEN 'image/jpeg'
            WHEN attachment_path LIKE '%.jpeg' THEN 'image/jpeg'
            ELSE 'application/octet-stream'
          END,
          0
        FROM ideas_legacy
        WHERE attachment_path IS NOT NULL
      `).run();

      // Step 5: Drop the backup table.
      db.prepare('DROP TABLE ideas_legacy').run();
    }

    db.pragma('legacy_alter_table = OFF');
    db.pragma('foreign_keys = ON');
  }

  // Recovery: SQLite 3.26.0+ may have auto-rewritten FK references in
  // evaluation_comments when ideas was renamed to ideas_legacy. Detect and fix.
  const ecSchema = (db.prepare(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='evaluation_comments'"
  ).get() as { sql: string } | undefined)?.sql ?? '';
  if (ecSchema.includes('ideas_legacy')) {
    db.pragma('foreign_keys = OFF');
    db.exec(`
      CREATE TABLE IF NOT EXISTS evaluation_comments_fixed (
        id           TEXT PRIMARY KEY,
        idea_id      TEXT UNIQUE NOT NULL REFERENCES ideas(id),
        admin_id     TEXT NOT NULL REFERENCES users(id),
        comment_text TEXT NOT NULL,
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT OR IGNORE INTO evaluation_comments_fixed SELECT * FROM evaluation_comments;
      DROP TABLE evaluation_comments;
      ALTER TABLE evaluation_comments_fixed RENAME TO evaluation_comments;
    `);
    db.pragma('foreign_keys = ON');
  }
}
