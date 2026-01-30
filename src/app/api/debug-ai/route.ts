import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from 'next/server';

import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

function getGoogleProvider() {
    const rawApiKey = process.env.GOOGLE_GENERATION_AI_API_KEY;
    if (!rawApiKey) throw new Error('GOOGLE_GENERATION_AI_API_KEY is missing');
    const cleanedKey = rawApiKey.replace(/^["']|["']$/g, '').trim();
    return createGoogleGenerativeAI({ apiKey: cleanedKey });
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.email || session.user.email !== process.env.INITIAL_ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Unauthorized Debug Access' }, { status: 401 });
    }

    try {
        const googleProvider = getGoogleProvider();
        const result = await streamText({
            model: googleProvider('gemini-2.0-flash-lite'),
            messages: [{ role: 'user', content: 'Hello' }],
        });

        const keys = Object.keys(result);
        const prototypeKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(result));

        let toUIMessageStreamResponseExists = false;

        try {
            if ((result as any).toUIMessageStreamResponse) {
                toUIMessageStreamResponseExists = true;
            }
        } catch (e) {
            // ignore
        }

        return NextResponse.json({
            status: 'success',
            keys,
            prototypeKeys,
            toUIMessageStreamResponseExists,
            resultType: typeof result,
            constructorName: result.constructor.name
        });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            message: (error as Error).message,
            stack: (error as Error).stack
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email || session.user.email !== process.env.INITIAL_ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Unauthorized Debug Access' }, { status: 401 });
    }

    try {
        const body = await req.json();
        console.log('Local Debug Received Body:', body);

        const googleProvider = getGoogleProvider();
        const result = await streamText({
            model: googleProvider('gemini-2.0-flash-lite'),
            messages: [{ role: 'user', content: 'Say hello' }],
        });

        // Manual Data Stream Response implementation
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                for await (const chunk of result.textStream) {
                    controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
                }
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Vercel-AI-Data-Stream': 'v1'
            }
        });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
