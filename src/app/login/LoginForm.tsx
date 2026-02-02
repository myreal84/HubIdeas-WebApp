"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface LoginFormProps {
    allowCredentials?: boolean;
}

export default function LoginForm({ allowCredentials = false }: LoginFormProps) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleGoogleLogin = () => {
        setLoading(true);
        signIn("google", { callbackUrl: "/" });
    };

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl: "/"
            });

            if (res?.error) {
                setError("Ungültige E-Mail oder Passwort.");
                setLoading(false);
            } else {
                window.location.href = "/";
            }
        } catch (err) {
            setError("Ein Fehler ist aufgetreten.");
            setLoading(false);
        }
    };

    const handleAutoFill = () => {
        const stagingEmail = process.env.NEXT_PUBLIC_STAGING_ADMIN_EMAIL;
        const stagingPassword = process.env.NEXT_PUBLIC_STAGING_ADMIN_PASSWORD;
        if (stagingEmail) setEmail(stagingEmail);
        if (stagingPassword) setPassword(stagingPassword);
    };

    return (
        <div className="space-y-6">
            {allowCredentials ? (
                <form onSubmit={handleCredentialsLogin} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="E-Mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-accent/5 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium text-foreground placeholder:text-muted-foreground/50"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Passwort"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-accent/5 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium text-foreground placeholder:text-muted-foreground/50"
                            required
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleAutoFill}
                        className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider w-full text-right"
                    >
                        Staging: Auto-fill Admin
                    </button>

                    {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"
                    >
                        {loading ? "Lädt..." : "Anmelden"}
                    </button>
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground font-bold">Oder</span>
                        </div>
                    </div>
                </form>
            ) : null}

            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 px-6 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl relative overflow-hidden group"
            >
                {loading && !allowCredentials ? (
                    <div className="w-6 h-6 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span className="font-bold">Mit Google anmelden</span>
                    </>
                )}
            </button>

            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold opacity-50 mb-6">
                Sicheres Login via Google OAuth
            </p>

            <div className="bg-accent/5 border border-border rounded-xl p-4 text-xs text-muted-foreground">
                <strong>Hinweis zur Datensicherheit:</strong> Um dir intelligente Vorschläge und Chat-Funktionen zu bieten, werden deine Notizen verarbeitet. Deine Daten sind sicher gespeichert und für niemanden (auch nicht Administratoren) einsehbar, aber technisch bedingt nicht Ende-zu-Ende verschlüsselt, damit die KI damit arbeiten kann.
            </div>
        </div>
    );
}
