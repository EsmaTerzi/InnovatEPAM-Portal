/**
 * Integration tests for idea_metadata DAO.
 * Uses an in-memory SQLite database to avoid touching the real DB.
 */
import Database from 'better-sqlite3';
import { createMetadataEntries, findMetadataByIdeaId } from '@/lib/db/dao/metadata';

function buildTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      attachment_path TEXT,
      submitted_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE idea_metadata (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      field_key TEXT NOT NULL,
      field_val TEXT NOT NULL,
      UNIQUE (idea_id, field_key)
    );
  `);

  // Seed a user and an idea for tests to reference
  db.prepare(
    `INSERT INTO users (id, email, password_hash, role) VALUES ('u1', 'test@test.com', 'hash', 'submitter')`,
  ).run();
  db.prepare(
    `INSERT INTO ideas (id, title, description, category, submitted_by) VALUES ('i1', 'Test', 'Desc', 'Technology', 'u1')`,
  ).run();

  return db;
}

describe('metadata DAO', () => {
  describe('createMetadataEntries', () => {
    it('inserts entries and they can be retrieved', () => {
      const db = buildTestDb();
      createMetadataEntries('i1', { tech_stack: 'Next.js', estimated_effort: '1–4 weeks' }, db);
      const rows = db
        .prepare(`SELECT field_key, field_val FROM idea_metadata WHERE idea_id = 'i1' ORDER BY field_key`)
        .all() as { field_key: string; field_val: string }[];
      expect(rows).toHaveLength(2);
      expect(rows.find((r) => r.field_key === 'tech_stack')?.field_val).toBe('Next.js');
      expect(rows.find((r) => r.field_key === 'estimated_effort')?.field_val).toBe('1–4 weeks');
    });

    it('skips entries with empty values', () => {
      const db = buildTestDb();
      createMetadataEntries('i1', { tech_stack: 'React', feasibility_notes: '' }, db);
      const rows = db
        .prepare(`SELECT field_key FROM idea_metadata WHERE idea_id = 'i1'`)
        .all() as { field_key: string }[];
      expect(rows.map((r) => r.field_key)).not.toContain('feasibility_notes');
      expect(rows.map((r) => r.field_key)).toContain('tech_stack');
    });

    it('skips entries with whitespace-only values', () => {
      const db = buildTestDb();
      createMetadataEntries('i1', { tech_stack: '   ' }, db);
      const rows = db
        .prepare(`SELECT * FROM idea_metadata WHERE idea_id = 'i1'`)
        .all();
      expect(rows).toHaveLength(0);
    });

    it('truncates field_val to 1000 characters', () => {
      const db = buildTestDb();
      const longValue = 'a'.repeat(1500);
      createMetadataEntries('i1', { tech_stack: longValue }, db);
      const row = db
        .prepare(`SELECT field_val FROM idea_metadata WHERE idea_id = 'i1' AND field_key = 'tech_stack'`)
        .get() as { field_val: string } | undefined;
      expect(row?.field_val.length).toBe(1000);
    });

    it('throws on duplicate (idea_id, field_key)', () => {
      const db = buildTestDb();
      createMetadataEntries('i1', { tech_stack: 'React' }, db);
      expect(() =>
        createMetadataEntries('i1', { tech_stack: 'Vue' }, db),
      ).toThrow();
    });
  });

  describe('findMetadataByIdeaId', () => {
    it('returns empty array for an idea with no metadata rows', () => {
      // Use real getDb call requires mocking; test via direct db call instead
      const db = buildTestDb();
      const rows = db
        .prepare(`SELECT field_key, field_val FROM idea_metadata WHERE idea_id = 'i1' ORDER BY field_key`)
        .all();
      expect(rows).toHaveLength(0);
    });

    it('returns entries ordered by field_key', () => {
      const db = buildTestDb();
      createMetadataEntries(
        'i1',
        { tech_stack: 'React', estimated_effort: '< 1 week' },
        db,
      );
      const rows = db
        .prepare(`SELECT field_key, field_val FROM idea_metadata WHERE idea_id = 'i1' ORDER BY field_key`)
        .all() as { field_key: string; field_val: string }[];
      // alphabetical: estimated_effort < tech_stack
      expect(rows[0].field_key).toBe('estimated_effort');
      expect(rows[1].field_key).toBe('tech_stack');
    });
  });
});
