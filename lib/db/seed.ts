import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import getDb from './client';
import { runMigrations } from './schema';

export async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing required environment variables: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env.local'
    );
  }

  runMigrations();

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');

  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = uuidv4();

  db.prepare(
    'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(id, email, passwordHash, 'admin');

  console.log(`Admin seeded: ${email}`);
}
