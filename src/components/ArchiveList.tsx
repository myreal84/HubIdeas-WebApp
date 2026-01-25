"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { updateProjectStatus, deleteProject } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface ArchiveListProps {
    projects: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function ArchiveList({ projects }: ArchiveListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleRestore = async (id: string) => {
        await updateProjectStatus(id, false);
        router.refresh();
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        try {
            await deleteProject(id);
            setDeletingId(null);
            router.refresh();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Fehler beim Löschen");
        } finally {
            setIsDeleting(false);
        }
    };

    const projectToDelete = projects.find(p => p.id === deletingId);

    return (
        <div className="space-y-4">
            <div className="responsive-grid">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        className="p-8 bg-foreground/5 border border-border rounded-[2.5rem] hover:bg-foreground/[0.07] transition-all group relative overflow-hidden"
                    >
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-2xl font-bold text-muted-foreground line-through decoration-muted-foreground/30">
                                    {project.name}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRestore(project.id)}
                                        className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all border border-primary/20"
                                        title="Reaktivieren"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingId(project.id)}
                                        className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all border border-red-500/20"
                                        title="Endgültig löschen"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between">
                                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
                                    {project._count.todos} Aufgaben
                                </div>
                                <Link
                                    href={`/project/${project.id}`}
                                    className="p-2 rounded-xl bg-foreground/5 text-muted-foreground hover:text-foreground transition-all"
                                >
                                    <ChevronRight size={20} />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl animate-fade-in">
                    <div className="w-full max-w-md bg-card border border-border rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />

                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-8 mx-auto">
                            <AlertTriangle size={40} />
                        </div>

                        <h2 className="text-2xl font-black text-center mb-4">Projekt löschen?</h2>
                        <p className="text-muted-foreground text-center font-medium mb-10">
                            Willst du das Projekt <span className="text-foreground font-bold">&quot;{projectToDelete?.name}&quot;</span> wirklich endgültig löschen? Das kann nicht rückgängig gemacht werden.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleDelete(deletingId)}
                                disabled={isDeleting}
                                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : "Ja, endgültig löschen"}
                            </button>
                            <button
                                onClick={() => setDeletingId(null)}
                                disabled={isDeleting}
                                className="w-full py-4 bg-foreground/5 text-foreground rounded-2xl font-black uppercase tracking-widest hover:bg-foreground/10 transition-all"
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
