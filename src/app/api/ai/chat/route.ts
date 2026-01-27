import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { checkAndResetAiLimit, recordAiUsage } from '@/lib/ai-limits';

const DEFAULT_MODEL = 'gemini-2.0-flash-lite-preview-02-05';

function getGoogleProvider() {
    const rawApiKey = process.env.GOOGLE_GENERATION_AI_API_KEY;
    if (!rawApiKey) throw new Error('GOOGLE_GENERATION_AI_API_KEY is missing');
    const cleanedKey = rawApiKey.replace(/^["']|["']$/g, '').trim();
    return createGoogleGenerativeAI({ apiKey: cleanedKey });
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { messages, projectContext, mode, referencedContext } = await req.json();
        const { title, notes, todos } = projectContext;

        // Check AI Limit
        const { canUse } = await checkAndResetAiLimit(session.user.id);
        if (!canUse) {
            return NextResponse.json({
                error: 'AI Limit reached',
                message: 'Du hast dein monatliches Token-Limit erreicht. Bitte kontaktiere einen Admin.'
            }, { status: 429 });
        }

        const googleProvider = getGoogleProvider();

        let systemPrompt = '';

        if (mode === 'todo') {
            systemPrompt = `Du bist ein spezialisierter Aufgaben-Planer für das Projekt "${title}".
Deine Aufgabe ist es, basierend auf der Nutzeranfrage und dem Kontext konkret umsetzbare To-Dos zu generieren.

KONTEXT DES PROJEKTS:
Titel: ${title}
${notes.length > 0 ? `Notizen:\n- ${notes.join('\n- ')}` : 'Keine Notizen vorhanden.'}
${todos.length > 0 ? `Bestehende Aufgaben:\n- ${todos.map((t: { content: string }) => t.content).join('\n- ')}` : 'Keine Aufgaben vorhanden.'}

${referencedContext && referencedContext.length > 0 ? `SPEZIELLER KONTEXT (Vom Nutzer ausgewählt):\n${referencedContext.map((item: { type: string, title: string, content: string }) => `${item.type.toUpperCase()}: ${item.title}\nInhalt: ${item.content}`).join('\n\n')}` : ''}

REGELN FÜR TO-DO GENERATION:
1. Antworte mit einer SEHR KURZEN Einleitung (maximal 2 Sätze).
2. Die Aufgaben selbst müssen AUSSCHLIESSLICH im JSON-Array stehen.
3. **WICHTIG**: Erstelle KEINE Listen im Markdown-Format (z.B. mit Aufzählungspunkten oder Nummern) im Textteil.
4. Beispiel für das JSON-Array: ["Aufgabe 1", "Aufgabe 2"]
5. Formuliere die Aufgaben kurz, präzise und aktionsorientiert.
6. Antworte am Ende NUR noch mit dem JSON-Array, kein Text danach.`;
        } else {
            systemPrompt = `Du bist ein erfahrener Sparringspartner und Kollege für das Projekt "${title}".
Deine Rolle ist es, Ideen zu reflektieren, Impulse zu geben und dem Nutzer zu helfen, sein Projekt voranzubringen.

KONTEXT DES PROJEKTS:
Titel: ${title}
${notes.length > 0 ? `Notizen:\n- ${notes.join('\n- ')}` : 'Keine Notizen vorhanden.'}
${todos.length > 0 ? `Offene Aufgaben:\n- ${todos.filter((t: { isCompleted: boolean }) => !t.isCompleted).map((t: { content: string }) => t.content).join('\n- ')}` : 'Keine offenen Aufgaben.'}

${referencedContext && referencedContext.length > 0 ? `ZUSÄTZLICHER KONTEXT (Beziehe dich primär darauf):\n${referencedContext.map((item: { type: string, title: string, content: string }) => `${item.type.toUpperCase()}: ${item.title}\nInhalt: ${item.content}`).join('\n\n')}` : ''}

WICHTIG FÜR DEN DIALOG:
- Antworte wie in einer guten Unterhaltung: Kompetent, direkt und ohne unnötige Floskeln.
- Nutze Markdown (Fettdruck, Listen) sinnvoll, um deine Antworten zu strukturieren.
- **WICHTIG**: Sende NIEMALS eine Antwort, die nur aus einem JSON-Array (z.B. ["Aufgabe 1", ...]) besteht. Nutze stattdessen normale Markdown-Aufzählungszeichen.
- Vermeide rein dekorative Sonderzeichen-Ketten. Nutze Formatierung nur dort, wo sie dem Verständnis dient.
- Sei konstruktiv-kritisch, wenn nötig, und bringe eigene Ideen ein.
- Antworte auf Deutsch und halte dich kompakt.`;
        }

        const result = await streamText({
            model: googleProvider(DEFAULT_MODEL),
            system: systemPrompt,
            messages,
            onFinish: async (event) => {
                if (event.usage.totalTokens > 0) {
                    const userId = session.user!.id!;
                    await recordAiUsage(userId, event.usage.totalTokens);
                }
            }
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('❌ Chat API Error:', error);
        return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
    }
}
