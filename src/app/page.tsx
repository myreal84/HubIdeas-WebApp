"use client";

import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import ProjectForm from "@/components/ProjectForm";
import ProjectDashboard from "@/components/ProjectDashboard";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    if (!data) setLoading(true);
    const res = await fetch('/api/dashboard');
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return null;
  if (!data.session) redirect("/login");

  const { isAdmin, pendingUsersCount, activeProjects } = data;

  // Recommendation Logic: Pick a project not updated in 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forgottenProjects = activeProjects.filter((p: any) => new Date(p.updatedAt) < threeDaysAgo);
  const recommendation = forgottenProjects.length > 0
    ? forgottenProjects[Math.floor(Math.random() * forgottenProjects.length)]
    : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <motion.div
      className="main-container relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.header
        className="mb-8 md:mb-16 flex flex-col md:flex-row justify-between items-start gap-8 mt-6 md:mt-12"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-5xl md:text-8xl font-black title-font tracking-tight text-foreground mb-4">
            HubIdeas
          </h1>
          <p className="text-muted-foreground text-lg md:text-2xl font-medium max-w-lg leading-tight">Vom Gedanken zum Projekt – alles im Fluss.</p>
        </div>
      </motion.header>

      {recommendation && (
        <motion.section className="mb-16 group" variants={itemVariants}>
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
        </motion.section>
      )}

      <motion.section className="mb-24 flex justify-center" variants={itemVariants}>
        <div className="w-full max-w-2xl bg-foreground/5 backdrop-blur-xl rounded-[3rem] p-2 border border-border shadow-inner shadow-primary/10">
          <ProjectForm onProjectCreated={fetchData} />
        </div>
      </motion.section>

      <motion.div variants={itemVariants}>
        <ProjectDashboard
          initialProjects={activeProjects}
          vapidPublicKey={data.vapidPublicKey || ""}
          isAdmin={isAdmin}
          pendingUsersCount={pendingUsersCount}
        />
      </motion.div>
    </motion.div>
  );
}
