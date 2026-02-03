"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import crypto from 'crypto';

// --- Helpers ---

async function getSession() {
    return await auth();
}

async function getRequiredUserId() {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Nicht authentifiziert");
    return session.user.id;
}

/**
 * Access check helper to see if a user is either the owner or a collaborator
 */
async function checkProjectAccess(projectId: string, userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (prisma.project as any).findFirst({
        where: {
            id: projectId,
            OR: [
                { ownerId: userId },
                { sharedWith: { some: { id: userId } } }
            ]
        }
    });
    if (!project) throw new Error("Zugriff verweigert");
    return project;
}

// --- Project Actions ---

export async function getProjects() {
    const userId = await getRequiredUserId();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma.project as any).findMany({
        where: {
            isArchived: false,
            OR: [
                { ownerId: userId },
                { sharedWith: { some: { id: userId } } }
            ]
        },
        orderBy: { updatedAt: "desc" },
        include: {
            sharedWith: {
                select: {
                    id: true,
                    name: true,
                    image: true
                }
            },
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
    // Only owner can delete
    const project = await prisma.project.findUnique({
        where: { id, ownerId: userId },
        select: { isArchived: true }
    });

    if (!project) {
        throw new Error("Projekt nicht gefunden oder nur der Besitzer kann es löschen.");
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
    // Access check: owner or collaborator
    await checkProjectAccess(id, userId);

    await prisma.project.update({
        where: { id },
        data: { isArchived },
    });
    revalidatePath("/");
    revalidatePath(`/project/${id}`);
}

export async function updateProjectName(id: string, name: string) {
    const userId = await getRequiredUserId();
    // Access check: owner or collaborator
    await checkProjectAccess(id, userId);

    if (!name.trim()) throw new Error("Der Projektname darf nicht leer sein.");

    await prisma.project.update({
        where: { id },
        data: { name },
    });
    revalidatePath("/");
    revalidatePath(`/project/${id}`);
}

export async function touchProject(id: string) {
    const userId = await getRequiredUserId();
    // Access check
    await checkProjectAccess(id, userId);

    await prisma.project.update({
        where: { id },
        data: { lastOpenedAt: new Date() },
    });
}

export async function shareProject(projectId: string, targetUserId: string) {
    const userId = await getRequiredUserId();
    // Only owner can share
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (prisma.project as any).findUnique({
        where: { id: projectId, ownerId: userId }
    });
    if (!project) throw new Error("Nur der Besitzer kann das Projekt teilen.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.project as any).update({
        where: { id: projectId },
        data: {
            sharedWith: {
                connect: { id: targetUserId }
            }
        }
    });
    revalidatePath(`/project/${projectId}`);
}

export async function unshareProject(projectId: string, targetUserId: string) {
    const userId = await getRequiredUserId();
    // Only owner can unshare
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (prisma.project as any).findUnique({
        where: { id: projectId, ownerId: userId }
    });
    if (!project) throw new Error("Nur der Besitzer kann die Freigabe aufheben.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.project as any).update({
        where: { id: projectId },
        data: {
            sharedWith: {
                disconnect: { id: targetUserId }
            }
        }
    });
    revalidatePath(`/project/${projectId}`);
}

// --- Todo Actions ---

export async function getTodos(projectId: string) {
    const userId = await getRequiredUserId();
    await checkProjectAccess(projectId, userId);

    return await prisma.todo.findMany({
        where: { projectId },
        orderBy: [
            { isCompleted: "asc" },
            { order: "asc" },
            { createdAt: "desc" }
        ],
    });
}

export async function addTodo(projectId: string, content: string) {
    const userId = await getRequiredUserId();
    await checkProjectAccess(projectId, userId);

    // Get minimum order to insert at top
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstTodo = await (prisma.todo as any).findFirst({
        where: { projectId },
        orderBy: { order: 'asc' },
        select: { order: true }
    });

    const newOrder = firstTodo ? firstTodo.order - 1 : 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const todo = await (prisma.todo as any).create({
        data: { content, projectId, creatorId: userId, order: newOrder },
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

    if (!todo) throw new Error("Aufgabe nicht gefunden");
    await checkProjectAccess(todo.projectId, userId);

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

    if (!todo) throw new Error("Aufgabe nicht gefunden");
    await checkProjectAccess(todo.projectId, userId);

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

    if (!todo) throw new Error("Aufgabe nicht gefunden");
    await checkProjectAccess(todo.projectId, userId);

    await prisma.todo.update({
        where: { id },
        data: { content },
    });
    revalidatePath("/");
    revalidatePath(`/project/${todo.projectId}`);
}

export async function reorderTodo(id: string, newOrder: number) {
    const userId = await getRequiredUserId();
    const todo = await prisma.todo.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!todo) throw new Error("Aufgabe nicht gefunden");
    await checkProjectAccess(todo.projectId, userId);

    await prisma.todo.update({
        where: { id },
        data: { order: newOrder },
    });
    revalidatePath(`/project/${todo.projectId}`);
}

// --- Note Actions ---

export async function getNotes(projectId: string) {
    const userId = await getRequiredUserId();
    await checkProjectAccess(projectId, userId);

    return await prisma.note.findMany({
        where: { projectId },
        orderBy: { order: "asc" },
    });
}

export async function addNote(projectId: string, content: string) {
    const userId = await getRequiredUserId();
    await checkProjectAccess(projectId, userId);

    // Get minimum order to insert at top
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstNote = await (prisma.note as any).findFirst({
        where: { projectId },
        orderBy: { order: 'asc' },
        select: { order: true }
    });

    const newOrder = firstNote ? firstNote.order - 1 : 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const note = await (prisma.note as any).create({
        data: { content, projectId, creatorId: userId, order: newOrder },
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

    if (!note) throw new Error("Notiz nicht gefunden");
    await checkProjectAccess(note.projectId, userId);

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

    if (!note) throw new Error("Notiz nicht gefunden");
    await checkProjectAccess(note.projectId, userId);

    await prisma.note.update({
        where: { id },
        data: { content },
    });
    revalidatePath("/");
    revalidatePath(`/project/${note.projectId}`);
}

export async function reorderNote(id: string, newOrder: number) {
    const userId = await getRequiredUserId();
    const note = await prisma.note.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!note) throw new Error("Notiz nicht gefunden");
    await checkProjectAccess(note.projectId, userId);

    await prisma.note.update({
        where: { id },
        data: { order: newOrder },
    });
    revalidatePath(`/project/${note.projectId}`);
}

// --- Chat Actions ---

export async function saveChatMessage(projectId: string, role: string, content: string, mode?: string) {
    const userId = await getRequiredUserId();
    await checkProjectAccess(projectId, userId);

    if (!content) {
        console.warn('saveChatMessage received empty content. Saving as empty string.');
        content = "";
    }

    await prisma.chatMessage.create({
        data: { projectId, role, content, mode },
    });
    revalidatePath(`/project/${projectId}`);
}

// --- Admin & User Actions ---

async function checkAdmin() {
    const session = await getSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((session?.user as any)?.role !== "ADMIN") {
        throw new Error("Nicht autorisiert: Admin-Rechte erforderlich.");
    }
}

export async function getAllUsers() {
    await checkAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma as any).user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            status: true,
            createdAt: true,
            aiTokenLimit: true,
            aiTokensUsed: true,
            lastTokenReset: true,
        }
    });
}

export async function updateUserStatus(userId: string, status: "WAITING" | "APPROVED" | "REJECTED") {
    await checkAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).user.update({
        where: { id: userId },
        data: { status },
    });
    revalidatePath("/admin");
}

export async function updateUserRole(userId: string, role: "USER" | "ADMIN") {
    await checkAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).user.update({
        where: { id: userId },
        data: { role },
    });
    revalidatePath("/admin");
}

export async function updateUserAiLimit(userId: string, limit: number) {
    await checkAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).user.update({
        where: { id: userId },
        data: { aiTokenLimit: limit },
    });
    revalidatePath("/admin");
}

export async function getShareableUsers() {
    const userId = await getRequiredUserId();
    // We only return APPROVED users, excluding the current user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma as any).user.findMany({
        where: {
            status: "APPROVED",
            NOT: { id: userId }
        },
        select: {
            id: true,
            name: true,
            image: true,
        },
        orderBy: { name: "asc" }
    });
}


import { encryptBuffer } from "@/lib/encryption";
// ... existing imports

// --- File Actions ---

export async function uploadFile(projectId: string, formData: FormData) {
    const userId = await getRequiredUserId();
    await checkProjectAccess(projectId, userId);

    const file = formData.get("file") as File;
    if (!file) throw new Error("Keine Datei ausgewählt");

    const buffer = Buffer.from(await file.arrayBuffer());
    const size = buffer.length;

    // Check User Storage Limit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (prisma.user as any).findUnique({
        where: { id: userId },
        select: { storageLimit: true, storageUsed: true }
    });

    if (user.storageUsed + BigInt(size) > user.storageLimit) {
        throw new Error("Speicherplatzlimit überschritten.");
    }

    // Encrypt
    const { encryptedData, iv } = encryptBuffer(buffer);

    // Save to DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.projectFile as any).create({
        data: {
            name: file.name,
            type: file.type,
            size: size,
            content: encryptedData,
            iv: iv,
            projectId: projectId,
            uploaderId: userId
        }
    });

    // Update Usage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.user as any).update({
        where: { id: userId },
        data: { storageUsed: { increment: size } }
    });

    revalidatePath(`/project/${projectId}`);
}

export async function getProjectFiles(projectId: string) {
    const userId = await getRequiredUserId();
    await checkProjectAccess(projectId, userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma.projectFile as any).findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { name: true } } }
    });
}

export async function deleteFile(fileId: string) {
    const userId = await getRequiredUserId();

    // Check permission (uploader or admin or project owner?)
    // For now, allow if can access project and is uploader or admin.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = await (prisma.projectFile as any).findUnique({
        where: { id: fileId },
        include: { project: true }
    });

    if (!file) throw new Error("Datei nicht gefunden");
    await checkProjectAccess(file.projectId, userId);

    const user = await auth().then(s => s?.user);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAdmin = (user as any)?.role === 'ADMIN';

    if (file.uploaderId !== userId && !isAdmin) {
        // Also allow project owner
        if (file.project.ownerId !== userId) {
            throw new Error("Keine Berechtigung zum Löschen dieser Datei.");
        }
    }

    // Delete from DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.projectFile as any).delete({
        where: { id: fileId }
    });

    // Update Usage (decrement)
    if (file.uploaderId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma.user as any).update({
            where: { id: file.uploaderId },
            data: { storageUsed: { decrement: file.size } }
        });
    }

    revalidatePath(`/project/${file.projectId}`);
}

export async function getPendingUsersCount() {
    try {
        await checkAdmin();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (prisma as any).user.count({
            where: { status: "WAITING" }
        });
    } catch {
        return 0;
    }
}

