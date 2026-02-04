"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createProject, addTodo } from "@/lib/actions";
import { Plus, Sparkles, X, Check, Loader2 } from "lucide-react";

export default function ProjectForm({ onProjectCreated, aiTokensUsed = 0, aiTokenLimit = 2000 }: { onProjectCreated?: () => void, aiTokensUsed?: number, aiTokenLimit?: number }) {
    const [name, setName] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [suggesting, setSuggesting] = useState(false);
    const [useAI, setUseAI] = useState(true);
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
    const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());
    const [mounted, setMounted] = useState(false);

    const isLimitReached = aiTokensUsed >= aiTokenLimit;

    useEffect(() => {
        setMounted(true);
        if (isLimitReached) {
            setUseAI(false);
        }
    }, [isLimitReached]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || loading) return;

        // Reset state for new project
        setAddedIndices(new Set());

        setLoading(true);
        try {
            const project = await createProject(name, note);
            setCreatedProjectId(project.id);
            if (onProjectCreated) onProjectCreated();
            setLoading(false);

            if (useAI && !isLimitReached) {
                // Start AI suggestion process
                setSuggesting(true);
                setShowSuggestions(true);

                const res = await fetch('/api/ai/suggest-todos', {
                    method: 'POST',
                    body: JSON.stringify({ title: name, note: note }),
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();
                if (data.suggestions) {
                    setSuggestions(data.suggestions);
                }
            }
        } catch (error) {
            console.error(error);
            setLoading(false);
        } finally {
            setSuggesting(false);
            setName("");
            setNote("");
        }
    };

    const handleAddSuggestion = async (todoText: string, index: number) => {
        if (!createdProjectId || addedIndices.has(index)) return;

        try {
            await addTodo(createdProjectId, todoText);
            setAddedIndices(prev => new Set(prev).add(index));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 w-full relative z-10">
                <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Was ist deine Idee?"
                        className="flex-1 input-glow !text-xl font-bold placeholder:text-muted-foreground/40"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="btn-primary !px-10 !py-4 flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale transition-all shadow-2xl shadow-primary/20"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Plus size={24} strokeWidth={3} />
                                <span className="uppercase tracking-widest text-xs font-black">Erstellen</span>
                            </>
                        )}
                    </button>
                </div>

                {name.trim().length > 0 && (
                    <div className="animate-fade-in">
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Hast du schon Details oder Notizen dazu?"
                            className="w-full input-glow p-4 min-h-[100px] font-medium placeholder:text-muted-foreground/40"
                            disabled={loading}
                        />
                    </div>
                )}

                <div className="flex items-center gap-3 px-1 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <button
                        type="button"
                        onClick={() => !isLimitReached && setUseAI(!useAI)}
                        disabled={isLimitReached}
                        className={`group flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${isLimitReached
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 opacity-80 cursor-not-allowed'
                            : useAI
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'bg-foreground/5 border-border text-muted-foreground'
                            }`}
                    >
                        <div className={`p-1 rounded-lg transition-colors ${isLimitReached
                            ? 'bg-red-500/20 text-red-500'
                            : useAI
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-foreground/10 text-muted-foreground'
                            }`}>
                            {isLimitReached ? <X size={14} strokeWidth={2.5} /> : (useAI ? <Sparkles size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />)}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isLimitReached ? 'Limit erreicht' : `KI-Vorschläge ${useAI ? 'aktiv' : 'aus'}`}
                        </span>
                    </button>
                    <p className="text-[9px] text-muted-foreground/40 font-medium leading-none max-w-[200px]">
                        {isLimitReached ? 'Upgrade deinen Plan für mehr KI.' : 'Lass dir automatisch erste Aufgaben für dein Projekt vorschlagen.'}
                    </p>
                </div>
            </form>

            {/* AI Suggestions Popup - Premium Redesign */}
            {showSuggestions && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="relative w-full max-w-xl bg-[#0F1117] border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(124,58,237,0.15)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-500 flex flex-col max-h-[85vh]">

                        {/* Header with animated gradient */}
                        <div className="relative p-8 pb-6 border-b border-white/5 flex items-center justify-between z-10 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="p-3 bg-gradient-to-br from-primary to-violet-600 rounded-2xl shadow-lg shadow-primary/20 ring-1 ring-white/10">
                                    <Sparkles className="text-white" size={24} strokeWidth={2} />
                                </div>
                                <div>
                                    <h3 className="font-black text-2xl text-white tracking-tight leading-none mb-1.5">KI-Vorschläge</h3>
                                    <p className="text-sm text-slate-400 font-medium">Bekomme Starthilfe für dein Projekt</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSuggestions(false)}
                                className="relative z-10 p-3 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all hover:rotate-90 active:scale-90"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3 relative">
                            {/* Ambient background glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[200px] bg-primary/5 blur-[100px] pointer-events-none" />

                            {suggesting ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-6 relative z-10">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/30 blur-3xl animate-pulse rounded-full" />
                                        <div className="relative p-6 bg-white/5 border border-white/10 rounded-full animate-spin-slow">
                                            <Loader2 className="text-primary animate-spin" size={40} />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h4 className="text-lg font-bold text-white animate-pulse">Analysiere deine Idee...</h4>
                                        <p className="text-sm text-slate-500">Suche nach passenden Aufgaben</p>
                                    </div>
                                </div>
                            ) : (
                                suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        className={`group relative flex items-center justify-between p-4 pl-5 rounded-2xl border transition-all duration-300 ${addedIndices.has(i)
                                            ? 'bg-emerald-500/5 border-emerald-500/20'
                                            : 'bg-white/[0.03] border-white/5 hover:border-primary/30 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4 pr-4">
                                            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-500 ${addedIndices.has(i) ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600 group-hover:bg-primary'
                                                }`} />
                                            <p className={`text-sm md:text-base font-medium leading-relaxed transition-colors ${addedIndices.has(i) ? 'text-emerald-400/80 line-through decoration-emerald-500/30' : 'text-slate-200 group-hover:text-white'
                                                }`}>
                                                {s}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleAddSuggestion(s, i)}
                                            disabled={addedIndices.has(i)}
                                            className={`flex-shrink-0 relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${addedIndices.has(i)
                                                ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                                                : 'bg-white/5 text-slate-400 hover:bg-primary hover:text-white hover:scale-110 hover:shadow-lg hover:shadow-primary/25 active:scale-95'
                                                }`}
                                        >
                                            {addedIndices.has(i) ? (
                                                <Check size={18} strokeWidth={3} className="animate-in zoom-in spin-in-90 duration-300" />
                                            ) : (
                                                <Plus size={18} strokeWidth={3} />
                                            )}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {!suggesting && (
                            <div className="p-6 border-t border-white/5 bg-[#0F1117]/50 backdrop-blur-md relative z-20">
                                <button
                                    onClick={() => setShowSuggestions(false)}
                                    className="w-full py-4 bg-gradient-to-r from-primary to-violet-600 text-white font-bold uppercase tracking-widest text-xs rounded-2xl transition-all hover:brightness-110 active:scale-[0.98] shadow-lg shadow-primary/25 border border-white/10"
                                >
                                    Fertig
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

