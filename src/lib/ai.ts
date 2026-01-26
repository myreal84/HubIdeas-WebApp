import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

/**
 * AI Service for HubIdeas
 * This service handles communication with the LLM (Gemini by default).
 */

const DEFAULT_MODEL = 'gemini-2.0-flash-lite-preview-02-05';

function getGoogleProvider() {
    const rawApiKey = process.env.GOOGLE_GENERATION_AI_API_KEY;
    if (!rawApiKey) throw new Error('GOOGLE_GENERATION_AI_API_KEY is missing');
    const cleanedKey = rawApiKey.replace(/^["']|["']$/g, '').trim();
    return createGoogleGenerativeAI({ apiKey: cleanedKey });
}

/**
 * Generates 3 concrete To-Dos for a given project idea.
 */
export async function generateSuggestedTodos(title: string, note?: string) {
    try {
        const googleProvider = getGoogleProvider();

        const { object, usage } = await generateObject({
            model: googleProvider(DEFAULT_MODEL),
            schema: z.object({
                suggestions: z.array(z.string()).length(3)
            }),
            prompt: `Du bist ein Produkt-Experte. Generiere 3 kurze, konkrete und handlungsorientierte To-Dos für diese Projektidee: "${title}".
                    ${note ? `Der Nutzer hat dazu folgende Gedanken notiert: "${note}". Berücksichtige diese bei den Vorschlägen.` : ''}
                    Antworte nur mit den 3 To-Dos in einer Liste.`,
        });

        return {
            suggestions: (object as { suggestions: string[] }).suggestions,
            tokens: usage.totalTokens
        };
    } catch (error) {
        console.error('❌ AI Suggestion Error:', error);
        return { suggestions: [], tokens: 0 };
    }
}

/**
 * Generates a short, motivating one-sentence message for resurfacing a project.
 */
export async function generateResurfacingMessage(title: string, notes: string[]) {
    try {
        const googleProvider = getGoogleProvider();

        const { text, usage } = await generateText({
            model: googleProvider(DEFAULT_MODEL),
            prompt: `Projekt: "${title}"
                    ${notes.length > 0 ? `Notizen dazu: ${notes.join('; ')}` : ''}

                    Schreibe eine sehr kurze, motivierende, einzeilige Nachricht (max. 1 Satz), die den Nutzer einlädt, an diesem Projekt weiterzumachen. Sei locker, kein Druck. Antworte NUR mit der Nachricht.`,
        });

        return {
            text: text.trim(),
            tokens: usage.totalTokens
        };
    } catch (error) {
        console.error('❌ AI Resurfacing Error:', error);
        throw error; // Let caller handle fallback
    }
}
/**
 * A simple test function to verify the AI connection.
 * Logs the response to the console.
 */
export async function testAIService(modelName: string = DEFAULT_MODEL) {
    const rawApiKey = process.env.GOOGLE_GENERATION_AI_API_KEY;

    if (!rawApiKey) {
        console.warn('⚠️ AI Service: GOOGLE_GENERATION_AI_API_KEY is missing.');
        return 'No API key set.';
    }

    // Clean the key (remove quotes and whitespace)
    const cleanedKey = rawApiKey.replace(/^["']|["']$/g, '').trim();

    // Debug logging (masked)
    const maskedKey = cleanedKey === 'dein-api-key-hier'
        ? '[STILL PLACEHOLDER]'
        : cleanedKey.substring(0, 4) + '...' + cleanedKey.substring(cleanedKey.length - 4);

    console.log(`🤖 AI Service: Key detected: ${maskedKey} (Length: ${cleanedKey.length})`);
    console.log(`🤖 AI Service: Using model: ${modelName}`);

    if (cleanedKey === 'dein-api-key-hier' || cleanedKey === '') {
        console.warn('⚠️ AI Service: Placeholder or empty key detected.');
        return 'No API key set.';
    }

    try {
        console.log(`🤖 AI Service: Sending test request for ${modelName}...`);
        const googleProvider = createGoogleGenerativeAI({
            apiKey: cleanedKey,
        });

        const { text } = await generateText({
            model: googleProvider(modelName),
            prompt: 'Hallo! Wer bist du? Antworte kurz in einem Satz auf Deutsch.',
        });

        console.log('✅ AI Service Response:', text);
        return text;
    } catch (error) {
        const errorDetails = error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
        } : { message: String(error) };

        console.error('❌ AI Service Error Details:', errorDetails);
        throw error;
    }
}
