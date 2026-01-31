import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
    // Runtime env check - this works within Docker container at runtime
    const allowCredentials = process.env.ALLOW_CREDENTIALS === "true" || process.env.NEXT_PUBLIC_ALLOW_CREDENTIALS === "true";

    return (
        <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in text-white">
            <div className="w-full max-w-md">
                <div className="card-premium !p-12 backdrop-blur-3xl relative overflow-hidden bg-slate-900/50 border border-white/10 rounded-[2rem]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />

                    <div className="text-center mb-10">
                        <h1 className="text-5xl font-black title-font tracking-tighter mb-4 text-white">
                            HubIdeas
                        </h1>
                        <p className="text-slate-400 font-medium italic">Vom Gedanken zum Projekt.</p>
                    </div>

                    <LoginForm allowCredentials={allowCredentials} />
                </div>
            </div>
        </div>
    );
}
