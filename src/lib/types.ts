export type Project = {
    id: string;
    name: string;
    isArchived: boolean;
    lastOpenedAt: Date;
    lastRemindedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    _count: {
        todos: number;
    };
    todos: Todo[];
    notes: Note[];
    chatMessages: ChatMessage[];
};

export type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    projectId: string;
    createdAt: Date;
};

export type Todo = {
    id: string;
    content: string;
    isCompleted: boolean;
    projectId: string;
    createdAt: Date;
};

export type Note = {
    id: string;
    content: string;
    projectId: string;
    createdAt: Date;
};
