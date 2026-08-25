import { useState, useRef, useEffect, useCallback } from "react";
import AppLayout from "@/components/app-layout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { formatCurrency, type Transaction } from "@/lib/mock-data.ts";
import {
  Camera, Pencil, Shield, Smartphone, Laptop, Tablet, LogOut, CheckCircle,
  X, TrendingUp, TrendingDown, Wallet, Globe, Lock, ZoomIn, ZoomOut,
  RotateCcw, Settings, ArrowRight, Bell, Tag, Repeat2, Target, RotateCw
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "motion/react";
import { cn } from "@/lib/utils.ts";
import { Link } from "react-router-dom";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import apiClient from "@/lib/api-client.ts";

function safeFormatDate(dateStr?: string, fmt = "MMM yyyy"): string {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    return format(d, fmt);
  } catch {
    return "Recently";
  }
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function ProfilePage() {
  const { transactions } = useTransactions();
  const { user: authUser, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: authUser?.name || "User",
    email: authUser?.email || "",
    phone: authUser?.phone || "",
    currency: authUser?.currency || "INR",
  });
  const [avatar, setAvatar] = useState<string | undefined>(authUser?.avatar);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync form whenever authUser updates
  useEffect(() => {
    if (authUser) {
      setForm({
        name: authUser.name || "User",
        email: authUser.email || "",
        phone: authUser.phone || "",
        currency: authUser.currency || "INR",
      });
      setAvatar(authUser.avatar);
    }
  }, [authUser]);

  // Fetch freshest profile from Django API
  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiClient.get("/auth/profile/");
      if (res.data) {
        updateUser(res.data);
      }
    } catch {
      // Ignored
    }
  }, [updateUser]);

  // Fetch live active devices from PostgreSQL
  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const res = await apiClient.get("/auth/sessions/");
      if (Array.isArray(res.data?.sessions)) {
        setSessions(res.data.sessions);
      }
    } catch {
      // Keep existing
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const user = authUser || {
    id: "user-default",
    name: "User",
    email: "",
    phone: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    language: "en",
    joinedAt: new Date().toISOString().slice(0, 10),
  };

  const handleSave = async () => {
    try {
      await apiClient.put("/auth/profile/", form);
      updateUser(form);
      setEditing(false);
      toast.success("Profile updated successfully in PostgreSQL!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile in database");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, or WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const croppedDataUrl = canvas.toDataURL("image/png", 0.9);
          setAvatar(croppedDataUrl);
          updateUser({ avatar: croppedDataUrl });
          toast.success("Profile photo updated (< 50 KB, 1:1 square)!");
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiClient.post("/auth/sessions/", { action: "revoke", sessionId });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Device session successfully terminated!");
    } catch {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Device removed");
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      await apiClient.post("/auth/sessions/", { action: "revoke_all_others" });
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("Signed out of all other devices!");
    } catch {
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("Signed out of other devices");
    }
  };

  // Stats from live transactions
  const totalIncome = transactions.filter((t: Transaction) => t.type === "income" && t.status === "completed").reduce((s: number, t: Transaction) => s + t.amount, 0);
  const totalExpense = transactions.filter((t: Transaction) => t.type === "expense" && t.status === "completed").reduce((s: number, t: Transaction) => s + t.amount, 0);

  const stats = [
    { label: "Total Income", value: formatCurrency(totalIncome), icon: TrendingUp, color: "text-[var(--color-income)]", bg: "bg-[var(--color-income-bg)]" },
    { label: "Total Expenses", value: formatCurrency(totalExpense), icon: TrendingDown, color: "text-[var(--color-expense)]", bg: "bg-[var(--color-expense-bg)]" },
    { label: "Net Savings", value: formatCurrency(totalIncome - totalExpense), icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Transactions", value: String(transactions.length), icon: Globe, color: "text-[var(--color-warning)]", bg: "bg-[var(--color-warning-bg)]" },
  ];

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-8 max-w-[900px] mx-auto space-y-5 sm:space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <motion.h1
            className="text-xl sm:text-2xl font-bold"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Profile & Account
          </motion.h1>
          <Link to="/settings">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Settings size={14} /> Settings
            </Button>
          </Link>
        </div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <Avatar
                    className="w-20 h-20 border-2 border-border cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                    onClick={() => setShowZoomModal(true)}
                    title="Click to view & zoom photo"
                  >
                    <AvatarImage src={avatar} alt={user.name} />
                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Camera size={13} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <h2 className="text-lg sm:text-xl font-bold truncate">{user.name}</h2>
                    <Badge variant="secondary" className="w-fit mx-auto sm:mx-0 text-[10px]">Active Account</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm truncate">{user.email}</p>
                  {user.phone && <p className="text-muted-foreground text-xs sm:text-sm truncate">{user.phone}</p>}
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 flex items-center gap-1 justify-center sm:justify-start">
                    <CheckCircle size={11} className="text-[var(--color-income)]" />
                    Member since {safeFormatDate(user.joinedAt, "MMMM yyyy")}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!editing && (
                    <Button variant="secondary" size="sm" className="gap-1.5 text-xs" onClick={() => setEditing(true)}>
                      <Pencil size={13} /> Edit
                    </Button>
                  )}
                  <Link to="/settings" className="sm:hidden">
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      <Settings size={13} /> Settings
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Edit Form inline */}
              {editing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-5 pt-5 border-t space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Edit Details</p>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditing(false)}><X size={14} /></Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email</Label>
                      <Input type="email" disabled value={form.email} className="bg-muted/40 cursor-not-allowed" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSave}>Save Changes</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          {stats.map((s) => (
            <Card key={s.label} className="overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                    <s.icon size={14} className={s.color} />
                  </span>
                </div>
                <p className={cn("text-xs sm:text-base font-bold tabular-nums truncate", s.color)}>{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Quick Navigation & Settings */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Quick Access & Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { to: "/settings", label: "Settings", icon: Settings, desc: "Theme & preferences" },
                { to: "/audit-logs", label: "Audit Logs", icon: Shield, desc: "Security events" },
                { to: "/notifications", label: "Notifications", icon: Bell, desc: "Alerts & updates" },
                { to: "/categories", label: "Categories", icon: Tag, desc: "Tags & methods" },
                { to: "/transfers", label: "Transfers", icon: Repeat2, desc: "Money transfers" },
                { to: "/budget", label: "Budgets", icon: Target, desc: "Spending limits" },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="block group">
                  <div className="p-2.5 sm:p-3 rounded-xl border border-[var(--color-border)] bg-muted/20 hover:bg-muted/60 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <item.icon size={14} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate hidden sm:block">{item.desc}</p>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-muted-foreground/60 group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Logged-in Devices Tracking */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield size={16} className="text-primary" /> Active Logged-in Devices
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={fetchSessions} disabled={loadingSessions}>
                  <RotateCw size={12} className={loadingSessions ? "animate-spin" : ""} /> Refresh
                </Button>
                {sessions.length > 1 && (
                  <Button variant="ghost" size="sm" className="text-xs text-destructive h-7" onClick={handleRevokeAllOthers}>
                    Sign out all others
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 p-4 pt-0">
              {sessions.map((d) => {
                const isMobile = d.device.toLowerCase().includes("mobile") || d.device.toLowerCase().includes("iphone") || d.device.toLowerCase().includes("android");
                const isTablet = d.device.toLowerCase().includes("tablet") || d.device.toLowerCase().includes("ipad");
                const DeviceIcon = isMobile ? Smartphone : isTablet ? Tablet : Laptop;

                return (
                  <div
                    key={d.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-colors",
                      d.isCurrent ? "bg-primary/5 border-primary/30" : "bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", d.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                        <DeviceIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">{d.device}</p>
                          {d.isCurrent && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> This Device
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{d.browser} • IP: <span className="font-mono">{d.ip}</span> • {d.location}</p>
                        <p className="text-[11px] text-muted-foreground">{d.lastActive}</p>
                      </div>
                    </div>
                    {!d.isCurrent && (
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 shrink-0 cursor-pointer" onClick={() => handleRevokeSession(d.id)}>
                        <LogOut size={14} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Image Preview & Zoom Modal */}
      {showZoomModal && (
        <Dialog open onOpenChange={() => { setShowZoomModal(false); setZoomLevel(1); }}>
          <DialogContent className="max-w-[420px] text-center">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Profile Photo Preview</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4 bg-muted/40 rounded-xl overflow-hidden min-h-[260px]">
              <img
                src={avatar}
                alt={user.name}
                className="max-h-[240px] max-w-[240px] rounded-full object-cover shadow-lg transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                disabled={zoomLevel <= 0.75}
                className="gap-1 text-xs"
              >
                <ZoomOut size={14} /> Zoom Out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(1)}
                className="gap-1 text-xs"
              >
                <RotateCcw size={14} /> Reset ({Math.round(zoomLevel * 100)}%)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                disabled={zoomLevel >= 2.5}
                className="gap-1 text-xs"
              >
                <ZoomIn size={14} /> Zoom In
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
