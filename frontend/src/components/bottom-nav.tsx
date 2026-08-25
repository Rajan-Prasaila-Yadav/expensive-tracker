import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import {
  LayoutDashboard, ArrowLeftRight, TrendingUp, TrendingDown, User
} from "lucide-react";
import { motion } from "motion/react";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Txns" },
  { to: "/income", icon: TrendingUp, label: "Income" },
  { to: "/expenses", icon: TrendingDown, label: "Expenses" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border/80 bg-card/95 backdrop-blur-xl px-2 pt-2 pb-3 safe-area-inset-bottom shadow-2xl">
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex-1 relative flex flex-col items-center justify-center py-1.5 gap-1 text-[11px] font-semibold transition-all duration-200 select-none rounded-xl",
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground active:scale-95"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="relative z-10"
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className="relative z-10 text-[10px] leading-tight font-medium tracking-tight">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
