import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";
import ThemeToggle from "./theme-toggle.tsx";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  showThemeToggle?: boolean;
};

export default function PageHeader({ title, subtitle, actions, className, showThemeToggle = false }: Props) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6", className)}>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
        {showThemeToggle && <ThemeToggle />}
        {actions}
      </div>
    </div>
  );
}
