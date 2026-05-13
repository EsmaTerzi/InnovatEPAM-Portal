import { v4 as uuidv4 } from 'uuid';
import getDb from '../client';

export interface EvaluationComment {
  id: string;
  idea_id: string;
  admin_id: string;
  comment_text: string;
  created_at: string;
}

export function createComment(
  ideaId: string,
  adminId: string,
  commentText: string
): EvaluationComment {
  const db = getDb();
  const id = uuidv4();

  db.prepare(
    `INSERT INTO evaluation_comments (id, idea_id, admin_id, comment_text)
     VALUES (?, ?, ?, ?)`
  ).run(id, ideaId, adminId, commentText);

  return findCommentByIdeaId(ideaId) as EvaluationComment;
}

export function findCommentByIdeaId(ideaId: string): EvaluationComment | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM evaluation_comments WHERE idea_id = ?')
    .get(ideaId) as EvaluationComment | undefined;
}
