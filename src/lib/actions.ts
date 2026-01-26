import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// --- Helpers ---

async function getSession() {
    return await auth();
}

async function getRequiredUserId() {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Nicht authentifiziert");
    return session.user.id;
}

// --- Project Actions ---

export async function getProjects() {
    const userId = await getRequiredUserId();
    return await prisma.project.findMany({
        where: {
            isArchived: false,
            ownerId: userId
        },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { todos: { where: { isCompleted: false } } }
            }
        }
    });
}

export async function createProject(name: string, initialNote?: string) {
    const userId = await getRequiredUserId();
    const project = await prisma.project.create({
        data: {
            name,
            ownerId: userId,
            notes: initialNote ? {
                create: { content: initialNote }
            } : undefined
        },
    });
    revalidatePath("/");
    return project;
}

export async function deleteProject(id: string) {
    const userId = await getRequiredUserId();
    const project = await prisma.project.findUnique({
        where: { id, ownerId: userId },
        select: { isArchived: true }
    });

    if (!project) {
        throw new Error("Projekt nicht gefunden oder Zugriff verweigert.");
    }

    if (!project.isArchived) {
        throw new Error("Aktive Projekte können nicht direkt gelöscht werden.");
    }

    await prisma.project.delete({
        where: { id },
    });
    revalidatePath("/");
    revalidatePath("/archive");
}

export async function updateProjectStatus(id: string, isArchived: boolean) {
    const userId = await getRequiredUserId();
    await prisma.project.update({
        where: { id, ownerId: userId },
        data: { isArchived },
    });
    revalidatePath("/");
    revalidatePath(`/project/${id}`);
}

export async function touchProject(id: string) {
    const userId = await getRequiredUserId();
    await prisma.project.update({
        where: { id, ownerId: userId },
        data: { lastOpenedAt: new Date() },
    });
}

// --- Todo Actions ---

export async function getTodos(projectId: string) {
    const userId = await getRequiredUserId();
    return await prisma.todo.findMany({
        where: {
            projectId,
            project: { ownerId: userId }
        },
        orderBy: [
            { isCompleted: "asc" },
            { createdAt: "desc" }
        ],
    });
}

export async function addTodo(projectId: string, content: string) {
    const userId = await getRequiredUserId();
    // Verify ownership
    const project = await prisma.project.findUnique({
        where: { id: projectId, ownerId: userId }
    });
    if (!project) throw new Error("Zugriff verweigert");

    const todo = await prisma.todo.create({
        data: { content, projectId },
    });
    revalidatePath("/");
    revalidatePath(`/project/${projectId}`);
    return todo;
}

export async function toggleTodo(id: string, isCompleted: boolean) {
    const userId = await getRequiredUserId();
    const todo = await prisma.todo.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!todo || todo.project.ownerId !== userId) {
        throw new Error("Zugriff verweigert");
    }

    await prisma.todo.update({
        where: { id },
        data: { isCompleted },
    });
    revalidatePath("/");
    revalidatePath(`/project/${todo.projectId}`);
}

export async function deleteTodo(id: string) {
    const userId = await getRequiredUserId();
    const todo = await prisma.todo.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!todo || todo.project.ownerId !== userId) {
        throw new Error("Zugriff verweigert");
    }

    await prisma.todo.delete({
        where: { id },
    });
    revalidatePath("/");
}

export async function updateTodo(id: string, content: string) {
    const userId = await getRequiredUserId();
    const todo = await prisma.todo.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!todo || todo.project.ownerId !== userId) {
        throw new Error("Zugriff verweigert");
    }

    await prisma.todo.update({
        where: { id },
        data: { content },
    });
    revalidatePath("/");
    revalidatePath(`/project/${todo.projectId}`);
}

// --- Note Actions ---

export async function getNotes(projectId: string) {
    const userId = await getRequiredUserId();
    return await prisma.note.findMany({
        where: {
            projectId,
            project: { ownerId: userId }
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function addNote(projectId: string, content: string) {
    const userId = await getRequiredUserId();
    const project = await prisma.project.findUnique({
        where: { id: projectId, ownerId: userId }
    });
    if (!project) throw new Error("Zugriff verweigert");

    const note = await prisma.note.create({
        data: { content, projectId },
    });
    revalidatePath("/");
    return note;
}

export async function deleteNote(id: string) {
    const userId = await getRequiredUserId();
    const note = await prisma.note.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!note || note.project.ownerId !== userId) {
        throw new Error("Zugriff verweigert");
    }

    await prisma.note.delete({
        where: { id },
    });
    revalidatePath("/");
}

export async function updateNote(id: string, content: string) {
    const userId = await getRequiredUserId();
    const note = await prisma.note.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!note || note.project.ownerId !== userId) {
        throw new Error("Zugriff verweigert");
    }

    await prisma.note.update({
        where: { id },
        data: { content },
    });
    revalidatePath("/");
    revalidatePath(`/project/${note.projectId}`);
}

// --- Chat Actions ---

export async function saveChatMessage(projectId: string, role: string, content: string) {
    const userId = await getRequiredUserId();
    const project = await prisma.project.findUnique({
        where: { id: projectId, ownerId: userId }
    });
    if (!project) throw new Error("Zugriff verweigert");

    await prisma.chatMessage.create({
        data: { projectId, role, content },
    });
    revalidatePath(`/project/${projectId}`);
}
