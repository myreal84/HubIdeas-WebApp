"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ListChecks, ChevronRight, Sparkles, Zap, Clock, Search } from 'lucide-react';
import MainMenu from './MainMenu';
import { Project } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectWithCount extends Project {
    _count: {
        todos: number;
    }
}

interface ProjectDashboardProps {
    initialProjects: ProjectWithCount[];
    vapidPublicKey: string;
    isAdmin?: boolean;
    pendingUsersCount?: number;
}

export default function ProjectDashboard({ initialProjects, vapidPublicKey, isAdmin, pendingUsersCount }: ProjectDashboardProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("smart");
    const [randomSeed, setRandomSeed] = useState(0);

    const activeCount = initialProjects.length;

    // Shuffle helper
    const shuffle = (array: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        let currentIndex = array.length, randomIndex;
        const newArray = [...array];
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
        }
        return newArray;
    };

    // Reshuffle on every load/mount
    useEffect(() => {
        setRandomSeed(Math.random());
    }, []);

    const filteredAndSorted = useMemo(() => {
        const filtered = initialProjects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (sortOption === 'newest') {
            return { all: [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
        }

        if (sortOption === 'activity') {
            return { all: [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) };
        }

        // Smart Hybrid logic
        if (sortOption === 'smart') {
            const now = new Date();
            const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

            const zone1: ProjectWithCount[] = []; // Active
            const zone2: ProjectWithCount[] = []; // Reminded
            const zone3: ProjectWithCount[] = []; // Inspiration

            filtered.forEach(p => {
                const lastOpened = p.lastOpenedAt ? new Date(p.lastOpenedAt) : new Date(0);
                const lastReminded = p.lastRemindedAt ? new Date(p.lastRemindedAt) : new Date(0);

                if (lastOpened > fourteenDaysAgo) {
                    zone1.push(p);
                } else if (lastReminded > sevenDaysAgo) {
                    zone2.push(p);
                } else {
                    zone3.push(p);
                }
            });

            // Sort Zone 1 & 2 by time descending
            zone1.sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime());
            zone2.sort((a, b) => (b.lastRemindedAt ? new Date(b.lastRemindedAt).getTime() : 0) - (a.lastRemindedAt ? new Date(a.lastRemindedAt).getTime() : 0));

            // Zone 3: Shuffle
            const shuffledZone3 = shuffle(zone3);

            return { zone1, zone2, zone3: shuffledZone3 };
        }

        return { all: filtered };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialProjects, searchQuery, sortOption, randomSeed]);

    const renderProjectCard = (project: ProjectWithCount, idx: number) => (
        <motion.div
            key={project.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
        >
            <Link
                href={`/project/${project.id}`}
                className="card-premium group relative overflow-hidden flex flex-col justify-between min-h-[240px] h-full"
            >
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/20 transition-all duration-700" />

                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-4 line-clamp-2">
                        {project.name}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-wider bg-foreground/5 w-fit px-4 py-2 rounded-xl border border-border group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                        <ListChecks size={14} className="text-primary" />
                        <span>{project._count.todos} Aufgaben</span>
                    </div>
                </div>

                <div className="relative z-10 flex items-center text-primary font-black text-[11px] uppercase tracking-[0.2em] transform transition-all duration-500 group-hover:translate-x-2">
                    Projekt öffnen <ChevronRight size={14} className="ml-1" />
                </div>
            </Link>
        </motion.div>
    );

    return (
        <div className="space-y-20">
            <MainMenu
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortOption={sortOption}
                setSortOption={setSortOption}
                vapidPublicKey={vapidPublicKey}
                activeCount={activeCount}
                isAdmin={isAdmin}
                pendingUsersCount={pendingUsersCount}
            />

            {sortOption === 'smart' ? (
                <>
                    {/* Zone 1: Aktiv */}
                    {(filteredAndSorted.zone1?.length ?? 0) > 0 && (
                        <section>
                            <div className="flex items-center gap-4 mb-10">
                                <div className="flex items-center gap-3 bg-primary/10 py-3 px-6 rounded-2xl border border-primary/20">
                                    <Zap size={20} className="text-primary" />
                                    <h2 className="text-xl font-black uppercase tracking-widest text-primary leading-none">Aktiv</h2>
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                            </div>
                            <motion.div className="responsive-grid" layout>
                                <AnimatePresence mode="popLayout">
                                    {filteredAndSorted.zone1!.map((p, i) => renderProjectCard(p, i))}
                                </AnimatePresence>
                            </motion.div>
                        </section>
                    )}

                    {/* Zone 2: Erinnert */}
                    {(filteredAndSorted.zone2?.length ?? 0) > 0 && (
                        <section>
                            <div className="flex items-center gap-4 mb-10">
                                <div className="flex items-center gap-3 bg-accent/10 py-3 px-6 rounded-2xl border border-accent/20">
                                    <Clock size={20} className="text-accent" />
                                    <h2 className="text-xl font-black uppercase tracking-widest text-accent leading-none">Wiederbelebt</h2>
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-accent/20 to-transparent" />
                            </div>
                            <motion.div className="responsive-grid" layout>
                                <AnimatePresence mode="popLayout">
                                    {filteredAndSorted.zone2!.map((p, i) => renderProjectCard(p, i))}
                                </AnimatePresence>
                            </motion.div>
                        </section>
                    )}

                    {/* Zone 3: Inspiration */}
                    {(filteredAndSorted.zone3?.length ?? 0) > 0 && (
                        <section>
                            <div className="flex items-center gap-4 mb-10">
                                <div className="flex items-center gap-3 bg-foreground/5 py-3 px-6 rounded-2xl border border-border">
                                    <Sparkles size={20} className="text-muted-foreground" />
                                    <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground leading-none">Inspiration</h2>
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-foreground/10 to-transparent" />
                            </div>
                            <motion.div className="responsive-grid" layout>
                                <AnimatePresence mode="popLayout">
                                    {filteredAndSorted.zone3!.map((p, i) => renderProjectCard(p, i))}
                                </AnimatePresence>
                            </motion.div>
                        </section>
                    )}

                    {(filteredAndSorted.zone1?.length === 0 && filteredAndSorted.zone2?.length === 0 && filteredAndSorted.zone3?.length === 0) && (
                        <EmptyState />
                    )}
                </>
            ) : (
                <section>
                    <div className="flex items-center gap-6 mb-10">
                        <div className="flex items-center gap-4 bg-foreground/5 py-3 px-6 rounded-2xl border border-border">
                            <h2 className="text-2xl font-black uppercase tracking-widest text-foreground/90 leading-none">Projekte</h2>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-foreground/10 to-transparent" />
                    </div>
                    {filteredAndSorted.all?.length === 0 ? <EmptyState /> : (
                        <motion.div className="responsive-grid" layout>
                            <AnimatePresence mode="popLayout">
                                {filteredAndSorted.all!.map((p, i) => renderProjectCard(p, i))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </section>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-32 px-6 bg-foreground/5 rounded-[3rem] border-2 border-dashed border-border group">
            <div className="w-24 h-24 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-700">
                <Search size={48} className="text-muted-foreground/30" />
            </div>
            <p className="text-2xl text-muted-foreground font-bold">Nichts gefunden.</p>
            <p className="text-muted-foreground/60 mt-3 font-medium">Probiere es mit einem anderen Suchbegriff.</p>
        </div>
    );
}
