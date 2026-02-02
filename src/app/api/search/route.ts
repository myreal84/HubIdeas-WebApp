import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    const includeArchived = searchParams.get("includeArchived") === "true";
    const userId = session.user.id;

    // Project filter for access and optionally archived status
    const projectWhere = {
        OR: [
            { ownerId: userId },
            { sharedWith: { some: { id: userId } } }
        ],
        ...(includeArchived ? {} : { isArchived: false })
    };

    // We search across Projects, Todos, and Notes
    // Filtering by user access (Owner or SharedWith)
    const [projects, todos, notes] = await Promise.all([
        prisma.project.findMany({
            where: {
                ...projectWhere,
                name: { contains: query }
            },
            take: 5
        }),
        prisma.todo.findMany({
            where: {
                project: projectWhere,
                content: { contains: query }
            },
            include: { project: { select: { name: true, isArchived: true } } },
            take: 5
        }),
        prisma.note.findMany({
            where: {
                project: projectWhere,
                content: { contains: query }
            },
            include: { project: { select: { name: true, isArchived: true } } },
            take: 5
        })
    ]);

    const results = [
        ...projects.map(p => ({
            id: p.id,
            type: 'project',
            title: p.name,
            subtitle: p.isArchived ? 'Archiviertes Projekt' : 'Projekt',
            url: `/project/${p.id}`
        })),
        ...todos.map(t => ({
            id: t.id,
            type: 'todo',
            title: t.content,
            subtitle: `${t.project.isArchived ? '[Archiv] ' : ''}Aufgabe in ${t.project.name}`,
            url: `/project/${t.projectId}`
        })),
        ...notes.map(n => ({
            id: n.id,
            type: 'note',
            title: n.content,
            subtitle: `${(n.project as any).isArchived ? '[Archiv] ' : ''}Gedanke in ${n.project.name}`,
            url: `/project/${n.projectId}`
        }))
    ];

    return NextResponse.json({ results });
}
