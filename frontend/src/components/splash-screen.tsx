import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet } from "lucide-react";

export default function SplashScreen() {
  const [show, setShow] = useState(() => {
    // Only show once per session or initial load
    return !sessionStorage.getItem("splash_shown");
  });

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
        sessionStorage.setItem("splash_shown", "true");
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-background)] select-none"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-blue-500 shadow-2xl shadow-primary/30 flex items-center justify-center mb-4"
          >
            <Wallet size={38} className="text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="text-center"
          >
            <h1 className="text-2xl font-black tracking-tight text-foreground">FinanceOS</h1>
            <p className="text-xs text-muted-foreground font-medium mt-1">Personal Finance & Money Manager</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-[11px] font-mono text-muted-foreground">Loading workspace…</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
