export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { migrateOrphanedProjects } = await import('./lib/db/migrate-orphans');
        const adminEmail = process.env.INITIAL_ADMIN_EMAIL;

        if (adminEmail) {
            console.log(`[Startup] Running migration for admin: ${adminEmail}`);
            await migrateOrphanedProjects(adminEmail);
        } else {
            console.warn('[Startup] INITIAL_ADMIN_EMAIL not set. Migration skipped.');
        }
    }
}
