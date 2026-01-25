import { NextResponse } from 'next/server';
import { testAIService } from '@/lib/ai';
import { auth } from '@/auth';

export async function GET(req: Request) {
    // Basic security check: user must be logged in
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const modelName = searchParams.get('model') || 'gemini-2.0-flash-lite-preview-02-05';

    try {
        const response = await testAIService(modelName);
        return NextResponse.json({
            success: true,
            message: `AI Service is connected using ${modelName}!`,
            response: response
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
