import { runMigrations } from './lib/db/schema';
import { seedAdmin } from './lib/db/seed';

export async function register() {
  runMigrations();
  await seedAdmin();
}
