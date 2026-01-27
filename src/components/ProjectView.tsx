"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Plus,
    CheckCircle2,
    Circle,
    ArrowLeft,
    Trash2,
    CheckSquare,
    StickyNote,
    Archive,
    MessageSquare,
    Sparkles,
    X,
    Pencil,
    Users
} from "lucide-react";
import Link from "next/link";
import { Project, Todo, Note } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import ProjectChat from "./ProjectChat";
import ProjectMenu from "./ProjectMenu";
import ShareDialog from "./ShareDialog";
import UserAvatar from "./UserAvatar";
import {
    addTodo,
    toggleTodo,
    deleteTodo,
    addNote,
    deleteNote,
    updateTodo,
    updateNote
} from "@/lib/actions";

type ProjectViewProps = {
    project: Project;
    isAdmin?: boolean;
    pendingUsersCount?: number;
    aiTokensUsed?: number;
    aiTokenLimit?: number;
};

export default function ProjectView({ project, isAdmin, pendingUsersCount, aiTokensUsed, aiTokenLimit }: ProjectViewProps) {
    const [activeTab, setActiveTab] = useState<"todos" | "notes" | "chat">("todos");
    const [todoInputValue, setTodoInputValue] = useState("");
    const [noteInputValue, setNoteInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentInput = activeTab === "todos" ? todoInputValue : noteInputValue;
        if (!currentInput.trim() || loading) return;

        setLoading(true);
        if (activeTab === "todos") {
            await addTodo(project.id, todoInputValue);
            setTodoInputValue("");
        } else {
            await addNote(project.id, noteInputValue);
            setNoteInputValue("");
        }
        setLoading(false);
    };

    const handleEditTodo = (todo: Todo) => {
        setEditingTodoId(todo.id);
        setEditContent(todo.content);
    };

    const handleSaveTodo = async (id: string) => {
        if (!editContent.trim()) return;
        await updateTodo(id, editContent);
        setEditingTodoId(null);
        setEditContent("");
    };

    const handleEditNote = (note: Note) => {
        setEditingNoteId(note.id);
        setEditContent(note.content);
    };

    const handleSaveNote = async (id: string) => {
        if (!editContent.trim()) return;
        await updateNote(id, editContent);
        setEditingNoteId(null);
        setEditContent("");
    };

    // Sort todos: active first, then completed (both by creation date)
    const sortedTodos = [...project.todos].sort((a, b) => {
        if (a.isCompleted === b.isCompleted) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.isCompleted ? 1 : -1;
    });

    return (
        <div className="main-container animate-fade-in pb-16">
            <header className="mb-6 lg:mb-16">
                <div className="flex items-center gap-4 lg:gap-6">
                    <Link href="/" className="group p-3 lg:p-4 bg-foreground/5 hover:bg-primary/20 rounded-2xl transition-all border border-border backdrop-blur-md shadow-xl">
                        <ArrowLeft size={16} className="lg:w-6 lg:h-6 group-hover:-translate-x-1 transition-transform text-muted-foreground group-hover:text-primary" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className={`text-xl md:text-5xl lg:text-3xl font-black title-font tracking-tight leading-tight line-clamp-2 ${project.isArchived ? 'opacity-30 line-through' : 'text-foreground'}`}>
                            {project.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-1 lg:mt-3">
                            {project.isArchived ? (
                                <span className="flex items-center gap-2 text-slate-400 font-bold text-[9px] lg:text-xs uppercase tracking-widest bg-slate-400/10 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full border border-slate-400/20">
                                    <Archive className="w-[10px] h-[10px] lg:w-3 lg:h-3" /> Archiviert
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-primary font-bold text-[9px] lg:text-xs uppercase tracking-widest bg-primary/10 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full border border-primary/20">
                                    <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-primary animate-pulse" /> Aktiv
                                </span>
                            )}

                            {/* Collaborators Stack */}
                            {project.sharedWith.length > 0 && (
                                <div className="flex -space-x-2 ml-2">
                                    {project.sharedWith.map((user) => (
                                        <div key={user.id} className="w-6 h-6 rounded-full border-2 border-background overflow-hidden" title={user.name || ""}>
                                            <UserAvatar src={user.image} name={user.name} size="sm" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Share Button (Owner only) */}
                            {isAdmin && !project.isArchived && (
                                <button
                                    onClick={() => setIsShareDialogOpen(true)}
                                    className="p-1.5 bg-foreground/5 hover:bg-primary/20 rounded-lg transition-all border border-border text-muted-foreground hover:text-primary ml-1"
                                    title="Projekt teilen"
                                >
                                    <Users size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Tabs & Sticky Input Header */}
            <div className="lg:hidden sticky top-2 z-40 space-y-2 mb-6">
                <div className="grid grid-cols-3 p-1 bg-background/80 backdrop-blur-2xl rounded-2xl border border-border shadow-2xl">
                    <button
                        onClick={() => setActiveTab("todos")}
                        className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[8px] transition-all ${activeTab === "todos"
                            ? 'bg-gradient-to-br from-primary to-accent text-white shadow-lg'
                            : 'text-slate-500'
                            }`}
                    >
                        <CheckSquare size={14} />
                        <span>Aufgaben</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("notes")}
                        className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[8px] transition-all ${activeTab === "notes"
                            ? 'bg-gradient-to-br from-primary to-accent text-white shadow-lg'
                            : 'text-slate-500'
                            }`}
                    >
                        <StickyNote size={14} />
                        <span>Gedanken</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[8px] transition-all ${activeTab === "chat"
                            ? 'bg-gradient-to-br from-primary to-accent text-white shadow-lg'
                            : 'text-slate-500'
                            }`}
                    >
                        <MessageSquare size={14} />
                        <span>Chat</span>
                    </button>
                </div>

                {/* Slim Inline Input for Mobile */}
                {activeTab !== 'chat' && !project.isArchived && mounted && (
                    <motion.form
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleSubmit}
                        className="flex gap-2 p-1.5 bg-background/60 rounded-xl border border-border backdrop-blur-xl shadow-xl"
                    >
                        <input
                            type="text"
                            value={activeTab === "todos" ? todoInputValue : noteInputValue}
                            onChange={(e) => activeTab === "todos" ? setTodoInputValue(e.target.value) : setNoteInputValue(e.target.value)}
                            placeholder={activeTab === "todos" ? "Aufgabe hinzufügen..." : "Gedanke festhalten..."}
                            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm font-bold placeholder:text-muted-foreground/30 text-foreground"
                        />
                        <button
                            type="submit"
                            disabled={loading || !(activeTab === "todos" ? todoInputValue : noteInputValue).trim()}
                            className="p-2 aspect-square rounded-lg bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 flex-shrink-0"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={20} strokeWidth={3} />}
                        </button>
                    </motion.form>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* To-Dos Section */}
                <div className={`${activeTab !== "todos" ? "hidden lg:block" : "block"} space-y-4 lg:space-y-8`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4 bg-foreground/5 py-3 px-6 rounded-2xl border border-border">
                            <h2 className="text-lg lg:text-2xl font-black text-foreground/90 uppercase tracking-widest leading-none">Aufgaben</h2>
                            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20 uppercase tracking-tighter">
                                {project.todos.filter((t: Todo) => !t.isCompleted).length} Offen
                            </span>
                        </div>
                    </div>

                    {/* Desktop Inline Task Input */}
                    <motion.form
                        layout
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (todoInputValue.trim()) {
                                addTodo(project.id, todoInputValue);
                                setTodoInputValue("");
                            }
                        }}
                        className="hidden lg:flex gap-4 p-2 bg-background/60 rounded-3xl border border-border overflow-hidden focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all mb-8 shadow-2xl"
                    >
                        <input
                            type="text"
                            value={todoInputValue}
                            onChange={(e) => setTodoInputValue(e.target.value)}
                            placeholder="Neue Aufgabe..."
                            className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-foreground text-lg font-bold placeholder:text-muted-foreground/30"
                        />
                        <button type="submit" className="bg-primary hover:brightness-110 text-white p-4 rounded-2xl transition-all shadow-lg">
                            <Plus size={24} strokeWidth={3} />
                        </button>
                    </motion.form>

                    <motion.div className="space-y-2 lg:space-y-4" layout>
                        <AnimatePresence mode="popLayout">
                            {project.todos.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-16 lg:py-24 bg-foreground/5 rounded-[2rem] border-2 border-dashed border-border group"
                                >
                                    <CheckSquare className="w-10 h-10 lg:w-12 lg:h-12 mx-auto text-muted-foreground/20 mb-4 group-hover:text-muted-foreground/30 transition-colors" />
                                    <p className="text-muted-foreground font-bold text-sm lg:text-lg tracking-tight">Alles erledigt.</p>
                                </motion.div>
                            )}
                            {sortedTodos.map((todo: Todo) => (
                                <motion.div
                                    key={todo.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className={`group flex items-center gap-4 p-4 lg:p-6 bg-card border border-border rounded-2xl lg:rounded-3xl transition-all hover:bg-card/80 hover:border-primary/30 relative min-h-[64px] lg:min-h-[80px] shadow-sm hover:shadow-xl ${todo.isCompleted ? 'opacity-40 grayscale-[0.5]' : ''}`}
                                >
                                    <button
                                        onClick={async () => {
                                            try {
                                                await toggleTodo(todo.id, !todo.isCompleted);
                                            } catch (error) {
                                                console.error("Toggle failed:", error);
                                            }
                                        }}
                                        className={`relative z-10 transition-all hover:scale-110 active:scale-95 ${todo.isCompleted ? 'text-green-500' : 'text-slate-400 hover:text-primary'}`}
                                    >
                                        {todo.isCompleted ? <CheckCircle2 className="w-6 h-6 lg:w-8 lg:h-8" strokeWidth={2.5} /> : <Circle className="w-6 h-6 lg:w-8 lg:h-8" strokeWidth={2.5} />}
                                    </button>

                                    {editingTodoId === todo.id ? (
                                        <div className="flex-1 flex flex-col gap-3">
                                            <textarea
                                                autoFocus
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape') setEditingTodoId(null);
                                                }}
                                                className="w-full bg-foreground/5 border border-border rounded-xl p-4 text-foreground font-bold outline-none focus:border-primary min-h-[80px] resize-none"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingTodoId(null)} className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors font-bold uppercase text-[10px] tracking-widest">
                                                    Abbrechen
                                                </button>
                                                <button onClick={() => handleSaveTodo(todo.id)} className="px-4 py-2 bg-primary rounded-xl text-white hover:brightness-110 transition-all font-bold uppercase text-[10px] tracking-widest">
                                                    Speichern
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-col flex-1">
                                                <span className={`relative z-10 font-bold text-base lg:text-2xl transition-all ${todo.isCompleted ? 'line-through opacity-50 italic' : 'text-foreground'}`}>
                                                    {todo.content}
                                                </span>
                                                {todo.creator?.name && (
                                                    <span className="text-[10px] italic opacity-40 font-medium">von {todo.creator.name}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditTodo(todo)}
                                                    className="relative z-10 btn-ghost opacity-40 lg:opacity-0 lg:group-hover:opacity-100 transition-all text-muted-foreground hover:text-primary"
                                                >
                                                    <Pencil className="w-4 h-4 lg:w-5 lg:h-5" />
                                                </button>
                                                <button
                                                    onClick={() => deleteTodo(todo.id)}
                                                    className="relative z-10 btn-ghost opacity-40 lg:opacity-0 lg:group-hover:opacity-100 transition-all text-muted-foreground hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                    {/* Mobile Spacer */}
                    <div className="lg:hidden h-16" />
                </div>

                {/* Notes Section */}
                <div className={`${activeTab !== "notes" ? "hidden lg:block" : "block"} space-y-4 lg:space-y-8`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4 bg-foreground/5 py-3 px-6 rounded-2xl border border-border">
                            <h2 className="text-lg lg:text-2xl font-black text-foreground/90 uppercase tracking-widest leading-none" id="notes-heading">Gedanken</h2>
                            <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-1 rounded-md border border-accent/20 uppercase tracking-tighter">
                                {project.notes.length} Notizen
                            </span>
                        </div>
                    </div>

                    {/* Desktop Inline Note Input */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (noteInputValue.trim()) {
                                addNote(project.id, noteInputValue);
                                setNoteInputValue("");
                            }
                        }}
                        className="hidden lg:flex gap-4 p-2 bg-background/60 rounded-3xl border border-border overflow-hidden focus-within:border-accent/50 transition-all mb-8"
                    >
                        <input
                            type="text"
                            value={noteInputValue}
                            onChange={(e) => setNoteInputValue(e.target.value)}
                            placeholder="Gedanken festhalten..."
                            className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-foreground text-lg font-bold placeholder:text-muted-foreground/30"
                        />
                        <button type="submit" className="bg-accent hover:brightness-110 text-white p-4 rounded-2xl transition-all shadow-lg">
                            <Plus size={24} strokeWidth={3} />
                        </button>
                    </form>

                    <motion.div className="grid grid-cols-1 gap-4" layout>
                        <AnimatePresence mode="popLayout">
                            {project.notes.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-16 lg:py-24 bg-foreground/5 rounded-[2rem] border-2 border-dashed border-border group"
                                >
                                    <StickyNote className="w-10 h-10 lg:w-12 lg:h-12 mx-auto text-muted-foreground/20 mb-4 group-hover:text-muted-foreground/30 transition-colors" />
                                    <p className="text-muted-foreground font-bold text-sm lg:text-lg tracking-tight">Deine Ideen.</p>
                                </motion.div>
                            )}
                            {project.notes.map((note: Note) => (
                                <motion.div
                                    key={note.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group relative p-4 lg:p-8 bg-card border border-border rounded-2xl lg:rounded-3xl hover:bg-card/80 transition-all min-h-[80px] lg:min-h-[120px] shadow-sm hover:shadow-xl"
                                >
                                    <div className="flex justify-between items-start gap-4 lg:gap-6 mb-4 lg:mb-6">
                                        {editingNoteId === note.id ? (
                                            <div className="flex-1 flex flex-col gap-3">
                                                <textarea
                                                    autoFocus
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-foreground/5 border border-border rounded-xl p-4 text-foreground font-bold outline-none focus:border-accent min-h-[100px] resize-none"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingNoteId(null)} className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors font-bold uppercase text-[10px] tracking-widest">
                                                        Abbrechen
                                                    </button>
                                                    <button onClick={() => handleSaveNote(note.id)} className="px-4 py-2 bg-accent rounded-xl text-white hover:brightness-110 transition-all font-bold uppercase text-[10px] tracking-widest">
                                                        Speichern
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="flex-1 text-foreground text-base lg:text-2xl font-bold leading-snug whitespace-pre-wrap">{note.content}</p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditNote(note)}
                                                        className="btn-ghost opacity-40 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-accent transition-all"
                                                    >
                                                        <Pencil className="w-4 h-4 lg:w-5 lg:h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteNote(note.id)}
                                                        className="btn-ghost opacity-40 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 lg:gap-4 opacity-30">
                                        <div className="h-px flex-1 bg-border" />
                                        <div className="flex flex-col items-end">
                                            <time className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                                {new Date(note.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                            </time>
                                            {note.creator?.name && (
                                                <span className="text-[9px] italic font-medium">von {note.creator.name}</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                    {/* Mobile Spacer */}
                    <div className="lg:hidden h-16" />
                </div>

                {/* Mobile-only Chat Section (Hidden on Desktop because of Overlay) */}
                <div className={`${activeTab !== "chat" ? "hidden" : "block"} lg:hidden col-span-1 space-y-4 h-[calc(100vh-200px)] min-h-[550px]`}>
                    <div className="flex items-center gap-4 bg-foreground/5 py-3 px-6 rounded-2xl border border-border">
                        <h2 className="text-lg font-black text-foreground/90 uppercase tracking-widest leading-none">Projekt Assistent</h2>
                        <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-1 rounded-md border border-accent/20 uppercase tracking-tighter">
                            KI-Powered
                        </span>
                    </div>
                    <ProjectChat project={project} aiTokensUsed={aiTokensUsed} aiTokenLimit={aiTokenLimit} />
                </div>
            </div>

            {/* AI Chat Overlay for Desktop */}
            {isChatOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-8 bg-background/90 backdrop-blur-2xl animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl h-[85vh] bg-card border border-border rounded-[2.5rem] shadow-[0_0_150px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-6 lg:px-10 lg:py-8 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/20 rounded-2xl">
                                    <Sparkles className="text-primary" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl lg:text-3xl text-foreground tracking-tight">Projekt Assistent</h3>
                                    <p className="text-xs lg:text-sm text-muted-foreground font-medium">Dein intelligenter Partner für {project.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="p-3 hover:bg-foreground/5 rounded-2xl text-muted-foreground hover:text-foreground transition-all hover:rotate-90"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Chat Window */}
                        <div className="flex-1 overflow-hidden">
                            <ProjectChat project={project} aiTokensUsed={aiTokensUsed} aiTokenLimit={aiTokenLimit} />
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <ShareDialog
                projectId={project.id}
                ownerId={project.ownerId}
                currentCollaborators={project.sharedWith}
                isOpen={isShareDialogOpen}
                onClose={() => setIsShareDialogOpen(false)}
            />

            <ProjectMenu
                projectId={project.id}
                projectName={project.name}
                isArchived={project.isArchived}
                onOpenChat={() => setIsChatOpen(true)}
                isAdmin={isAdmin}
                pendingUsersCount={pendingUsersCount}
            />
        </div>
    );
}
