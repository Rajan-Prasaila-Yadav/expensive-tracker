import { useState } from "react";
import AppLayout from "@/components/app-layout.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { NOTIFICATIONS } from "@/lib/mock-data.ts";
import type { Notification } from "@/lib/mock-data.ts";
import { cn } from "@/lib/utils.ts";
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle, X, Trash2 } from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const TYPE_CONFIG = {
  info: { icon: Info, color: "text-[var(--color-transfer)]", bg: "bg-[var(--color-transfer-bg)]" },
  success: { icon: CheckCircle, color: "text-[var(--color-income)]", bg: "bg-[var(--color-income-bg)]" },
  warning: { icon: AlertTriangle, color: "text-[var(--color-warning)]", bg: "bg-[var(--color-warning-bg)]" },
  error: { icon: XCircle, color: "text-[var(--color-expense)]", bg: "bg-[var(--color-expense-bg)]" },
};

function formatTime(ts: string) {
  const date = parseISO(ts);
  if (isToday(date)) return `Today, ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "HH:mm")}`;
  return format(date, "dd MMM yyyy, HH:mm");
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);

  const markRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification dismissed");
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All marked as read");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <AppLayout>
      <div className="p-5 md:p-8 max-w-[700px] mx-auto space-y-4">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-8" onClick={markAllRead}>
                <CheckCheck size={14} /> Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-8" onClick={clearAll}>
                <Trash2 size={14} /> Clear all
              </Button>
            )}
          </div>
        </motion.div>

        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Bell size={28} className="text-muted-foreground/40" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">No notifications</p>
                  <p className="text-sm text-muted-foreground mt-1">You're all caught up! Check back later.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Unread */}
            {unread.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Unread</p>
                <Card>
                  <CardContent className="p-0 divide-y">
                    <AnimatePresence initial={false}>
                      {unread.map((n) => {
                        const cfg = TYPE_CONFIG[n.type];
                        const Icon = cfg.icon;
                        return (
                          <motion.div
                            key={n.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                            transition={{ duration: 0.2 }}
                          >
                            <div
                              className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors cursor-pointer bg-primary/[0.03]"
                              onClick={() => markRead(n.id)}
                            >
                              <span className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                                <Icon size={16} className={cfg.color} />
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold leading-snug">{n.title}</p>
                                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                                <p className="text-xs text-muted-foreground mt-1.5">{formatTime(n.timestamp)}</p>
                              </div>
                              <button
                                className="shrink-0 w-6 h-6 rounded hover:bg-muted flex items-center justify-center ml-1 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Read */}
            {read.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Earlier</p>
                <Card>
                  <CardContent className="p-0 divide-y">
                    <AnimatePresence initial={false}>
                      {read.map((n) => {
                        const cfg = TYPE_CONFIG[n.type];
                        const Icon = cfg.icon;
                        return (
                          <motion.div
                            key={n.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors opacity-70">
                              <span className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                                <Icon size={16} className={cfg.color} />
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-snug">{n.title}</p>
                                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                                <p className="text-xs text-muted-foreground mt-1.5">{formatTime(n.timestamp)}</p>
                              </div>
                              <button
                                className="shrink-0 w-6 h-6 rounded hover:bg-muted flex items-center justify-center ml-1 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => dismiss(n.id)}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
