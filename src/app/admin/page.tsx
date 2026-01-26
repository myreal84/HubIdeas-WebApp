import { getAllUsers, updateUserStatus, updateUserRole, updateUserAiLimit } from "@/lib/actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, Shield, CheckCircle2, XCircle, Clock, UserCircle, BrainCircuit } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

export default async function AdminPage() {
    const session = await auth();
    // @ts-expect-error: role is not in the default session type
    if (session?.user?.role !== "ADMIN") {
        redirect("/");
    }

    const users = await getAllUsers();

    return (
        <main className="min-h-screen pb-20 px-4 md:px-8 max-w-6xl mx-auto pt-8">
            <header className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
                        <Shield className="w-10 h-10 text-emerald-400" />
                        Admin
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Verwalte Nutzer und Zugriffsrechte.</p>
                </div>
                <Link
                    href="/"
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group"
                >
                    <Home className="w-6 h-6 text-slate-300 group-hover:text-white" />
                </Link>
            </header>

            <div className="grid gap-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {users.map((user: any) => (
                    <div
                        key={user.id}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center hover:bg-white/[0.07] transition-all"
                    >
                        {/* User Info - Col 1-4 */}
                        <div className="md:col-span-4 flex items-center gap-4 overflow-hidden">
                            <UserAvatar src={user.image} name={user.name} />
                            <div className="min-w-0">
                                <h3 className="text-xl font-bold text-white leading-tight truncate">
                                    {user.name || "Unbekannter Nutzer"}
                                </h3>
                                <p className="text-sm text-slate-400 font-medium truncate">{user.email}</p>
                            </div>
                        </div>

                        {/* Badges - Col 5-7 */}
                        <div className="md:col-span-3 flex flex-wrap items-center gap-3">
                            {/* Role Badge */}
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${user.role === "ADMIN"
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                }`}>
                                {user.role}
                            </div>

                            {/* Status Badge */}
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 uppercase tracking-wider ${user.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : user.status === "REJECTED"
                                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                    : "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse"
                                }`}>
                                {user.status === "APPROVED" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {user.status === "REJECTED" && <XCircle className="w-3.5 h-3.5" />}
                                {user.status === "WAITING" && <Clock className="w-3.5 h-3.5" />}
                                {user.status}
                            </div>
                        </div>

                        {/* AI Token Section - Col 8-10 */}
                        <div className="md:col-span-3 md:border-l border-white/5 md:pl-6">
                            <div className="flex items-center gap-2 mb-2 text-slate-300">
                                <BrainCircuit className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-bold uppercase tracking-wider">AI Kontingent</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="text-slate-400">Verbraucht:</span>
                                    <span className="text-white">{(user.aiTokensUsed || 0).toLocaleString()} Token</span>
                                </div>
                                <form action={async (formData: FormData) => {
                                    'use server';
                                    const limit = parseInt(formData.get("limit") as string);
                                    if (!isNaN(limit)) {
                                        await updateUserAiLimit(user.id, limit);
                                    }
                                }} className="flex items-center gap-2 mt-1">
                                    <input
                                        type="number"
                                        name="limit"
                                        defaultValue={user.aiTokenLimit}
                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-500/50 w-full"
                                        placeholder="Limit"
                                    />
                                    <button
                                        type="submit"
                                        className="text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all"
                                    >
                                        Set
                                    </button>
                                </form>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1">
                                    <div
                                        className="h-full bg-purple-500/50 transition-all"
                                        style={{ width: `${Math.min(100, ((user.aiTokensUsed || 0) / (user.aiTokenLimit || 1)) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Actions - Col 11-12 */}
                        <div className="md:col-span-2 flex items-center justify-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                            {user.status !== "APPROVED" && (
                                <form action={async () => {
                                    'use server';
                                    await updateUserStatus(user.id, "APPROVED");
                                }}>
                                    <button className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all border border-emerald-500/20 group" title="Freischalten">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </button>
                                </form>
                            )}
                            {user.status !== "REJECTED" && (
                                <form action={async () => {
                                    'use server';
                                    await updateUserStatus(user.id, "REJECTED");
                                }}>
                                    <button className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all border border-rose-500/20" title="Ablehnen">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </form>
                            )}
                            <form action={async () => {
                                'use server';
                                await updateUserRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN");
                            }}>
                                <button className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10" title={user.role === "ADMIN" ? "Admin-Rechte entziehen" : "Zum Admin machen"}>
                                    <Shield className={`w-6 h-6 ${user.role === "ADMIN" ? "text-amber-400" : "text-slate-400"}`} />
                                </button>
                            </form>
                        </div>
                    </div>
                ))}

                {users.length === 0 && (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                        <UserCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">Keine Nutzer gefunden.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
