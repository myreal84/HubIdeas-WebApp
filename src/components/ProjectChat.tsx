"use client";

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Plus, MessageSquare, ListTodo, Paperclip, X, Loader2, CheckSquare } from 'lucide-react';
import { Project } from '@/lib/types';
import { saveChatMessage, addTodo } from '@/lib/actions';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
    mode?: string;
}

type ProjectChatProps = {
    project: Project;
    aiTokensUsed?: number;
    aiTokenLimit?: number;
};

export default function ProjectChat({ project, aiTokensUsed = 0, aiTokenLimit = 2000 }: ProjectChatProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isAddingTodo, setIsAddingTodo] = useState(false);
    const [chatMode, setChatMode] = useState<'conversation' | 'todo'>('conversation');
    const [selectedItems, setSelectedItems] = useState<{ id: string; type: 'note' | 'todo'; title: string; content: string }[]>([]);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [adoptedTodoIndices, setAdoptedTodoIndices] = useState<Record<string, Set<number>>>({});
    // Shadow state to track modes of messages locally, ensuring persistence across re-renders/mode switches
    const [messageModes, setMessageModes] = useState<Record<string, 'conversation' | 'todo'>>(() => {
        const modes: Record<string, 'conversation' | 'todo'> = {};
        project.chatMessages.forEach(m => {
            if (m.mode) modes[m.id] = m.mode as 'conversation' | 'todo';
        });
        return modes;
    });
    const pickerRef = useRef<HTMLDivElement>(null);
    // Ref to access current chatMode inside closures/callbacks
    const chatModeRef = useRef(chatMode);

    useEffect(() => {
        chatModeRef.current = chatMode;
    }, [chatMode]);

    const [input, setInput] = useState('');

    // Manual loading state derivation
    const params = useChat({
        initialMessages: project.chatMessages.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            mode: (m.mode || 'conversation') as 'conversation' | 'todo',
        })),
        body: {
            projectContext: {
                title: project.name,
                notes: project.notes.map(n => n.content),
                todos: project.todos.map(t => ({ content: t.content, isCompleted: t.isCompleted })),
            },
            mode: chatMode,
            referencedContext: selectedItems.length > 0 ? selectedItems.map(item => ({
                title: item.title,
                content: item.content,
                type: item.type
            })) : undefined
        },
        onFinish: async ({ message }: { message: any }) => {
            // In newer SDK versions, content might be empty but parts holds the text
            let finalContent = message.content || "";
            if (!finalContent && message.parts && Array.isArray(message.parts)) {
                finalContent = message.parts
                    .filter((p: any) => p.type === 'text')
                    .map((p: any) => p.text)
                    .join('');
            }

            const modeAtTimeOfGeneration = chatModeRef.current;
            await saveChatMessage(project.id, 'assistant', finalContent, modeAtTimeOfGeneration);
            // Persist the mode in our local shadow map
            setMessageModes(prev => ({ ...prev, [message.id]: modeAtTimeOfGeneration }));

            // Still attempt to update the AI SDK messages for consistency, though shadow map takes precedence
            // @ts-expect-error mode property is not in AI SDK types by default
            setMessages(prev => prev.map((m: any) => m.id === message.id ? { ...m, mode: modeAtTimeOfGeneration, content: finalContent } : m));

        }
    } as any);

    const { messages, status, sendMessage, setMessages } = params as any; // Cast to any to bypass strict type checking for now

    const isLoading = status === 'streaming' || status === 'submitted';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userContent = input;
        const currentMode = chatMode;

        // Optimistically add user message? useChat usually handles this via sendMessage.
        // We will just call sendMessage.

        setInput(''); // Clear input immediately

        await sendMessage({ role: 'user', content: userContent }, {
            body: {
                projectContext: {
                    title: project.name,
                    notes: project.notes.map(n => n.content),
                    todos: project.todos.map(t => ({ content: t.content, isCompleted: t.isCompleted })),
                },
                mode: currentMode,
                referencedContext: selectedItems.length > 0 ? selectedItems.map(item => ({
                    title: item.title,
                    content: item.content,
                    type: item.type
                })) : undefined
            }
        });

        // User message persistence handled manually? 
        // In previous code: saveChatMessage was called in onFormSubmit.
        await saveChatMessage(project.id, 'user', userContent, currentMode);

        // Manually update local messages for mode persistence if needed, 
        // but sendMessage should add it to 'messages'. 
        // We might need to map manual mode here.
        setTimeout(() => {
            setMessages((prev: any[]) => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'user') {
                    return [...prev.slice(0, -1), { ...last, mode: currentMode }];
                }
                return prev;
            });
        }, 0);

        setSelectedItems([]);
    };


    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Handle clicking outside the picker to close it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAdoptTodo = async (content: string, messageId: string, index: number) => {
        setIsAddingTodo(true);
        await addTodo(project.id, content);
        setAdoptedTodoIndices(prev => {
            const newSet = new Set(prev[messageId] || []);
            newSet.add(index);
            return { ...prev, [messageId]: newSet };
        });
        setIsAddingTodo(false);
    };

    const toggleItemSelection = (item: { id: string; type: 'note' | 'todo'; title: string; content: string }) => {
        setSelectedItems(prev => {
            const exists = prev.find(i => i.id === item.id);
            if (exists) return prev.filter(i => i.id !== item.id);
            return [...prev, item];
        });
    };

    const renderMessageContent = (content: string | undefined | null, role: string, messageId: string, messageMode?: string | null) => {
        // Safe fallback for empty/null content
        const safeContent = content || "";

        if (role !== 'assistant') return <p className="whitespace-pre-wrap">{safeContent}</p>;

        const adoptedIndices = adoptedTodoIndices[messageId] || new Set();
        // Use shadow state first, then message object mode, fallback to current chatMode
        const effectiveMode = messageModes[messageId] || messageMode || chatMode;

        // Robust JSON extraction: Find the first JSON array in the text
        let jsonArray: string[] | null = null;
        let textBeforeJson = content;
        let textAfterJson = "";

        const jsonRegex = /\[\s*\"[\s\S]*\"\s*\]/m;
        const match = safeContent.match(jsonRegex);

        if (match) {
            try {
                const parsed = JSON.parse(match[0]);
                if (Array.isArray(parsed)) {
                    jsonArray = parsed;
                    textBeforeJson = safeContent.substring(0, match.index).trim();
                    textAfterJson = safeContent.substring(match.index! + match[0].length).trim();
                }
            } catch (e) {
                console.error("Failed to parse extracted JSON:", e);
            }
        }

        if (effectiveMode === 'todo' && jsonArray && textBeforeJson) {
            // If we have a JSON array and an intro, remove any lines that look like a Markdown list item
            // to avoid duplication if the AI provides both.
            textBeforeJson = textBeforeJson.split('\n')
                .filter(line => !line.trim().startsWith('- ') && !line.trim().startsWith('* ') && !/^\d+\.\s/.test(line.trim()))
                .join('\n').trim();
        }

        return (
            <div className="space-y-4">
                {/* Introduction Text (if any) */}
                {textBeforeJson && !(effectiveMode === 'todo' && !jsonArray) && (
                    <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-foreground/90">{children}</p>,
                                strong: ({ children }) => <strong className="font-black text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]">{children}</strong>,
                                ul: ({ children }) => <ul className="space-y-2 mb-4 list-none p-0">{children}</ul>,
                                li: ({ children }) => (
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-2 flex-shrink-0" />
                                        <span className="text-sm text-foreground/80">{children}</span>
                                    </li>
                                ),
                                code: ({ children }) => <code className="bg-foreground/10 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                            }}
                        >
                            {textBeforeJson}
                        </ReactMarkdown>
                    </div>
                )}

                {/* Todo List (if mode is todo and JSON was found) */}
                {jsonArray && (
                    <div className="space-y-3 py-2">
                        <p className="text-xs font-black uppercase tracking-widest text-accent mb-2 opacity-70">Empfohlene Aufgaben:</p>
                        {jsonArray.map((todoText, idx) => {
                            const isAdopted = adoptedIndices.has(idx);
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all shadow-sm ${isAdopted ? 'bg-green-500/10 border-green-500/30 opacity-60' : 'bg-accent/5 border-accent/20 hover:bg-accent/10 hover:border-accent/40 group/todo'}`}
                                >
                                    <span className={`text-sm font-bold ${isAdopted ? 'text-green-500 line-through' : 'text-foreground'}`}>{todoText}</span>
                                    <button
                                        onClick={() => !isAdopted && handleAdoptTodo(todoText, messageId, idx)}
                                        disabled={isAddingTodo || isAdopted}
                                        className={`p-2 rounded-xl transition-all shadow-lg ${isAdopted ? 'bg-green-500 text-white cursor-default' : 'bg-accent text-white hover:scale-105 active:scale-95 shadow-accent/20 disabled:opacity-50'}`}
                                        title={isAdopted ? "Bereits hinzugefügt" : "Als Aufgabe speichern"}
                                    >
                                        {isAddingTodo && !isAdopted ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : isAdopted ? (
                                            <CheckSquare size={16} strokeWidth={3} />
                                        ) : (
                                            <Plus size={16} strokeWidth={3} />
                                        )}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Closing Text (if any) */}
                {textAfterJson && (
                    <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-foreground/90">{children}</p>,
                                strong: ({ children }) => <strong className="font-black text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]">{children}</strong>,
                                ul: ({ children }) => <ul className="space-y-2 mb-4 list-none p-0">{children}</ul>,
                                li: ({ children }) => (
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-2 flex-shrink-0" />
                                        <span className="text-sm text-foreground/80">{children}</span>
                                    </li>
                                ),
                                code: ({ children }) => <code className="bg-foreground/10 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                            }}
                        >
                            {textAfterJson}
                        </ReactMarkdown>
                    </div>
                )}

                {/* Fallback rendering if mode is todo but no JSON was found (to show bullets at least) */}
                {effectiveMode === 'todo' && !jsonArray && (
                    <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                            components={{
                                li: ({ children }) => (
                                    <li className="flex items-start gap-3 p-3 bg-foreground/5 rounded-xl border border-border group/todo transition-all">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                        <span className="text-sm font-medium">{children}</span>
                                    </li>
                                )
                            }}
                        >
                            {safeContent}
                        </ReactMarkdown>
                    </div>
                )}

                {/* Fallback for conversation mode - Removed to prevent duplication */}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-card/40 rounded-[2rem] border border-border overflow-hidden">
            {/* Chat Header with Mode Switch */}
            <div className="p-4 border-b border-border bg-background/40 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-accent/20 rounded-xl">
                        <Bot size={18} className="text-accent" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm leading-none">HubIdeas Assistent</span>
                        <span className={`text-[10px] font-medium leading-tight ${aiTokensUsed >= aiTokenLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {aiTokensUsed.toLocaleString()} / {aiTokenLimit.toLocaleString()} Tokens
                        </span>
                    </div>
                </div>

                <div className="bg-foreground/5 p-1 rounded-2xl flex items-center gap-1 border border-border">
                    <button
                        onClick={() => setChatMode('conversation')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${chatMode === 'conversation' ? 'bg-background shadow-lg text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <MessageSquare size={14} />
                        Unterhaltung
                    </button>
                    <button
                        onClick={() => setChatMode('todo')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${chatMode === 'todo' ? 'bg-background shadow-lg text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <ListTodo size={14} />
                        To-Do Generation
                    </button>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40"
                        >
                            <Bot size={48} className="mb-4" />
                            <p className="text-lg font-bold">Frag mich was zu deinem Projekt!</p>
                            <p className="text-sm">Ich kenne deine Notizen und Aufgaben.</p>
                        </motion.div>
                    )}
                    {/* Deduplicate messages by ID to prevent double bubbles if re-renders occur */}
                    {messages.filter((m: any, i: number, self: any[]) => i === self.findIndex((t: any) => t.id === m.id)).map((m: any) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                                }`}>
                                {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className={`max-w-[85%] lg:max-w-[80%] p-3 lg:p-4 rounded-2xl ${m.role === 'user'
                                ? 'bg-primary border border-primary/20 text-white rounded-tr-none shadow-xl'
                                : 'bg-card border border-border text-foreground rounded-tl-none shadow-xl'
                                }`}>
                                {renderMessageContent(
                                    m.content || (m.parts && Array.isArray(m.parts) ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') : ""),
                                    m.role,
                                    m.id,
                                    (m as { mode?: string | null }).mode
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Bot size={20} />
                        </div>
                        <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-xl">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="p-3 lg:p-4 pb-24 lg:pb-8 bg-background/80 border-t border-border backdrop-blur-3xl pb-safe space-y-3">
                {/* Context Chips */}
                <AnimatePresence>
                    {selectedItems.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex flex-wrap gap-2 px-2"
                        >
                            {selectedItems.map(item => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    className="flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                                >
                                    <span className="opacity-50">{item.type === 'note' ? 'Notiz:' : 'Todo:'}</span>
                                    <span>{item.title}</span>
                                    <button onClick={() => toggleItemSelection(item)} className="hover:text-foreground">
                                        <X size={12} />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex gap-4 max-w-4xl mx-auto relative items-end">
                    {/* Context Picker Button & Dropdown */}
                    <div className="relative" ref={pickerRef}>
                        <button
                            type="button"
                            onClick={() => setIsPickerOpen(!isPickerOpen)}
                            className={`p-4 rounded-xl border transition-all shadow-lg ${isPickerOpen ? 'bg-primary text-white border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}
                            title="Kontext hinzufügen"
                        >
                            <Paperclip size={20} className={isPickerOpen ? 'rotate-45 transition-transform' : ''} />
                        </button>

                        <AnimatePresence>
                            {isPickerOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute bottom-full left-0 mb-4 w-72 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-[100]"
                                >
                                    <div className="p-4 bg-foreground/5 border-b border-border">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Kontext auswählen</h4>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                                        {/* Notes Section */}
                                        <div className="mb-2">
                                            <p className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-accent mt-2 mb-1">Notizen</p>
                                            {project.notes.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground italic">Keine Notizen</p>}
                                            {project.notes.map(note => (
                                                <button
                                                    key={note.id}
                                                    type="button"
                                                    onClick={() => toggleItemSelection({ id: note.id, type: 'note', title: note.content.substring(0, 20) + '...', content: note.content })}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-3 ${selectedItems.find(i => i.id === note.id) ? 'bg-accent/10 text-accent font-bold' : 'hover:bg-foreground/5 text-foreground'}`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${selectedItems.find(i => i.id === note.id) ? 'bg-accent' : 'bg-accent/20'}`} />
                                                    <span className="truncate">{note.content}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {/* Todos Section */}
                                        <div className="mb-2">
                                            <p className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-2 mb-1">Aufgaben</p>
                                            {project.todos.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground italic">Keine Aufgaben</p>}
                                            {project.todos.map(todo => (
                                                <button
                                                    key={todo.id}
                                                    type="button"
                                                    onClick={() => toggleItemSelection({ id: todo.id, type: 'todo', title: todo.content.substring(0, 20) + '...', content: todo.content })}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-3 ${selectedItems.find(i => i.id === todo.id) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-foreground/5 text-foreground'}`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${selectedItems.find(i => i.id === todo.id) ? 'bg-primary' : 'bg-primary/20'}`} />
                                                    <span className="truncate">{todo.content}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <input
                        value={input}
                        onChange={handleInputChange}
                        disabled={isLoading || aiTokensUsed >= aiTokenLimit}
                        placeholder={aiTokensUsed >= aiTokenLimit ? "Limit." : (chatMode === 'conversation' ? "Frag mich..." : "Planen?")}
                        className="flex-1 bg-card border border-border rounded-xl px-4 lg:px-6 py-2.5 lg:py-4 text-sm lg:text-lg text-foreground outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || aiTokensUsed >= aiTokenLimit}
                        className="bg-primary text-white p-3 lg:p-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-30 shadow-lg h-[46px] lg:h-[60px] w-[46px] lg:w-[60px] flex items-center justify-center flex-shrink-0"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
