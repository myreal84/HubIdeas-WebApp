"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Project Actions ---

export async function getProjects() {
    return await prisma.project.findMany({
        where: { isArchived: false },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { todos: { where: { isCompleted: false } } }
            }
        }
    });
}

export async function createProject(name: string, initialNote?: string) {
    const project = await prisma.project.create({
        data: {
            name,
            notes: initialNote ? {
                create: { content: initialNote }
            } : undefined
        },
    });
    revalidatePath("/");
    return project;
}

export async function deleteProject(id: string) {
    await prisma.project.delete({
        where: { id },
    });
    revalidatePath("/");
}

export async function updateProjectStatus(id: string, isArchived: boolean) {
    await prisma.project.update({
        where: { id },
        data: { isArchived },
    });
    revalidatePath("/");
    revalidatePath(`/project/${id}`);
}

export async function touchProject(id: string) {
    await prisma.project.update({
        where: { id },
        data: { lastOpenedAt: new Date() },
    });
}

// --- Todo Actions ---

export async function getTodos(projectId: string) {
    return await prisma.todo.findMany({
        where: { projectId },
        orderBy: [
            { isCompleted: "asc" },
            { createdAt: "desc" }
        ],
    });
}

export async function addTodo(projectId: string, content: string) {
    const todo = await prisma.todo.create({
        data: { content, projectId },
    });
    revalidatePath("/");
    revalidatePath(`/project/${projectId}`);
    return todo;
}

export async function toggleTodo(id: string, isCompleted: boolean) {
    const todo = await prisma.todo.update({
        where: { id },
        data: { isCompleted },
    });
    revalidatePath("/");
    revalidatePath(`/project/${todo.projectId}`);
}

export async function deleteTodo(id: string) {
    await prisma.todo.delete({
        where: { id },
    });
    revalidatePath("/");
}

export async function updateTodo(id: string, content: string) {
    const todo = await prisma.todo.update({
        where: { id },
        data: { content },
    });
    revalidatePath("/");
    revalidatePath(`/project/${todo.projectId}`);
}

// --- Note Actions ---

export async function getNotes(projectId: string) {
    return await prisma.note.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
    });
}

export async function addNote(projectId: string, content: string) {
    const note = await prisma.note.create({
        data: { content, projectId },
    });
    revalidatePath("/");
    return note;
}

export async function deleteNote(id: string) {
    await prisma.note.delete({
        where: { id },
    });
    revalidatePath("/");
}

export async function updateNote(id: string, content: string) {
    const note = await prisma.note.update({
        where: { id },
        data: { content },
    });
    revalidatePath("/");
    revalidatePath(`/project/${note.projectId}`);
}

// --- Chat Actions ---

export async function saveChatMessage(projectId: string, role: string, content: string) {
    await prisma.chatMessage.create({
        data: { projectId, role, content },
    });
    revalidatePath(`/project/${projectId}`);
}
