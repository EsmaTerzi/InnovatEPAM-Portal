import { v4 as uuidv4 } from 'uuid';
import getDb from '../client';

export type UserRole = 'submitter' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
}

export function createUser(
  email: string,
  passwordHash: string,
  role: UserRole
): User {
  const db = getDb();
  const id = uuidv4();

  db.prepare(
    'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(id, email, passwordHash, role);

  return findUserById(id) as User;
}

export function findUserByEmail(email: string): User | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email) as User | undefined;
}

export function findUserById(id: string): User | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(id) as User | undefined;
}
