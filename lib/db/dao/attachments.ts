import { v4 as uuidv4 } from 'uuid';
import getDb from '../client';

export interface Attachment {
  id: string;
  idea_id: string;
  original_name: string;
  stored_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export type AttachmentResponse = Omit<Attachment, 'idea_id'>;

export interface AttachmentInsert {
  original_name: string;
  stored_path: string;
  mime_type: string;
  size_bytes: number;
}

export function createAttachments(ideaId: string, files: AttachmentInsert[]): void {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO attachments (id, idea_id, original_name, stored_path, mime_type, size_bytes)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const file of files) {
    stmt.run(uuidv4(), ideaId, file.original_name, file.stored_path, file.mime_type, file.size_bytes);
  }
}

export function findAttachmentsByIdeaId(ideaId: string): AttachmentResponse[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, original_name, stored_path, mime_type, size_bytes, created_at
       FROM attachments
       WHERE idea_id = ?
       ORDER BY created_at ASC`,
    )
    .all(ideaId) as AttachmentResponse[];
}
