export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./lib/db/schema');
    const { seedAdmin } = await import('./lib/db/seed');
    runMigrations();
    await seedAdmin();
  }
}
