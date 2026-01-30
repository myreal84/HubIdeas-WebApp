"use client";

import { signOut, useSession } from "next-auth/react";
import { Clock, LogOut, RefreshCcw, XCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function WaitingRoom() {
    const { data: session, update } = useSession();
    const [checking, setChecking] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const router = useRouter();

    const userStatus = (session?.user as any)?.status || "WAITING";

    const handleCheckStatus = async () => {
        setChecking(true);
        setStatusMessage(null);
        try {
            const res = await fetch("/api/user/status");
            const data = await res.json();

            if (data.status === "APPROVED") {
                // Now that we know they are approved in DB, trigger update to refresh JWT
                await update();
            } else if (data.status === "WAITING") {
                setStatusMessage("Noch nicht freigeschaltet. Falls es länger dauert, kontaktiere bitte den Admin.");
            } else if (data.status === "REJECTED") {
                setStatusMessage("Dein Zugang wurde abgelehnt. Bitte kontaktiere den Administrator.");
            }
        } catch (err) {
            setStatusMessage("Fehler beim Prüfen des Status. Bitte versuche es erneut.");
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <AnimatePresence mode="wait">
                {userStatus === "APPROVED" ? (
                    <motion.div
                        key="approved"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-card border border-primary/20 rounded-[2.5rem] p-12 text-center shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                        <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 relative z-10">
                            <CheckCircle2 size={40} className="text-primary" />
                        </div>
                        <h1 className="text-4xl font-black title-font tracking-tight mb-4 uppercase relative z-10">
                            Freigeschaltet!
                        </h1>
                        <p className="text-muted-foreground font-medium mb-12 leading-relaxed relative z-10">
                            Willkommen an Bord! Dein Zugang wurde genehmigt.
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 relative z-10"
                        >
                            Loslegen
                            <ArrowRight size={20} />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="waiting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-md w-full bg-card border border-border rounded-[2.5rem] p-12 text-center shadow-2xl"
                    >
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            {userStatus === "REJECTED" ? (
                                <XCircle size={40} className="text-rose-500" />
                            ) : (
                                <Clock size={40} className="text-primary animate-pulse" />
                            )}
                        </div>

                        <h1 className="text-4xl font-black title-font tracking-tight mb-4 uppercase">
                            {userStatus === "REJECTED" ? "Abgelehnt" : "Warte-Raum"}
                        </h1>

                        <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
                            {userStatus === "REJECTED"
                                ? "Dein Zugang wurde leider abgelehnt. Bitte kontaktiere den Administrator für weitere Informationen."
                                : "Dein Zugang wurde registriert. Bitte warte, bis ein Administrator dein Konto freigeschaltet hat."}
                        </p>

                        {statusMessage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`mb-8 p-4 rounded-xl text-sm font-bold border ${userStatus === "REJECTED" ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-primary/10 border-primary/20 text-primary"
                                    }`}
                            >
                                {statusMessage}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <button
                                onClick={handleCheckStatus}
                                disabled={checking}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <RefreshCcw size={20} className={checking ? "animate-spin" : ""} />
                                {checking ? "Prüfe..." : "Status prüfen"}
                            </button>

                            <button
                                onClick={() => signOut({ callbackUrl: "/login", redirect: true })}
                                className="w-full py-4 bg-foreground/5 text-muted-foreground rounded-2xl font-bold uppercase tracking-widest hover:bg-foreground/10 transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut size={18} />
                                Abmelden
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
