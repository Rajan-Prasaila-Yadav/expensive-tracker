import { useState, useEffect, type ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import AppSidebar from "./app-sidebar.tsx";
import BottomNav from "./bottom-nav.tsx";
import SplashScreen from "./splash-screen.tsx";
import PwaInstallModal from "./pwa-install-modal.tsx";
import { Menu, Wallet, Bell, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NOTIFICATIONS } from "@/lib/mock-data.ts";

type Props = { children: ReactNode };

export default function AppLayout({ children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const location = useLocation();
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
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-card/90 backdrop-blur-md border-b border-border/80 safe-area-inset-top">
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
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full pb-20 md:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* PWA Install Modal */}
      <PwaInstallModal open={installModalOpen} onOpenChange={setInstallModalOpen} />
    </div>
  );
}
