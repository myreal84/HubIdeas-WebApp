"use client";

import { redirect } from "next/navigation";
import ProjectForm from "@/components/ProjectForm";
import ProjectDashboard from "@/components/ProjectDashboard";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

export default function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!data) setLoading(true);
    const res = await fetch('/api/dashboard');
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return null;
  if (!data.session) redirect("/login");

  const { isAdmin, pendingUsersCount, activeProjects, archivedProjects } = data;

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

      <motion.section className="mb-24 flex justify-center" variants={itemVariants}>
        <div className="w-full max-w-2xl bg-foreground/5 backdrop-blur-xl rounded-[3rem] p-2 border border-border shadow-inner shadow-primary/10">
          <ProjectForm onProjectCreated={fetchData} />
        </div>
      </motion.section>

      <motion.div variants={itemVariants}>
        <ProjectDashboard
          activeProjects={activeProjects}
          archivedProjects={archivedProjects}
          vapidPublicKey={data.vapidPublicKey || ""}
          isAdmin={isAdmin}
          pendingUsersCount={pendingUsersCount}
        />
      </motion.div>
    </motion.div>
  );
}
