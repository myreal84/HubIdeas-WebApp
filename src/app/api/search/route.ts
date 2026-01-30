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

    const userId = session.user.id;

    // We search across Projects, Todos, and Notes
    // Filtering by user access (Owner or SharedWith)
    const [projects, todos, notes] = await Promise.all([
        prisma.project.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { sharedWith: { some: { id: userId } } }
                ],
                name: { contains: query }
            },
            take: 5
        }),
        prisma.todo.findMany({
            where: {
                project: {
                    OR: [
                        { ownerId: userId },
                        { sharedWith: { some: { id: userId } } }
                    ]
                },
                content: { contains: query }
            },
            include: { project: { select: { name: true } } },
            take: 5
        }),
        prisma.note.findMany({
            where: {
                project: {
                    OR: [
                        { ownerId: userId },
                        { sharedWith: { some: { id: userId } } }
                    ]
                },
                content: { contains: query }
            },
            include: { project: { select: { name: true } } },
            take: 5
        })
    ]);

    const results = [
        ...projects.map(p => ({
            id: p.id,
            type: 'project',
            title: p.name,
            subtitle: 'Projekt',
            url: `/project/${p.id}`
        })),
        ...todos.map(t => ({
            id: t.id,
            type: 'todo',
            title: t.content,
            subtitle: `Aufgabe in ${t.project.name}`,
            url: `/project/${t.projectId}`
        })),
        ...notes.map(n => ({
            id: n.id,
            type: 'note',
            title: n.content,
            subtitle: `Gedanke in ${n.project.name}`,
            url: `/project/${n.projectId}`
        }))
    ];

    return NextResponse.json({ results });
}
