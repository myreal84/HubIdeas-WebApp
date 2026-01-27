import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ProjectView from "@/components/ProjectView";
import { Project } from "@/lib/types";
import { touchProject, getPendingUsersCount } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session) redirect("/login");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAdmin = (session.user as any)?.role === "ADMIN";
    const pendingUsersCount = isAdmin ? await getPendingUsersCount() : 0;

    // Fetch fresh user data for token limits
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (prisma.user as any).findUnique({
        where: { id: session.user?.id },
        select: { aiTokensUsed: true, aiTokenLimit: true }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (prisma.project as any).findFirst({
        where: {
            id,
            OR: [
                { ownerId: session.user?.id },
                { sharedWith: { some: { id: session.user?.id } } }
            ]
        },
        include: {
            sharedWith: {
                select: {
                    id: true,
                    name: true,
                    image: true
                }
            },
            todos: {
                orderBy: { createdAt: "desc" },
                include: { creator: { select: { name: true } } }
            },
            notes: {
                orderBy: { createdAt: "desc" },
                include: { creator: { select: { name: true } } }
            },
            chatMessages: { orderBy: { createdAt: "asc" } },
            _count: {
                select: { todos: { where: { isCompleted: false } } }
            }
        }
    });

    if (!project) notFound();

    // Update last opened timestamp
    await touchProject(id);

    return (
        <ProjectView
            project={project as unknown as Project}
            isAdmin={isAdmin}
            pendingUsersCount={pendingUsersCount}
            aiTokensUsed={user?.aiTokensUsed || 0}
            aiTokenLimit={user?.aiTokenLimit || 2000}
        />
    );
}
