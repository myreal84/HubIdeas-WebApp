import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ListChecks, ChevronRight } from "lucide-react";
import ProjectForm from "@/components/ProjectForm";
import PushManager from "@/components/PushManager";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const activeProjects = await prisma.project.findMany({
    where: { isArchived: false },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { todos: { where: { isCompleted: false } } }
      }
    }
  });

  const finishedProjects = await prisma.project.findMany({
    where: { isArchived: true },
    orderBy: { updatedAt: "desc" },
  });

  // Recommendation Logic: Pick a project not updated in 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const forgottenProjects = activeProjects.filter((p) => new Date(p.updatedAt) < threeDaysAgo);
  const recommendation = forgottenProjects.length > 0
    ? forgottenProjects[Math.floor(Math.random() * forgottenProjects.length)]
    : null;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  return (
    <div className="main-container animate-fade-in">
      <header className="mb-16 flex flex-col md:flex-row justify-between items-start gap-8">
        <div>
          <h1 className="text-7xl md:text-8xl font-black title-font tracking-tight text-foreground mb-2">
            HubIdeas
          </h1>
          <p className="text-muted-foreground text-xl md:text-2xl font-medium max-w-lg leading-tight">Vom Gedanken zum Projekt – alles im Fluss.</p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <ThemeToggle />
          <div className="flex items-center gap-3 bg-primary/20 text-foreground px-5 py-2.5 rounded-full border border-primary/30 backdrop-blur-md shadow-lg shadow-indigo-500/20">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-widest">
              {activeProjects.length} Aktiv{activeProjects.length !== 1 ? 'e' : ''}
            </span>
          </div>
          <PushManager vapidPublicKey={vapidPublicKey} />
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

      <div className="space-y-20">
        <section>
          <div className="flex items-center gap-6 mb-10">
            <div className="flex items-center gap-4 bg-foreground/5 py-3 px-6 rounded-2xl border border-border">
              <h2 className="text-2xl font-black uppercase tracking-widest text-foreground/90 leading-none">Aktive Projekte</h2>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-foreground/10 to-transparent" />
          </div>

          {activeProjects.length === 0 && (
            <div className="text-center py-32 px-6 bg-foreground/5 rounded-[3rem] border-2 border-dashed border-border group">
              <div className="w-24 h-24 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-700">
                <ListChecks size={48} className="text-muted-foreground/30" />
              </div>
              <p className="text-2xl text-muted-foreground font-bold">Keine aktiven Baustellen.</p>
              <p className="text-muted-foreground/60 mt-3 font-medium">Starte jetzt eine neue Idee!</p>
            </div>
          )}

          <div className="responsive-grid">
            {activeProjects.map((project, idx) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="card-premium group relative overflow-hidden flex flex-col justify-between min-h-[200px]"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/20 transition-all duration-500" />

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-4 line-clamp-2">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm bg-foreground/5 w-fit px-4 py-2 rounded-xl border border-border">
                    <ListChecks size={16} className="text-primary" />
                    <span>{project._count.todos} Aufgaben</span>
                  </div>
                </div>

                <div className="relative z-10 flex items-center text-primary font-black text-xs uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 mt-8">
                  Details <ChevronRight size={14} className="ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {finishedProjects.length > 0 && (
          <section className="pb-20 opacity-50 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-6 mb-10">
              <h2 className="text-xl font-bold uppercase tracking-widest text-muted-foreground">Archiv</h2>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="responsive-grid">
              {finishedProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="p-6 bg-foreground/5 border border-border rounded-2xl hover:bg-foreground/10 hover:border-primary/20 transition-all group flex justify-between items-center"
                >
                  <h3 className="text-lg font-bold text-muted-foreground group-hover:text-foreground transition-colors line-through decoration-muted-foreground/50">
                    {project.name}
                  </h3>
                  <ChevronRight size={18} className="text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

