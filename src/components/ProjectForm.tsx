"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createProject, addTodo } from "@/lib/actions";
import { Plus, Sparkles, X, Check, Loader2 } from "lucide-react";

export default function ProjectForm() {
    const [name, setName] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [suggesting, setSuggesting] = useState(false);
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
    const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || loading) return;

        setLoading(true);
        try {
            const project = await createProject(name, note);
            setCreatedProjectId(project.id);
            setLoading(false);

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
                            className="w-full bg-foreground/5 border border-border rounded-2xl p-4 text-foreground outline-none focus:border-primary/50 transition-all min-h-[100px] font-medium placeholder:text-muted-foreground/40"
                            disabled={loading}
                        />
                    </div>
                )}
            </form>

            {/* AI Suggestions Popup - Portal to body to fix stacking context */}
            {showSuggestions && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/90 backdrop-blur-2xl animate-in fade-in duration-300 isolate">
                    <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-[0_0_150px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/20 via-primary/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <Sparkles className="text-primary" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">KI-Vorschläge</h3>
                                    <p className="text-xs text-slate-400">Direkt loslegen mit diesen Schritten</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSuggestions(false)}
                                className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#0f172a]">
                            {suggesting ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse rounded-full" />
                                        <Loader2 className="text-primary animate-spin relative" size={48} />
                                    </div>
                                    <p className="text-slate-400 animate-pulse font-medium">Überlege mir was...</p>
                                </div>
                            ) : (
                                suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${addedIndices.has(i)
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 translate-x-1'
                                            : 'bg-foreground/5 border-border hover:border-primary/50 hover:bg-foreground/10 text-foreground shadow-sm'
                                            }`}
                                    >
                                        <p className="font-medium pr-4 leading-relaxed">{s}</p>
                                        <button
                                            onClick={() => handleAddSuggestion(s, i)}
                                            disabled={addedIndices.has(i)}
                                            className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-300 ${addedIndices.has(i)
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                : 'bg-foreground/10 hover:bg-primary hover:text-white text-muted-foreground group-hover:scale-110 active:scale-95'
                                                }`}
                                        >
                                            {addedIndices.has(i) ? <Check size={20} /> : <Plus size={20} />}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {!suggesting && (
                            <div className="p-6 bg-card border-t border-border flex gap-3">
                                <button
                                    onClick={() => setShowSuggestions(false)}
                                    className="flex-1 py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-primary/20"
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

