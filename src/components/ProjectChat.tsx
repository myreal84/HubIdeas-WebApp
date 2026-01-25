"use client";

import { useChat, Message } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Plus } from 'lucide-react';
import { Project } from '@/lib/types';
import { saveChatMessage, addTodo } from '@/lib/actions';

type ProjectChatProps = {
    project: Project;
};

export default function ProjectChat({ project }: ProjectChatProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isAddingTodo, setIsAddingTodo] = useState(false);

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/ai/chat',
        initialMessages: project.chatMessages.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
        })),
        body: {
            projectContext: {
                title: project.name,
                notes: project.notes.map(n => n.content),
                todos: project.todos.map(t => ({ content: t.content, isCompleted: t.isCompleted })),
            }
        },
        onFinish: async (message) => {
            await saveChatMessage(project.id, 'assistant', message.content);
        }
    });

    const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        const userContent = input;
        handleSubmit(e);
        // Persist user message
        if (userContent.trim()) {
            await saveChatMessage(project.id, 'user', userContent);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleAdoptTodo = async (content: string) => {
        setIsAddingTodo(true);
        await addTodo(project.id, content);
        setIsAddingTodo(false);
    };

    // Helper to parse bullet points for "Adopt" buttons
    const renderMessageContent = (content: string, role: string) => {
        if (role !== 'assistant') return <p className="whitespace-pre-wrap">{content}</p>;

        const lines = content.split('\n');
        return (
            <div className="space-y-3">
                {lines.map((line, idx) => {
                    const bulletMatch = line.trim().match(/^[-*•]\s+(.+)/);
                    if (bulletMatch) {
                        const todoText = bulletMatch[1];
                        return (
                            <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-foreground/5 rounded-xl border border-border group/todo transition-all hover:bg-foreground/10">
                                <span className="text-sm font-medium">{todoText}</span>
                                <button
                                    onClick={() => handleAdoptTodo(todoText)}
                                    disabled={isAddingTodo}
                                    className="p-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-all scale-0 group-hover/todo:scale-100 disabled:opacity-50"
                                    title="Als Aufgabe speichern"
                                >
                                    {isAddingTodo ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Plus size={14} strokeWidth={3} />}
                                </button>
                            </div>
                        );
                    }
                    return <p key={idx} className="whitespace-pre-wrap">{line}</p>;
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-card/40 rounded-[2rem] border border-border overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                        <Bot size={48} className="mb-4" />
                        <p className="text-lg font-bold">Frag mich was zu deinem Projekt!</p>
                        <p className="text-sm">Ich kenne deine Notizen und Aufgaben.</p>
                    </div>
                )}
                {messages.map((m: Message) => (
                    <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                            }`}>
                            {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>
                        <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user'
                            ? 'bg-primary/20 border border-primary/20 text-foreground rounded-tr-none'
                            : 'bg-foreground/5 border border-border text-foreground rounded-tl-none'
                            }`}>
                            {renderMessageContent(m.content, m.role)}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Bot size={20} />
                        </div>
                        <div className="bg-foreground/5 border border-border p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 pb-48 lg:pb-8 bg-card/95 border-t border-border backdrop-blur-3xl pb-safe">
                <form onSubmit={onFormSubmit} className="flex gap-4 max-w-4xl mx-auto">
                    <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Frag mich was..."
                        className="flex-1 bg-foreground/5 border border-border rounded-2xl px-6 py-4 text-lg text-foreground outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 shadow-2xl"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-primary text-white p-4 rounded-2xl hover:brightness-110 transition-all disabled:opacity-30 shadow-lg shadow-indigo-500/20"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
