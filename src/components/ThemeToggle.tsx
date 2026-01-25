"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
        );
    }

    return (
        <div className="flex items-center justify-center gap-1 p-1.5 bg-foreground/5 border border-border rounded-2xl backdrop-blur-xl shadow-inner">
            <button
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${theme === "light"
                    ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}
                title="Hell"
            >
                <Sun size={18} strokeWidth={2.5} />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${theme === "dark"
                    ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}
                title="Dunkel"
            >
                <Moon size={18} strokeWidth={2.5} />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${theme === "system"
                    ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}
                title="System"
            >
                <Monitor size={18} strokeWidth={2.5} />
            </button>
        </div>
    );
}
