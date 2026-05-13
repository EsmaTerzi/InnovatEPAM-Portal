import { v4 as uuidv4 } from 'uuid';
import getDb from '../client';

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
}

export function createSession(userId: string, expiresAt: Date): Session {
  const db = getDb();
  const id = uuidv4();
  const expiresAtIso = expiresAt.toISOString();

  db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).run(id, userId, expiresAtIso);

  return { id, user_id: userId, expires_at: expiresAtIso };
}

export function findSession(token: string): Session | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(token) as Session | undefined;
}

export function deleteSession(token: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
}

export function deleteExpiredSessions(): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}
