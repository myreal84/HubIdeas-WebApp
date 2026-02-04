import { prisma } from "@/lib/prisma";

/**
 * Checks if the user is within their AI token limit and resets usage if a new month has started.
 * @returns { canUse: boolean, remaining: number }
 */
export async function checkAndResetAiLimit(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            aiTokenLimit: true,
            aiTokensUsed: true,
            lastTokenReset: true
        }
    });

    if (!user) return { canUse: false, remaining: 0 };

    const now = new Date();
    const lastReset = new Date(user.lastTokenReset);

    // Reset tokens if it's a new calendar month
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                aiTokensUsed: 0,
                lastTokenReset: now
            }
        });
        return { canUse: true, remaining: Number(user.aiTokenLimit) };
    }

    const remaining = user.aiTokenLimit - user.aiTokensUsed;
    return {
        canUse: remaining > BigInt(0),
        remaining: Number(remaining > BigInt(0) ? remaining : BigInt(0))
    };
}

/**
 * Increments the user's AI token usage.
 */
export async function recordAiUsage(userId: string, tokens: number) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            aiTokensUsed: {
                increment: tokens
            }
        }
    });
}
