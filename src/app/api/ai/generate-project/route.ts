
import { auth } from '@/auth';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkAndResetAiLimit, recordAiUsage } from '@/lib/ai-limits';

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
        const { messages, saveHistory } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
        }

        // Check AI Limit
        const { canUse } = await checkAndResetAiLimit(session.user.id);
        if (!canUse) {
            return NextResponse.json({ error: 'AI Limit reached' }, { status: 429 });
        }

        const googleProvider = getGoogleProvider();

        // Generate Project Structure
        const { object: projectData, usage } = await generateObject({
            model: googleProvider('gemini-2.0-flash-lite'),
            schema: z.object({
                title: z.string().describe('A concise, catchy title for the project.'),
                note: z.string().describe('A detailed summary of the project idea based on the conversation.'),
                todos: z.array(z.string()).describe('A list of immediate, actionable steps to get started.')
            }),
            system: 'You are an expert project manager. Analyze the conversation history and extract a structured project plan. The title should be short. The note should capture the essence. The todos should be concrete next steps.',
            messages: messages
        });

        // Record Usage
        if (usage) {
            await recordAiUsage(session.user.id, usage.totalTokens || 0);
        }

        // Create Project in DB
        const project = await prisma.project.create({
            data: {
                name: projectData.title,
                notes: {
                    create: {
                        content: projectData.note,
                        order: 0
                    }
                },
                ownerId: session.user.id,
                todos: {
                    create: projectData.todos.map(content => ({
                        content,
                        isCompleted: false,
                        order: 0 // Default order
                    }))
                }
            }
        });

        // Optional: Save Chat History
        if (saveHistory) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chatMessages = messages.map((m: any) => ({
                content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                role: m.role,
                projectId: project.id,
                mode: 'brainstorm',
                createdAt: m.createdAt ? new Date(m.createdAt) : new Date()
            }));

            await prisma.chatMessage.createMany({
                data: chatMessages
            });
        }

        return NextResponse.json({ projectId: project.id });

    } catch (error) {
        console.error('Project Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate project' }, { status: 500 });
    }
}
