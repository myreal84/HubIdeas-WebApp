"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Menu as MenuIcon,
    X,
    Archive,
    Moon,
    Sun,
    Monitor,
    RotateCcw,
    Home,
    ArrowLeft,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { updateProjectStatus } from '@/lib/actions';

interface ProjectMenuProps {
    projectId: string;
    projectName: string;
    isArchived: boolean;
    onOpenChat?: () => void;
}

export default function ProjectMenu({
    projectId,
    projectName,
    isArchived,
    onOpenChat
}: ProjectMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const handleToggleStatus = async () => {
        await updateProjectStatus(projectId, !isArchived);
        setIsOpen(false);
    };

    const menuContent = (
        <>
            {/* Menu Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 right-4 z-50 w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center text-foreground hover:scale-110 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 shadow-xl group"
            >
                <div className="relative">
                    <MenuIcon size={20} className="group-hover:rotate-12 transition-transform" />
                </div>
            </button>

            {/* Overlay */}
            <div
                className={`fixed inset-0 z-[60] transition-all duration-700 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Backdrop blur */}
                <div
                    className="absolute inset-0 bg-background/60 backdrop-blur-md"
                    onClick={() => setIsOpen(false)}
                />

                {/* Content */}
                <div className={`absolute inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                    <div className="h-full flex flex-col p-10 md:p-16 overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter line-clamp-1">{projectName}</h2>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isArchived ? 'bg-slate-400' : 'bg-primary animate-pulse'}`} />
                                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            {isArchived ? 'Archiviert' : 'Aktiv'}
                                        </span>
                                    </div>
                                    <div className="w-px h-3 bg-border" />
                                    <div className="flex gap-1">
                                        {[
                                            { id: 'light', icon: <Sun size={14} /> },
                                            { id: 'dark', icon: <Moon size={14} /> },
                                            { id: 'system', icon: <Monitor size={14} /> },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTheme(t.id)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${theme === t.id
                                                    ? 'bg-primary/10 text-primary shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                                                    }`}
                                            >
                                                {t.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center hover:bg-foreground/10 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Actions Section */}
                        <div className="mb-12">
                            <label className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Projekt-Status</label>
                            <div className="space-y-3">
                                {!isArchived && onOpenChat && (
                                    <button
                                        onClick={() => {
                                            onOpenChat();
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-xl group bg-gradient-to-br from-primary to-accent text-white hover:brightness-110"
                                    >
                                        <Sparkles className="w-5 h-5 animate-pulse" />
                                        <span>Chat Assistent</span>
                                    </button>
                                )}
                                <button
                                    onClick={handleToggleStatus}
                                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all group ${isArchived
                                        ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                                        : 'bg-foreground/5 border-transparent hover:border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {isArchived ? (
                                        <>
                                            <RotateCcw size={20} className="group-hover:-rotate-45 transition-transform" />
                                            <span className="font-bold">Projekt reaktivieren</span>
                                        </>
                                    ) : (
                                        <>
                                            <Archive size={20} className="group-hover:scale-110 transition-transform" />
                                            <span className="font-bold">Projekt archivieren</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Navigation Section */}
                        <div className="mb-12">
                            <label className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Navigieren</label>
                            <div className="space-y-3">
                                <Link
                                    href="/"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-between p-5 bg-foreground/5 border border-border rounded-2xl hover:bg-foreground/10 group transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <Home size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                        <span className="font-bold">Zur Übersicht</span>
                                    </div>
                                    <ArrowLeft size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all rotate-180" />
                                </Link>
                                <Link
                                    href="/archive"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-between p-5 bg-foreground/5 border border-border rounded-2xl hover:bg-foreground/10 group transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <Archive size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                        <span className="font-bold">Zum Archiv</span>
                                    </div>
                                    <ArrowLeft size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all rotate-180" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(menuContent, document.body);
}
