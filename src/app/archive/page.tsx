import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Archive } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ArchiveList from "@/components/ArchiveList";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
    const session = await auth();
    if (!session) redirect("/login");

    const archivedProjects = await prisma.project.findMany({
        where: {
            isArchived: true,
            OR: [
                { ownerId: session.user?.id },
                { sharedWith: { some: { id: session.user?.id } } }
            ]
        },
        orderBy: { updatedAt: "desc" },
        include: {
            _count: {
                select: { todos: true }
            }
        }
    });

    return (
        <div className="main-container animate-fade-in">
            <header className="mb-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center hover:bg-foreground/10 transition-all border border-border"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black title-font tracking-tight text-foreground">
                            Archiv
                        </h1>
                        <p className="text-muted-foreground font-medium">Beendete oder pausierte Ideen.</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-3 bg-foreground/5 px-5 py-2.5 rounded-full border border-border">
                    <Archive size={18} className="text-muted-foreground" />
                    <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        {archivedProjects.length} Projekt{archivedProjects.length !== 1 ? 'e' : ''}
                    </span>
                </div>
            </header>

            {archivedProjects.length === 0 ? (
                <div className="text-center py-32 px-6 bg-foreground/5 rounded-[3rem] border-2 border-dashed border-border">
                    <Archive size={48} className="text-muted-foreground/20 mx-auto mb-6" />
                    <p className="text-xl text-muted-foreground font-bold">Das Archiv ist leer.</p>
                </div>
            ) : (
                <ArchiveList projects={archivedProjects} />
            )}
        </div>
    );
}
