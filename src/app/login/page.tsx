"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await signIn("credentials", {
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Falsches Passwort – Bitte erneut versuchen");
            setLoading(false);
        } else {
            router.push("/");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md">
                <div className="card-premium !p-10 backdrop-blur-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />

                    <div className="text-center mb-10">
                        <h1 className="text-5xl font-black title-font tracking-tighter mb-4 text-white">
                            HubIdeas
                        </h1>
                        <p className="text-slate-400 font-medium">Melde dich an, um fortzufahren.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <input
                                name="password"
                                type="password"
                                placeholder="Passwort"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full input-glow !py-4 !text-center !text-2xl tracking-[0.3em] font-black"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-center text-sm font-bold animate-pulse">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary !py-5 flex items-center justify-center gap-3 shadow-2xl shadow-primary/30"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="uppercase tracking-[0.2em] font-black text-sm">Login</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
