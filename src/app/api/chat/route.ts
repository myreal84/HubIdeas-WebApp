import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { checkAndResetAiLimit, recordAiUsage } from '@/lib/ai-limits';

const DEFAULT_MODEL = 'gemini-2.0-flash-lite';

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
        const body = await req.json();
        console.log('Creates Debug: Received Body:', JSON.stringify(body, null, 2));
        const { messages, projectContext, mode, referencedContext } = body;

        // Log API Key presence (safe)
        const rawApiKey = process.env.GOOGLE_GENERATION_AI_API_KEY;
        console.log(`[API] Google Key present: ${!!rawApiKey}, Length: ${rawApiKey?.length || 0}, Preview: ${rawApiKey ? rawApiKey.substring(0, 5) + '...' : 'N/A'}`);

        if (!projectContext) {
            console.error('Creates Debug: projectContext is missing in body!');
            return NextResponse.json({ error: 'projectContext is required' }, { status: 400 });
        }

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
                const totalTokens = event.usage?.totalTokens || 0;
                if (totalTokens > 0) {
                    const userId = session.user!.id!;
                    await recordAiUsage(userId, totalTokens);
                }
            }
        });

        // Result found, process the stream
        // Try modern SDK response helpers first (they might be on the prototype)
        const res = result as any;
        if (typeof res.toUIMessageStreamResponse === 'function') {
            console.log('✅ Using toUIMessageStreamResponse');
            return res.toUIMessageStreamResponse();
        }

        if (typeof res.toDataStreamResponse === 'function') {
            console.log('✅ Using toDataStreamResponse');
            return res.toDataStreamResponse();
        }

        if (typeof res.toTextStreamResponse === 'function') {
            console.log('⚠️ toData/UI missing, using toTextStreamResponse');
            return res.toTextStreamResponse();
        }

        console.log('❌ All SDK response helpers missing! Falling back to manual Data Stream Protocol.');

        // Manual Data Stream protocol for text-only stream
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of result.textStream) {
                        // 0: is the part type for text in Data Stream Protocol v1
                        const part = `0:${JSON.stringify(chunk)}\n`;
                        controller.enqueue(encoder.encode(part));
                    }
                } catch (streamError) {
                    console.error('❌ Error during manual stream iteration:', streamError);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Vercel-AI-Data-Stream': 'v1'
            }
        });
    } catch (error) {
        console.error('❌ Chat API Error:', error);
        return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
    }
}
