import { NextResponse } from 'next/server';
import { generateSuggestedTodos } from '@/lib/ai';
import { auth } from '@/auth';
import { checkAndResetAiLimit, recordAiUsage } from '@/lib/ai-limits';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, note } = await req.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Check AI Limit
        const { canUse } = await checkAndResetAiLimit(session.user.id);
        if (!canUse) {
            return NextResponse.json({
                error: 'AI Limit reached',
                message: 'Du hast dein monatliches Token-Limit erreicht. Bitte kontaktiere einen Admin.'
            }, { status: 429 });
        }

        const { suggestions, tokens } = await generateSuggestedTodos(title, note);

        // Record usage
        if (tokens > 0) {
            await recordAiUsage(session.user.id, tokens);
        }

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('❌ Suggestion API Error:', error);
        return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
    }
}
