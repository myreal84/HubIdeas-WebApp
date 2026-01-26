import { prisma } from "../prisma";

function normalizeEmail(email: string | null | undefined) {
    return email?.toLowerCase().trim().replace("@googlemail.com", "@gmail.com");
}

export async function migrateOrphanedProjects(adminEmail: string) {
    if (!adminEmail) return;

    // We search for all potential variations in the database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = await (prisma as any).user.findMany();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = users.find((u: any) => normalizeEmail(u.email) === normalizeEmail(adminEmail));

    if (!admin) {
        console.log(`[Migration] Admin user ${adminEmail} (or variants) not found yet. Skipping migration.`);
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orphans = await (prisma as any).project.count({
        where: { ownerId: null }
    });

    if (orphans > 0) {
        console.log(`[Migration] Found ${orphans} orphaned projects. Assigning to admin user ${admin.email}...`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).project.updateMany({
            where: { ownerId: null },
            data: { ownerId: admin.id }
        });
        console.log(`[Migration] Successfully assigned ${orphans} projects.`);
    }
}
