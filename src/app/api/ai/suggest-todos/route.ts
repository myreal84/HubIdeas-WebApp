import { NextResponse } from 'next/server';
import { generateSuggestedTodos } from '@/lib/ai';
import { auth } from '@/auth';

export async function POST(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, note } = await req.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const suggestions = await generateSuggestedTodos(title, note);

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('❌ Suggestion API Error:', error);
        return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
    }
}
