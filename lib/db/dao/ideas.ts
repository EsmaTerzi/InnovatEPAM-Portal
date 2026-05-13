import { v4 as uuidv4 } from 'uuid';
import getDb from '../client';

export type IdeaCategory =
  | 'Process Improvement'
  | 'Technology'
  | 'Customer Experience'
  | 'Other';

export type IdeaStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  attachment_path: string | null;
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIdeaData {
  title: string;
  description: string;
  category: IdeaCategory;
  submitted_by: string;
  attachment_path?: string | null;
}

export function createIdea(data: CreateIdeaData): Idea {
  const db = getDb();
  const id = uuidv4();

  db.prepare(
    `INSERT INTO ideas (id, title, description, category, submitted_by, attachment_path)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.title,
    data.description,
    data.category,
    data.submitted_by,
    data.attachment_path ?? null
  );

  return findIdeaById(id) as Idea;
}

export function findIdeasByUser(userId: string): Idea[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM ideas WHERE submitted_by = ? ORDER BY created_at DESC')
    .all(userId) as Idea[];
}

export function findAllIdeas(): Idea[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM ideas ORDER BY created_at DESC')
    .all() as Idea[];
}

export function findIdeaById(id: string): Idea | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM ideas WHERE id = ?')
    .get(id) as Idea | undefined;
}

export function updateIdeaStatus(id: string, status: IdeaStatus): void {
  const db = getDb();
  db.prepare(
    `UPDATE ideas SET status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(status, id);
}
