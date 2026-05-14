/**
 * T025 — Migration idempotency tests
 */

import BetterSqlite3 from 'better-sqlite3';
import { runMigrations } from './schema';

function makeDb(): BetterSqlite3.Database {
  const db = new BetterSqlite3(':memory:');
  db.pragma('foreign_keys = ON');
  return db;
}

function getColumns(db: BetterSqlite3.Database, tableName: string): string[] {
  const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return rows.map((r) => r.name);
}

function tableExists(db: BetterSqlite3.Database, tableName: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(tableName) as { name: string } | undefined;
  return !!row;
}

function buildLegacyDb(): BetterSqlite3.Database {
  const db = makeDb();
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, role TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE ideas (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
      category TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'submitted',
      attachment_path TEXT,
      submitted_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE evaluation_comments (
      id TEXT PRIMARY KEY, idea_id TEXT UNIQUE NOT NULL REFERENCES ideas(id),
      admin_id TEXT NOT NULL REFERENCES users(id), comment_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL
    );
    CREATE TABLE idea_metadata (
      id TEXT PRIMARY KEY, idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      field_key TEXT NOT NULL, field_val TEXT NOT NULL, UNIQUE (idea_id, field_key)
    );
  `);
  db.prepare(`INSERT INTO users (id, email, password_hash, role) VALUES ('u1', 'a@b.com', 'hash', 'submitter')`).run();
  db.prepare(`INSERT INTO ideas (id, title, description, category, submitted_by, attachment_path) VALUES ('i1', 'T', 'D', 'Technology', 'u1', '/uploads/doc.pdf')`).run();
  return db;
}

describe('runMigrations — idempotency', () => {
  it('creates the attachments table on first run', () => {
    const db = makeDb();
    runMigrations(db);
    expect(tableExists(db, 'attachments')).toBe(true);
  });

  it('does not throw when called a second time (idempotent)', () => {
    const db = makeDb();
    runMigrations(db);
    expect(() => runMigrations(db)).not.toThrow();
  });

  it('attachments table still exists after the second call', () => {
    const db = makeDb();
    runMigrations(db);
    runMigrations(db);
    expect(tableExists(db, 'attachments')).toBe(true);
  });

  it('ideas table does not contain attachment_path after first run', () => {
    const db = makeDb();
    runMigrations(db);
    expect(getColumns(db, 'ideas')).not.toContain('attachment_path');
  });

  it('ideas table does not contain attachment_path after second run', () => {
    const db = makeDb();
    runMigrations(db);
    runMigrations(db);
    expect(getColumns(db, 'ideas')).not.toContain('attachment_path');
  });

  it('expected ideas columns are all present after migration', () => {
    const db = makeDb();
    runMigrations(db);
    const cols = getColumns(db, 'ideas');
    expect(cols).toContain('id');
    expect(cols).toContain('title');
    expect(cols).toContain('description');
    expect(cols).toContain('category');
    expect(cols).toContain('status');
    expect(cols).toContain('submitted_by');
    expect(cols).toContain('created_at');
    expect(cols).toContain('updated_at');
  });

  it('migrates legacy attachment_path into attachments table', () => {
    const db = buildLegacyDb();
    runMigrations(db);
    const count = (db.prepare('SELECT COUNT(*) as n FROM attachments WHERE idea_id=?').get('i1') as { n: number }).n;
    expect(count).toBe(1);
  });

  it('does not duplicate attachments when runMigrations called twice', () => {
    const db = buildLegacyDb();
    runMigrations(db);
    runMigrations(db);
    const count = (db.prepare('SELECT COUNT(*) as n FROM attachments WHERE idea_id=?').get('i1') as { n: number }).n;
    expect(count).toBe(1);
  });
});
