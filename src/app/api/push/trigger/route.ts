import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { webpush } from '@/lib/push';
import { generateResurfacingMessage } from '@/lib/ai';

export async function GET(req: Request) {
    try {
        // Basic security check via query param
        // Basic security check via query param
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret');
        const force = searchParams.get('force') === 'true';

        if (secret !== process.env.AUTH_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Randomization Check: Average every 4.5 days (approx 22% chance if run daily)
        // Unless 'force=true' is provided
        if (!force && Math.random() > 0.22) {
            return NextResponse.json({ success: true, skipped: true, reason: 'Random skip' });
        }

        // Project Resurfacing Criteria:
        // 1. Not archived
        // 2. lastOpenedAt > 21 days ago
        // 3. lastRemindedAt > 14 days ago (or never reminded)
        const twentyOneDaysAgo = new Date();
        twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const candidates = await prisma.project.findMany({
            where: {
                isArchived: false,
                lastOpenedAt: {
                    lt: twentyOneDaysAgo
                },
                OR: [
                    { lastRemindedAt: null },
                    { lastRemindedAt: { lt: fourteenDaysAgo } }
                ]
            }
        });

        if (candidates.length === 0) {
            return NextResponse.json({ message: 'No candidate projects found for resurfacing' });
        }

        // Pick exactly ONE random project
        const project = candidates[Math.floor(Math.random() * candidates.length)];

        // Fetch notes for the selected project to provide context to the AI
        const projectWithNotes = await prisma.project.findUnique({
            where: { id: project.id },
            include: { notes: true }
        });

        const notes = projectWithNotes?.notes.map(n => n.content) || [];

        // Generate AI resurfacing message
        const aiMessage = await generateResurfacingMessage(project.name, notes);

        // Get all subscriptions
        const subscriptions = await prisma.pushSubscription.findMany();

        const notificationPayload = JSON.stringify({
            title: 'HubIdeas 👋',
            body: aiMessage,
            url: `/project/${project.id}`
        });

        // Send notifications
        const results = await Promise.allSettled(
            subscriptions.map((sub) =>
                webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    },
                    notificationPayload
                ).catch(async (err: unknown) => {
                    if (err && typeof err === 'object' && 'statusCode' in err) {
                        const statusCode = (err as { statusCode: number }).statusCode;
                        if (statusCode === 410 || statusCode === 404) {
                            await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
                        }
                    }
                    throw err;
                })
            )
        );

        // Update lastRemindedAt for the project
        await prisma.project.update({
            where: { id: project.id },
            data: { lastRemindedAt: new Date() }
        });

        return NextResponse.json({
            success: true,
            sentTo: results.filter((r) => r.status === 'fulfilled').length,
            projectName: project.name
        });

    } catch (error) {
        console.error('Error triggering push:', error);
        return NextResponse.json({ error: 'Failed to trigger notifications' }, { status: 500 });
    }
}
