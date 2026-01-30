"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Search,
    Menu as MenuIcon,
    X,
    Archive,
    Moon,
    Sun,
    Monitor,
    Hash,
    Zap,
    Sparkles,
    ArrowRight,
    Shield,
    LogOut,
    ListTodo
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';

import PushManager from './PushManager';

interface MainMenuProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sortOption: string;
    setSortOption: (option: string) => void;
    vapidPublicKey: string;
    activeCount: number;
    isAdmin?: boolean;
    pendingUsersCount?: number;
}

export default function MainMenu({
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    vapidPublicKey,
    activeCount,
    isAdmin,
    pendingUsersCount = 0
}: MainMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (searchQuery.length > 1) {
            const timer = setTimeout(async () => {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                setSearchResults(data.results || []);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

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
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-background bg-amber-500" />
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
                                <h2 className="text-4xl font-black uppercase tracking-tighter">Menü</h2>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{activeCount} Aktiv</span>
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

                        {/* Search Section */}
                        <div className="mb-12">
                            <label className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Suche</label>
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Projekte, Notizen, Aufgaben..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-foreground/5 border border-border rounded-2xl py-4 pl-14 pr-6 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                />
                                <AnimatePresence>
                                    {searchResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                                        >
                                            {searchResults.map((res: any) => (
                                                <Link
                                                    key={`${res.type}-${res.id}`}
                                                    href={res.url}
                                                    onClick={() => {
                                                        setIsOpen(false);
                                                        setSearchQuery("");
                                                    }}
                                                    className="flex flex-col p-4 hover:bg-primary/5 border-b border-border last:border-0 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {res.type === 'project' && <Zap size={14} className="text-primary" />}
                                                        {res.type === 'todo' && <ListTodo size={14} className="text-accent" />}
                                                        {res.type === 'note' && <Sparkles size={14} className="text-amber-500" />}
                                                        <span className="font-bold text-sm line-clamp-1">{res.title}</span>
                                                    </div>
                                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{res.subtitle}</span>
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Sorting Section */}
                        <div className="mb-12">
                            <label className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Sortierung</label>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'smart', label: 'Smart Hybrid', icon: <Sparkles size={18} /> },
                                    { id: 'newest', label: 'Neueste zuerst', icon: <Hash size={18} /> },
                                    { id: 'activity', label: 'Letzte Aktivität', icon: <Zap size={18} /> },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSortOption(opt.id)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${sortOption === opt.id
                                            ? 'bg-primary/10 border-primary/30 text-primary'
                                            : 'bg-foreground/5 border-transparent hover:border-border text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {opt.icon}
                                        <span className="font-bold">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Section */}
                        <div className="mb-12">
                            <label className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Navigieren</label>
                            <Link
                                href="/archive"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between p-5 bg-foreground/5 border border-border rounded-2xl hover:bg-foreground/10 group transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <Archive size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="font-bold">Zum Archiv</span>
                                </div>
                                <ArrowRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </Link>
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

                        {/* Notifications Section */}
                        <div className="mb-12">
                            <label className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Erinnerungen</label>
                            <PushManager vapidPublicKey={vapidPublicKey} />
                        </div>

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
