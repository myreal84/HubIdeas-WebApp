"use client";

import { signOut } from "next-auth/react";
import { Clock, LogOut } from "lucide-react";

export default function WaitingRoom() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full bg-card border border-border rounded-[2.5rem] p-12 text-center shadow-2xl animate-fade-in">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Clock size={40} className="text-primary animate-pulse" />
                </div>

                <h1 className="text-4xl font-black title-font tracking-tight mb-4 uppercase">
                    Warte-Raum
                </h1>

                <p className="text-muted-foreground font-medium mb-12 leading-relaxed">
                    Dein Zugang wurde registriert. Bitte warte, bis ein Administrator dein Konto freigeschaltet hat.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                    >
                        Status prüfen
                    </button>

                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full py-4 bg-foreground/5 text-muted-foreground rounded-2xl font-bold uppercase tracking-widest hover:bg-foreground/10 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        Abmelden
                    </button>
                </div>
            </div>
        </div>
    );
}
