import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import {
  LayoutDashboard, ArrowLeftRight, TrendingUp, TrendingDown, Repeat2,
  Target, Tag, BarChart3, FileText, User, Settings,
  Shield, Wallet, ChevronLeft, ChevronRight, Bell, LogOut, X, Download
} from "lucide-react";
import { useState } from "react";
import { NOTIFICATIONS } from "@/lib/mock-data.ts";
import { motion } from "motion/react";
import { useAuth } from "@/hooks/use-auth.ts";

export const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/income", icon: TrendingUp, label: "Income" },
  { to: "/expenses", icon: TrendingDown, label: "Expenses" },
  { to: "/transfers", icon: Repeat2, label: "Transfers" },
  { to: "/budget", icon: Target, label: "Budget" },
  { to: "/categories", icon: Tag, label: "Categories" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/reports", icon: FileText, label: "Reports" },
];

export const NAV_BOTTOM = [
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/audit-logs", icon: Shield, label: "Audit Logs" },
];

type AppSidebarProps = {
  isMobile?: boolean;
  onNavigate?: () => void;
  onOpenInstallModal?: () => void;
};

export default function AppSidebar({ isMobile = false, onNavigate, onOpenInstallModal }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  const handleLinkClick = () => {
    if (isMobile && onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full shrink-0 select-none",
        "bg-[var(--color-sidebar)] border-r border-[var(--color-sidebar-border)]",
        isMobile ? "w-full max-w-[280px]" : cn("hidden md:flex sticky top-0 transition-all duration-300", collapsed ? "w-[68px]" : "w-[224px]")
      )}
    >
      {/* Logo Header */}
      <div className={cn("flex items-center justify-between px-4 py-4.5 border-b border-[var(--color-sidebar-border)]", collapsed && !isMobile && "justify-center px-2")}>
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-blue-500 shadow-md shadow-primary/25 flex items-center justify-center shrink-0"
          >
            <Wallet size={17} className="text-white" />
          </motion.div>
          {(!collapsed || isMobile) && (
            <div>
              <p className="text-[var(--color-sidebar-foreground)] font-bold text-sm tracking-tight leading-tight">FinanceOS</p>
              <p className="text-[var(--color-sidebar-accent-foreground)] text-[10px] opacity-60 font-medium">Personal Finance</p>
            </div>
          )}
        </div>

        {/* Close Button on Mobile Drawer */}
        {isMobile && onNavigate && (
          <button
            onClick={onNavigate}
            className="p-1.5 rounded-lg text-[var(--color-sidebar-foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--color-sidebar-accent)] cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2.5 scrollbar-none">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                collapsed && !isMobile && "justify-center px-2",
                isActive
                  ? "bg-primary/15 text-primary font-semibold shadow-xs border border-primary/20"
                  : "text-[var(--color-sidebar-foreground)] opacity-75 hover:opacity-100 hover:bg-[var(--color-sidebar-accent)] hover:translate-x-0.5"
              )
            }
            title={collapsed && !isMobile ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={cn("shrink-0 transition-transform duration-200 group-hover:scale-110", isActive && "text-primary")} />
                {(!collapsed || isMobile) && <span className="truncate">{label}</span>}
                {isActive && (!collapsed || isMobile) && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Nav Items */}
      <div className="border-t border-[var(--color-sidebar-border)] py-3 space-y-1 px-2.5">
        {/* Notifications */}
        <NavLink
          to="/notifications"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
              collapsed && !isMobile && "justify-center px-2",
              isActive
                ? "bg-primary/15 text-primary font-semibold border border-primary/20"
                : "text-[var(--color-sidebar-foreground)] opacity-75 hover:opacity-100 hover:bg-[var(--color-sidebar-accent)] hover:translate-x-0.5"
            )
          }
          title={collapsed && !isMobile ? "Notifications" : undefined}
        >
          {({ isActive }) => (
            <>
              <span className="relative">
                <Bell size={18} className={cn("shrink-0 transition-transform duration-200 group-hover:scale-110", isActive && "text-primary")} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-expense)] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unread}
                  </span>
                )}
              </span>
              {(!collapsed || isMobile) && <span className="truncate">Notifications</span>}
            </>
          )}
        </NavLink>

        {NAV_BOTTOM.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                collapsed && !isMobile && "justify-center px-2",
                isActive
                  ? "bg-primary/15 text-primary font-semibold border border-primary/20"
                  : "text-[var(--color-sidebar-foreground)] opacity-75 hover:opacity-100 hover:bg-[var(--color-sidebar-accent)] hover:translate-x-0.5"
              )
            }
            title={collapsed && !isMobile ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={cn("shrink-0 transition-transform duration-200 group-hover:scale-110", isActive && "text-primary")} />
                {(!collapsed || isMobile) && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}

        {/* Install PWA Button */}
        {onOpenInstallModal && (
          <button
            onClick={() => {
              if (isMobile && onNavigate) onNavigate();
              onOpenInstallModal();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-all duration-200 cursor-pointer mt-1 border border-primary/20",
              collapsed && !isMobile && "justify-center px-2"
            )}
            title={collapsed && !isMobile ? "Install App" : undefined}
          >
            <Download size={16} className="shrink-0" />
            {(!collapsed || isMobile) && <span className="truncate">Install Web App</span>}
          </button>
        )}

        {/* User profile & Logout */}
        {user && (
          <div className={cn("flex items-center gap-2 p-2 mt-2 rounded-xl bg-[var(--color-sidebar-accent)]/50 border border-[var(--color-sidebar-border)]", collapsed && !isMobile && "justify-center")}>
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            {(!collapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-[var(--color-sidebar-foreground)]">{user.name}</p>
                <p className="text-[10px] opacity-60 truncate text-[var(--color-sidebar-foreground)]">{user.email}</p>
              </div>
            )}
            {(!collapsed || isMobile) && (
              <button
                onClick={() => { signOut(); handleLinkClick(); }}
                title="Sign Out"
                className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        )}

        {/* Collapse Toggle (Desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer mt-1",
              "text-[var(--color-sidebar-foreground)] opacity-60 hover:opacity-100 hover:bg-[var(--color-sidebar-accent)]",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={17} /> : <><ChevronLeft size={17} /><span>Collapse sidebar</span></>}
          </button>
        )}
      </div>
    </aside>
  );
}
