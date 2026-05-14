import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import getDb from '../client';

export interface IdeaMetadata {
  id: string;
  idea_id: string;
  field_key: string;
  field_val: string;
}

export type MetadataEntry = Pick<IdeaMetadata, 'field_key' | 'field_val'>;

/**
 * Bulk-inserts category-specific field answers for an idea.
 * Skips entries where the value is empty after trimming.
 * Values are trimmed and capped at 1000 characters before persistence.
 *
 * @param ideaId  - The parent idea UUID
 * @param entries - Map of field_key → raw value
 * @param db      - Optional caller-provided DB connection (for transactions)
 */
export function createMetadataEntries(
  ideaId: string,
  entries: Record<string, string>,
  db?: Database.Database,
): void {
  const database = db ?? getDb();
  const stmt = database.prepare(
    `INSERT INTO idea_metadata (id, idea_id, field_key, field_val)
     VALUES (?, ?, ?, ?)`,
  );

  for (const [key, rawVal] of Object.entries(entries)) {
    const val = rawVal.trim().slice(0, 1000);
    if (!val) continue;
    stmt.run(uuidv4(), ideaId, key, val);
  }
}

/**
 * Returns all metadata entries for an idea, ordered by field_key.
 * Returns an empty array for legacy ideas that have no metadata rows.
 *
 * @param ideaId - The idea UUID
 */
export function findMetadataByIdeaId(ideaId: string): MetadataEntry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT field_key, field_val FROM idea_metadata
       WHERE idea_id = ?
       ORDER BY field_key ASC`,
    )
    .all(ideaId) as MetadataEntry[];
}
