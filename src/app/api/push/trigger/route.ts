import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { webpush } from '@/lib/push';
import { generateResurfacingMessage } from '@/lib/ai';
import { checkAndResetAiLimit, recordAiUsage } from '@/lib/ai-limits';

const FALLBACK_MESSAGES = [
    'Lange nicht gesehen: [Projektname]',
    'Hier schlummert noch eine Idee: [Projektname]',
    'Lust, hier weiterzumachen? [Projektname]',
    'Zeit für einen kurzen Blick auf: [Projektname]'
];

export async function GET(req: Request) {
    try {
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

        // Fetch notes and owner for the selected project
        const projectWithDetails = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                notes: true,
                owner: true // We need the owner to heck limits
            }
        });

        const notes = projectWithDetails?.notes.map(n => n.content) || [];
        let bodyText = '';
        let usedAi = false;

        // --- AI / Fallback Logic ---
        if (projectWithDetails?.ownerId) {
            const { canUse } = await checkAndResetAiLimit(projectWithDetails.ownerId);

            if (canUse) {
                try {
                    const { text, tokens } = await generateResurfacingMessage(project.name, notes);
                    bodyText = text;
                    if (tokens > 0) {
                        await recordAiUsage(projectWithDetails.ownerId, tokens);
                        usedAi = true;
                    }
                } catch (err) {
                    console.warn('⚠️ AI Resurfacing failed, using fallback.', err);
                    // Fallback will be set below
                }
            }
        }

        // If no text generated (Limit reached or AI failed), use fallback
        if (!bodyText) {
            const template = FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
            bodyText = template.replace('[Projektname]', project.name);
        }

        // Get all subscriptions
        const subscriptions = await prisma.pushSubscription.findMany();

        const notificationPayload = JSON.stringify({
            title: 'HubIdeas 👋',
            body: bodyText,
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
            projectName: project.name,
            aiUsed: usedAi
        });

    } catch (error) {
        console.error('Error triggering push:', error);
        return NextResponse.json({ error: 'Failed to trigger notifications' }, { status: 500 });
    }
}
