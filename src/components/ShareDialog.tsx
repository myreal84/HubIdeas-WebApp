"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Search,
    X,
    UserPlus,
    UserMinus,
    Check,
    Loader2
} from "lucide-react";
import UserAvatar from "./UserAvatar";
import { getShareableUsers, shareProject, unshareProject } from "@/lib/actions";

interface User {
    id: string;
    name: string | null;
    image: string | null;
}

interface ShareDialogProps {
    projectId: string;
    ownerId?: string | null;
    currentCollaborators: User[];
    isOpen: boolean;
    onClose: () => void;
}

export default function ShareDialog({
    projectId,
    currentCollaborators,
    isOpen,
    onClose
}: ShareDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const users = await getShareableUsers();
            setAllUsers(users);
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoading(false);
        }
    };

    const isCollaborator = (userId: string) => {
        return currentCollaborators.some(c => c.id === userId);
    };

    const handleShare = async (userId: string) => {
        setActionLoadingId(userId);
        try {
            await shareProject(projectId, userId);
            // Re-load of parent state happens via revalidatePath, but we might 
            // want to update local state if needed (optional)
        } catch (error) {
            console.error("Sharing failed:", error);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleUnshare = async (userId: string) => {
        setActionLoadingId(userId);
        try {
            await unshareProject(projectId, userId);
        } catch (error) {
            console.error("Unsharing failed:", error);
        } finally {
            setActionLoadingId(null);
        }
    };

    const filteredUsers = allUsers.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-card border border-border rounded-[2rem] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <Users size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-foreground tracking-tight">Projekt teilen</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-foreground/5 rounded-xl text-muted-foreground transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-border bg-foreground/[0.02]">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Nutzer suchen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
                            <Loader2 className="animate-spin" size={24} />
                            <p className="text-xs font-bold uppercase tracking-widest">Lade Nutzer...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <p className="text-sm font-medium">Keine Nutzer gefunden.</p>
                        </div>
                    ) : (
                        filteredUsers.map(user => {
                            const active = isCollaborator(user.id);
                            const loadingAction = actionLoadingId === user.id;

                            return (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-foreground/5 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <UserAvatar src={user.image} name={user.name} size="sm" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground leading-none">{user.name}</span>
                                            {active && (
                                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                                    <Check size={10} /> Zugriff
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        disabled={!!actionLoadingId}
                                        onClick={() => active ? handleUnshare(user.id) : handleShare(user.id)}
                                        className={`p-2 rounded-xl transition-all ${active
                                                ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                                            } disabled:opacity-30`}
                                    >
                                        {loadingAction ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : active ? (
                                            <UserMinus size={18} />
                                        ) : (
                                            <UserPlus size={18} />
                                        )}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 bg-foreground/[0.02] border-t border-border">
                    <p className="text-[10px] text-muted-foreground font-medium text-center italic">
                        Nur freigeschaltete Nutzer können zur Zusammenarbeit eingeladen werden.
                    </p>
                </div>
            </div>
        </div>
    );
}
