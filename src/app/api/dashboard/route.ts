import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPendingUsersCount } from "@/lib/actions";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ session: null }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAdmin = (session.user as any)?.role === "ADMIN";
    const pendingUsersCount = isAdmin ? await getPendingUsersCount() : 0;

    const activeProjects = await prisma.project.findMany({
        where: {
            isArchived: false,
            OR: [
                { ownerId: session.user?.id },
                { sharedWith: { some: { id: session.user?.id } } }
            ]
        },
        orderBy: { updatedAt: "desc" },
        include: {
            _count: {
                select: { todos: { where: { isCompleted: false } } }
            },
            sharedWith: true,
        }
    });

    return NextResponse.json({
        session,
        isAdmin,
        pendingUsersCount,
        activeProjects,
        vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
    });
}
