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
    ownerId: string | null;
    sharedWith: {
        id: string;
        name: string | null;
        image: string | null;
    }[];
    todos: Todo[];
    notes: Note[];
    chatMessages: ChatMessage[];
};

export type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    mode?: 'conversation' | 'todo' | null;
    projectId: string;
    createdAt: Date;
};

export type Todo = {
    id: string;
    content: string;
    isCompleted: boolean;
    projectId: string;
    createdAt: Date;
    creator?: {
        name: string | null;
    } | null;
};

export type Note = {
    id: string;
    content: string;
    projectId: string;
    createdAt: Date;
    creator?: {
        name: string | null;
    } | null;
};
