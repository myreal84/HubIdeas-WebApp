import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import ProjectForm from "@/components/ProjectForm";
import { prisma } from "@/lib/prisma";
import ProjectDashboard from "@/components/ProjectDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const activeProjects = (await prisma.project.findMany({
    where: { isArchived: false },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { todos: { where: { isCompleted: false } } }
      }
    }
  })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Recommendation Logic: Pick a project not updated in 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const forgottenProjects = activeProjects.filter((p: any) => new Date(p.updatedAt) < threeDaysAgo); // eslint-disable-line @typescript-eslint/no-explicit-any
  const recommendation = forgottenProjects.length > 0
    ? forgottenProjects[Math.floor(Math.random() * forgottenProjects.length)]
    : null;

  return (
    <div className="main-container animate-fade-in relative">
      <header className="mb-16 flex flex-col md:flex-row justify-between items-start gap-8 mt-12">
        <div>
          <h1 className="text-7xl md:text-8xl font-black title-font tracking-tight text-foreground mb-4">
            HubIdeas
          </h1>
          <p className="text-muted-foreground text-xl md:text-2xl font-medium max-w-lg leading-tight">Vom Gedanken zum Projekt – alles im Fluss.</p>
        </div>
      </header>

      {recommendation && (
        <section className="mb-16 animate-fade-in group">
          <Link
            href={`/project/${recommendation.id}`}
            className="block p-1 rounded-[2.5rem] bg-gradient-to-br from-accent/50 via-primary/30 to-transparent shadow-2xl hover:scale-[1.01] transition-all duration-500"
          >
            <div className="bg-card/80 backdrop-blur-2xl rounded-[2.4rem] p-8 flex items-center justify-between border border-border">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-accent/20 rounded-3xl flex items-center justify-center text-accent group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  <Sparkles size={36} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-2">Fokus-Empfehlung</h4>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    Lust auf <span className="text-accent underline decoration-accent/30 underline-offset-8">{recommendation.name}</span>?
                  </h3>
                </div>
              </div>
              <ChevronRight className="text-accent opacity-0 group-hover:opacity-100 transition-all translate-x-[-20px] group-hover:translate-x-0" size={32} />
            </div>
          </Link>
        </section>
      )}

      <section className="mb-24 flex justify-center">
        <div className="w-full max-w-2xl bg-foreground/5 backdrop-blur-xl rounded-[3rem] p-2 border border-border shadow-inner shadow-primary/10">
          <ProjectForm />
        </div>
      </section>

      <ProjectDashboard
        initialProjects={activeProjects}
        vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""}
      />
    </div>
  );
}

