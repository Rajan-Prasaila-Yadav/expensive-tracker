import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

export default function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) return stored === "dark";
      return document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    toast.success(next ? "Dark mode activated 🌙" : "Light mode activated ☀️", { duration: 1500 });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn("h-9 w-9 rounded-xl relative overflow-hidden cursor-pointer hover:bg-muted/80 active:scale-95 transition-all", className)}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-amber-400"
          >
            <Moon size={18} strokeWidth={2.2} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0.5, rotate: 90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-amber-500"
          >
            <Sun size={18} strokeWidth={2.2} />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
