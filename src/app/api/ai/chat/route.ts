import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const DEFAULT_MODEL = 'gemini-2.0-flash-lite-preview-02-05';

function getGoogleProvider() {
    const rawApiKey = process.env.GOOGLE_GENERATION_AI_API_KEY;
    if (!rawApiKey) throw new Error('GOOGLE_GENERATION_AI_API_KEY is missing');
    const cleanedKey = rawApiKey.replace(/^["']|["']$/g, '').trim();
    return createGoogleGenerativeAI({ apiKey: cleanedKey });
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { messages, projectContext } = await req.json();
        const { title, notes, todos } = projectContext;

        const googleProvider = getGoogleProvider();

        const systemPrompt = `Du bist ein hilfreicher KI-Assistent für das Projekt "${title}".
Hilf dem Nutzer, Ideen zu entwickeln, To-Dos zu formulieren oder Fragen zum Projekt zu beantworten.

KONTEXT DES PROJEKTS:
Titel: ${title}
${notes.length > 0 ? `Notizen:\n- ${notes.join('\n- ')}` : 'Keine Notizen vorhanden.'}
${todos.length > 0 ? `Offene Aufgaben:\n- ${todos.filter((t: { isCompleted: boolean }) => !t.isCompleted).map((t: { content: string }) => t.content).join('\n- ')}` : 'Keine offenen Aufgaben.'}

WICHTIG:
- Sei präzise und motivierend.
- Wenn du Aufgaben vorschlägst, verwende Bulletpoints (z.B. "- Aufgabe 1"). Das System erkennt diese und bietet dem Nutzer an, sie direkt zu speichern.
- Antworte auf Deutsch.
- Halte die Antworten kompakt und fokussiert auf das Projekt.`;

        const result = await streamText({
            model: googleProvider(DEFAULT_MODEL),
            system: systemPrompt,
            messages,
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('❌ Chat API Error:', error);
        return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
    }
}
