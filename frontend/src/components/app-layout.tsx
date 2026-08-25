import { useState, useEffect, type ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import AppSidebar from "./app-sidebar.tsx";
import BottomNav from "./bottom-nav.tsx";
import SplashScreen from "./splash-screen.tsx";
import PwaInstallModal from "./pwa-install-modal.tsx";
import ThemeToggle from "./theme-toggle.tsx";
import { Menu, Wallet, Bell, Download, ShieldCheck, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NOTIFICATIONS } from "@/lib/mock-data.ts";
import { useAuth } from "@/hooks/use-auth.ts";

type Props = { children: ReactNode };

export default function AppLayout({ children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  // Automatically close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[var(--color-background)]">
      {/* Native Splash Screen on initial load */}
      <SplashScreen />

      {/* Desktop Sidebar */}
      <AppSidebar onOpenInstallModal={() => setInstallModalOpen(true)} />

      {/* Mobile Top App Bar (Sticky) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-card/90 backdrop-blur-md border-b border-border/80 safe-area-inset-top shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-xs">
              <Wallet size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">FinanceOS</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setInstallModalOpen(true)}
            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            aria-label="Install App"
          >
            <Download size={16} />
            <span className="text-[11px] font-medium hidden xs:inline">App</span>
          </button>

          <Link
            to="/notifications"
            className="relative p-1.5 rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={19} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[var(--color-expense)] rounded-full animate-pulse" />
            )}
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop / Click-outside to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="relative z-10 w-[80%] max-w-[290px] h-full shadow-2xl"
            >
              <AppSidebar
                isMobile
                onNavigate={() => setMobileMenuOpen(false)}
                onOpenInstallModal={() => {
                  setMobileMenuOpen(false);
                  setInstallModalOpen(true);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full h-full overflow-hidden">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-2.5 border-b border-border/70 bg-card/60 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Cloud Sync
            </span>
            <span className="opacity-40">•</span>
            <span className="text-foreground/80 font-medium">FinanceOS Workspace</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInstallModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-xl transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Install App</span>
            </button>

            <Link
              to="/notifications"
              className="relative p-2 rounded-xl text-foreground hover:bg-muted border border-border/60 transition-colors cursor-pointer flex items-center"
              title="Notifications"
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-expense)] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unread}
                </span>
              )}
            </Link>

            <ThemeToggle />

            {user && (
              <Link
                to="/profile"
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-muted/60 hover:bg-muted border border-border/60 transition-colors cursor-pointer ml-1"
                title="Your Profile"
              >
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px]">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <span className="text-xs font-medium text-foreground max-w-[100px] truncate">{user.name || "User"}</span>
              </Link>
            )}
          </div>
        </header>

        {/* Scrollable Page Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* PWA Install Modal */}
      <PwaInstallModal open={installModalOpen} onOpenChange={setInstallModalOpen} />
    </div>
  );
}
