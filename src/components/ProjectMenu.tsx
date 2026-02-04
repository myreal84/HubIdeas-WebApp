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
    Sparkles,
    Shield,
    ArrowRight,
    LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { updateProjectStatus } from '@/lib/actions';

interface ProjectMenuProps {
    projectId: string;
    projectName: string;
    isArchived: boolean;
    onOpenChat?: () => void;
    isAdmin?: boolean;
    pendingUsersCount?: number;
    disableChat?: boolean;
}

export default function ProjectMenu({
    projectId,
    projectName,
    isArchived,
    onOpenChat,
    isAdmin,
    pendingUsersCount = 0,
    disableChat = false
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
                    {pendingUsersCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-background" />
                    )}
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
                                            if (!disableChat) {
                                                onOpenChat();
                                                setIsOpen(false);
                                            }
                                        }}
                                        disabled={disableChat}
                                        className={`w-full flex items-center justify-center gap-3 p-5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-xl group ${disableChat
                                            ? 'bg-foreground/10 text-muted-foreground cursor-not-allowed border border-transparent opacity-70'
                                            : 'bg-gradient-to-br from-primary to-accent text-white hover:brightness-110'
                                            }`}
                                    >
                                        {disableChat ? (
                                            <Sparkles className="w-5 h-5 opacity-50" />
                                        ) : (
                                            <Sparkles className="w-5 h-5 animate-pulse" />
                                        )}
                                        <span>{disableChat ? 'Limit Erreicht' : 'Chat Assistent'}</span>
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

                        {isAdmin && (
                            <div className="mb-12">
                                <label className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Administration</label>
                                <Link
                                    href="/admin"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-between p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl hover:bg-amber-500/10 group transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Shield size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                            {pendingUsersCount > 0 && (
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-amber-500">Admin Menü</span>
                                            {pendingUsersCount > 0 && (
                                                <span className="text-[10px] uppercase tracking-wider font-black text-amber-500/60 mt-0.5">
                                                    {pendingUsersCount} Neue Anfragen
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ArrowRight size={18} className="text-amber-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </Link>
                            </div>
                        )}

                        {/* Account Section */}
                        <div className="mt-auto pt-12 border-t border-border">
                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center justify-between p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl hover:bg-rose-500/10 group transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <LogOut size={20} className="text-rose-500 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-rose-500">Abmelden</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(menuContent, document.body);
}
