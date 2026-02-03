import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { checkAndResetAiLimit, recordAiUsage } from '@/lib/ai-limits';
import { prisma } from '@/lib/prisma';
import { decryptBuffer } from '@/lib/encryption';
import { extractTextFromFile } from '@/lib/file-processing';
import * as fs from 'fs';
import * as path from 'path';

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
        const { projectContext, mode, referencedContext, includeCompleted } = body;
        let { messages } = body;

        // Sanitize messages: Remove empty messages to prevent API errors (e.g. from previous failed turns)
        if (Array.isArray(messages)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages = messages.filter((m: any) => {
                if (!m.content) return false;
                if (typeof m.content === 'string' && m.content.trim() === '') return false;
                if (Array.isArray(m.content) && m.content.length === 0) return false;
                return true;
            });
        }

        if (!projectContext) {
            return NextResponse.json({ error: 'projectContext is required' }, { status: 400 });
        }

        const { id: projectId, title, notes, todos } = projectContext;

        // Check AI Limit
        const { canUse } = await checkAndResetAiLimit(session.user.id);
        if (!canUse) {
            return NextResponse.json({
                error: 'AI Limit reached',
                message: 'Du hast dein monatliches Token-Limit erreicht. Bitte kontaktiere einen Admin.'
            }, { status: 429 });
        }

        // Fetch and process files if projectId exists
        let contextParts: any[] = []; // Using any[] to allow flexible CoreMessage parts

        if (projectId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const files = await (prisma as any).projectFile.findMany({
                where: { projectId },
                orderBy: { createdAt: 'desc' }
            });

            if (files.length > 0) {
                console.log(`Found ${files.length} files for project ${projectId}`);

                for (const file of files) {
                    try {
                        if (!file.content) {
                            console.warn(`File ${file.name} has no content.`);
                            continue;
                        }

                        // Decrypt
                        const decryptedBuffer = decryptBuffer(file.content, file.iv);

                        if (file.type.startsWith('image/')) {
                            console.log(`Processing image: ${file.name} (${file.type})`);
                            // Convert to Base64
                            const base64Image = decryptedBuffer.toString('base64');
                            contextParts.push({
                                type: 'image',
                                image: base64Image,
                                mimeType: file.type // Pass mimeType for clarity
                            });
                            // Add a label for the image
                            contextParts.push({
                                type: 'text',
                                text: `[Bildanhang: ${file.name}]`
                            });
                        } else {
                            console.log(`Processing text/safe file: ${file.name} (${file.type})`);
                            // Extract Text
                            const text = await extractTextFromFile(decryptedBuffer, file.type, file.name);
                            contextParts.push({
                                type: 'text',
                                text: text
                            });
                        }
                    } catch (e) {
                        console.error(`Error processing file ${file.name}:`, e);
                        contextParts.push({
                            type: 'text',
                            text: `[Fehler beim Verarbeiten der Datei ${file.name}: ${(e as Error).message}]`
                        });
                    }
                }
            }
        }

        // Inject File Context into Messages
        if (contextParts.length > 0) {
            console.log('Injecting file context into conversation.');
            // Prepend explanation
            contextParts.unshift({
                type: 'text',
                text: 'DATEIANHÄNGE (Die folgenden Inhalte gehören zum Projektkontext):'
            });

            // Merge into the last user message to avoid multiple User messages in a row (Gemini strictness)
            const lastMsg = messages[messages.length - 1];

            if (lastMsg && lastMsg.role === 'user') {
                const originalContent = lastMsg.content;
                let newContent = [...contextParts];

                if (typeof originalContent === 'string') {
                    newContent.push({ type: 'text', text: originalContent });
                } else if (Array.isArray(originalContent)) {
                    newContent.push(...originalContent);
                }

                lastMsg.content = newContent;
            } else {
                // Fallback if no user message found (e.g. empty history?)
                messages.unshift({
                    role: 'user',
                    content: contextParts
                });
            }
        }

        const googleProvider = getGoogleProvider();

        let systemPrompt = '';

        if (mode === 'todo') {
            systemPrompt = `Du bist ein spezialisierter Aufgaben-Planer für das Projekt "${title}".
Deine Aufgabe ist es, basierend auf der Nutzeranfrage und dem Kontext konkret umsetzbare To-Dos zu generieren.

KONTEXT DES PROJEKTS:
Titel: ${title}
${notes.length > 0 ? `Notizen:\n- ${notes.join('\n- ')}` : 'Keine Notizen vorhanden.'}
${todos.length > 0 ? `Bestehende Aufgaben:\n- ${todos
                    .filter((t: { isCompleted: boolean }) => includeCompleted ? true : !t.isCompleted)
                    .map((t: { content: string, isCompleted: boolean }) => `${t.isCompleted ? '[ERLEDIGT] ' : ''}${t.content}`)
                    .join('\n- ')}` : 'Keine Aufgaben vorhanden.'}

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
${todos.length > 0 ? `${includeCompleted ? 'Alle Aufgaben' : 'Offene Aufgaben'}:\n- ${todos
                    .filter((t: { isCompleted: boolean }) => includeCompleted ? true : !t.isCompleted)
                    .map((t: { content: string, isCompleted: boolean }) => `${t.isCompleted ? '[ERLEDIGT] ' : ''}${t.content}`)
                    .join('\n- ')}` : 'Keine Aufgaben.'}

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
