import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ProjectView from "@/components/ProjectView";
import { Project } from "@/lib/types";
import { touchProject } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session) redirect("/login");

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            todos: { orderBy: { createdAt: "desc" } },
            notes: { orderBy: { createdAt: "desc" } },
            chatMessages: { orderBy: { createdAt: "asc" } },
            _count: {
                select: { todos: { where: { isCompleted: false } } }
            }
        }
    });

    if (!project) notFound();

    // Update last opened timestamp
    await touchProject(id);

    return <ProjectView project={project as unknown as Project} />;
}
