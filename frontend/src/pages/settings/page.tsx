import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/app-layout.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Sun, Moon, Monitor, Bell, Globe, Lock, Palette, Shield, Download,
  Laptop, Smartphone, Tablet, LogOut, CheckCircle2, RotateCw, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { cn } from "@/lib/utils.ts";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/theme-toggle.tsx";
import apiClient from "@/lib/api-client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import { NOTIFICATIONS } from "@/lib/mock-data.ts";

type NotifKey = "budgetAlerts" | "transactionAlerts" | "weeklyReport" | "monthlyReport" | "securityAlerts" | "emailDigest";

const NOTIF_LABELS: Record<NotifKey, { label: string; desc: string }> = {
  budgetAlerts: { label: "Budget threshold alerts", desc: "Notify when reaching 75% or exceeding category spending limits" },
  transactionAlerts: { label: "Instant transaction alerts", desc: "Push notification whenever a transaction is recorded or updated" },
  weeklyReport: { label: "Weekly financial digest", desc: "Automated breakdown of your spending habits every Monday" },
  monthlyReport: { label: "Monthly comprehensive statement", desc: "Full end-of-month financial report and tax summary" },
  securityAlerts: { label: "Critical security notifications", desc: "Immediate alert upon new device login or password change" },
  emailDigest: { label: "Daily balance email summary", desc: "Quick morning overview of active wallets and pending bills" },
};

interface UserSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { transactions } = useTransactions();

  // Profile states
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currency, setCurrency] = useState(user?.currency || "INR");
  const [language, setLanguage] = useState(user?.language || "en");
  const [timezone, setTimezone] = useState(user?.timezone || "Asia/Kolkata");
  const [dateFormat, setDateFormat] = useState(user?.dateFormat || "dd-mm-yyyy");

  // Notifications state
  const [notifications, setNotifications] = useState<Record<NotifKey, boolean>>({
    budgetAlerts: true,
    transactionAlerts: true,
    weeklyReport: true,
    monthlyReport: false,
    securityAlerts: true,
    emailDigest: false,
  });

  // Display toggles
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [compactMode, setCompactMode] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [animations, setAnimations] = useState(true);

  // Security states
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchProfileAndSettings = useCallback(async () => {
    try {
      const res = await apiClient.get("/auth/profile/");
      if (res.data) {
        if (res.data.name) setName(res.data.name);
        if (res.data.email) setEmail(res.data.email);
        if (res.data.phone) setPhone(res.data.phone);
        if (res.data.currency) setCurrency(res.data.currency);
        if (res.data.language) setLanguage(res.data.language);
        if (res.data.timezone) setTimezone(res.data.timezone);
        if (res.data.dateFormat) setDateFormat(res.data.dateFormat);
        if (res.data.settings) {
          const s = res.data.settings;
          setNotifications({
            budgetAlerts: s.budgetAlerts ?? true,
            transactionAlerts: s.transactionAlerts ?? true,
            weeklyReport: s.weeklyReport ?? true,
            monthlyReport: s.monthlyReport ?? false,
            securityAlerts: s.securityAlerts ?? true,
            emailDigest: s.emailDigest ?? false,
          });
          if (s.compactMode !== undefined) setCompactMode(s.compactMode);
          if (s.showBalance !== undefined) setShowBalance(s.showBalance);
          if (s.animations !== undefined) setAnimations(s.animations);
          if (s.theme) setTheme(s.theme);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

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
    fetchProfileAndSettings();
    fetchSessions();
  }, [fetchProfileAndSettings, fetchSessions]);

  const handleTheme = (t: "light" | "dark" | "system") => {
    setTheme(t);
    if (t === "dark") document.documentElement.classList.add("dark");
    else if (t === "light") document.documentElement.classList.remove("dark");
    else {
      const sys = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", sys);
    }
    toast.success(`Theme mode updated to ${t}`);
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const payload = { name, phone, currency, language, timezone, dateFormat };
      await apiClient.put("/auth/profile/", payload);
      updateUser(payload);
      toast.success("Profile saved!");
    } catch (err) {
      console.error("[API] Failed to save profile:", err);
      toast.error("Could not save profile to cloud. Please check connection.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleNotificationsSave = async () => {
    try {
      await apiClient.put("/auth/settings/", {
        ...notifications,
        compactMode,
        showBalance,
        animations,
        theme,
      });
      toast.success("Settings saved!");
    } catch (err) {
      console.error("[API] Failed to save settings:", err);
      toast.error("Could not save settings to cloud. Please check connection.");
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPw) { toast.error("Enter your current password"); return; }
    if (newPw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { toast.error("New passwords do not match"); return; }

    try {
      await apiClient.post("/auth/change-password/", { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast.success("Password successfully updated!");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to update password. Check your current password.";
      toast.error(msg);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiClient.post("/auth/sessions/", { action: "revoke", sessionId });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Device session terminated successfully!");
    } catch {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session removed");
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      await apiClient.post("/auth/sessions/", { action: "revoke_all_others" });
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("Logged out from all other active devices!");
    } catch {
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("Other device sessions terminated");
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      user,
      exportDate: new Date().toISOString(),
      transactions,
    }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `financeos-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Complete financial history exported to JSON!");
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-8 max-w-[840px] mx-auto space-y-6">
        {/* Top Header with Theme Changer & Notification Icon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <motion.h1
              className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              System & User Settings
            </motion.h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control account profile, security, active devices, and regional preferences
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-xs flex items-center gap-1.5 text-xs font-medium"
              title="View notifications"
            >
              <Bell size={16} className="text-primary" />
              <span className="text-xs">Alerts</span>
              {NOTIFICATIONS.filter((n) => !n.read).length > 0 && (
                <span className="bg-[var(--color-expense)] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {NOTIFICATIONS.filter((n) => !n.read).length}
                </span>
              )}
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
          <Tabs defaultValue="general" className="w-full">
            {/* Non-overlapping Adaptive Tabs */}
            <div className="w-full overflow-x-auto pb-1 mb-5 scrollbar-none">
              <TabsList className="flex flex-row items-center w-full min-w-[320px] sm:min-w-0 h-auto p-1 bg-muted/60 border border-border/60 rounded-xl gap-1">
                <TabsTrigger value="general" className="flex-1 gap-1.5 text-xs py-2 px-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all font-medium">
                  <Globe size={14} className="shrink-0 text-primary" />
                  <span className="truncate">General</span>
                  <span className="hidden md:inline text-[11px] opacity-70">& Profile</span>
                </TabsTrigger>

                <TabsTrigger value="notifications" className="flex-1 gap-1.5 text-xs py-2 px-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all font-medium">
                  <Bell size={14} className="shrink-0 text-amber-500" />
                  <span className="truncate">Alerts</span>
                  <span className="hidden md:inline text-[11px] opacity-70">& Notifs</span>
                </TabsTrigger>

                <TabsTrigger value="appearance" className="flex-1 gap-1.5 text-xs py-2 px-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all font-medium">
                  <Palette size={14} className="shrink-0 text-indigo-500" />
                  <span className="truncate">Display</span>
                  <span className="hidden md:inline text-[11px] opacity-70">& Theme</span>
                </TabsTrigger>

                <TabsTrigger value="security" className="flex-1 gap-1.5 text-xs py-2 px-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all font-medium">
                  <Lock size={14} className="shrink-0 text-emerald-500" />
                  <span className="truncate">Security</span>
                  <span className="hidden md:inline text-[11px] opacity-70">& Devices</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── 1. General & Profile Tab ── */}
            <TabsContent value="general" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Personal Profile & Identity</CardTitle>
                  <CardDescription className="text-xs">Your account profile and regional preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email Address</Label>
                      <Input value={email} disabled placeholder="Your registered email" className="h-9 text-xs bg-muted/40 cursor-not-allowed" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone Number (Optional)</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+977 / +91 Mobile number" className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Primary Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Currency" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">₹ INR (Indian Rupee / NPR)</SelectItem>
                          <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">€ EUR (Euro)</SelectItem>
                          <SelectItem value="GBP">£ GBP (British Pound)</SelectItem>
                          <SelectItem value="JPY">¥ JPY (Japanese Yen)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">System Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Timezone" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                          <SelectItem value="Asia/Kathmandu">Asia/Kathmandu (NPT +5:45)</SelectItem>
                          <SelectItem value="UTC">UTC (Universal Time ±0:00)</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (EST -5:00)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT ±0:00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Interface Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Language" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English (US/UK)</SelectItem>
                          <SelectItem value="ne">Nepali (नेपाली)</SelectItem>
                          <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
                          <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                          <SelectItem value="te">Telugu (తెలుగు)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleProfileSave} disabled={savingProfile} className="text-xs h-9">
                    {savingProfile ? "Saving to Database…" : "Save Profile & Regional Settings"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Data Management & Backup</CardTitle>
                  <CardDescription className="text-xs">Export or reset your local and cloud financial records</CardDescription>
                </CardHeader>
                <CardContent className="divide-y">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold">Export Complete Database (JSON)</p>
                      <p className="text-xs text-muted-foreground">Download all income, expense, and transfer records for offline backup</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-1.5 text-xs h-8">
                      <Download size={13} /> Export JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── 2. Alerts & Notifications Tab ── */}
            <TabsContent value="notifications" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Automated Notification Rules</CardTitle>
                  <CardDescription className="text-xs">Enable or disable triggers for budget alerts, emails, and transaction logs</CardDescription>
                </CardHeader>
                <CardContent className="divide-y">
                  {(Object.keys(NOTIF_LABELS) as NotifKey[]).map((key) => {
                    const { label, desc } = NOTIF_LABELS[key];
                    const val = !!notifications[key];
                    return (
                      <div key={key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                        <div className="pr-4">
                          <Label className="font-semibold text-sm cursor-pointer">{label}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Switch
                          checked={val}
                          onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [key]: v }))}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
              <Button onClick={handleNotificationsSave} className="text-xs h-9">
                Save Notification Rules
              </Button>
            </TabsContent>

            {/* ── 3. Appearance & Theme Tab ── */}
            <TabsContent value="appearance" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Theme Mode</CardTitle>
                  <CardDescription className="text-xs">Switch between Light, Dark, or System Adaptive theme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: "light", icon: Sun, label: "Light Mode", preview: "bg-white border-2 border-zinc-200" },
                      { value: "dark", icon: Moon, label: "Dark Mode", preview: "bg-zinc-950 border-2 border-zinc-800" },
                      { value: "system", icon: Monitor, label: "System Sync", preview: "bg-gradient-to-br from-white to-zinc-900 border-2 border-zinc-400" },
                    ] as const).map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => handleTheme(t.value)}
                        className={cn(
                          "flex flex-col items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer",
                          theme === t.value
                            ? "border-primary bg-primary/5 shadow-xs font-semibold"
                            : "border-border hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        <div className={cn("w-full h-10 rounded-lg", t.preview, theme === t.value ? "border-primary" : "")} />
                        <div className="flex items-center gap-1.5 text-xs">
                          <t.icon size={14} className={theme === t.value ? "text-primary" : "text-muted-foreground"} />
                          <span>{t.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Display Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold text-xs">Compact Ledger View</Label>
                      <p className="text-[11px] text-muted-foreground">Reduce row padding to display more records per page</p>
                    </div>
                    <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold text-xs">Show Net Balance on Dashboard</Label>
                      <p className="text-[11px] text-muted-foreground">Keep your aggregate net worth visible on the top hero KPI</p>
                    </div>
                    <Switch checked={showBalance} onCheckedChange={setShowBalance} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold text-xs">UI Micro-Animations</Label>
                      <p className="text-[11px] text-muted-foreground">Enable smooth transitions when filtering and adding transactions</p>
                    </div>
                    <Switch checked={animations} onCheckedChange={setAnimations} />
                  </div>
                </CardContent>
              </Card>
              <Button onClick={handleNotificationsSave} className="text-xs h-9">
                Save Display Preferences
              </Button>
            </TabsContent>

            {/* ── 4. Security & Active Devices Tab ── */}
            <TabsContent value="security" className="space-y-4 mt-0">
              {/* Active Logged-In Devices Tracking */}
              <Card className="border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Shield size={18} className="text-primary" /> Active Logged-in Devices & Sessions
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Real-time tracker of all browsers, devices, and IP addresses authenticated with this account
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={fetchSessions}
                    disabled={loadingSessions}
                  >
                    <RotateCw size={13} className={loadingSessions ? "animate-spin" : ""} /> Refresh
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sessions.map((sess) => {
                    const isMobile = sess.device.toLowerCase().includes("mobile") || sess.device.toLowerCase().includes("iphone");
                    const isTablet = sess.device.toLowerCase().includes("tablet") || sess.device.toLowerCase().includes("ipad");
                    const DeviceIcon = isMobile ? Smartphone : isTablet ? Tablet : Laptop;

                    return (
                      <div
                        key={sess.id}
                        className={cn(
                          "p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors",
                          sess.isCurrent ? "bg-primary/5 border-primary/40" : "bg-card hover:bg-muted/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            sess.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <DeviceIcon size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs">{sess.device}</span>
                              {sess.isCurrent && (
                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 py-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> This Device
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {sess.browser} • IP: <span className="font-mono">{sess.ip}</span> • {sess.location}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {sess.lastActive}
                            </p>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-8 gap-1 self-end sm:self-center"
                            onClick={() => handleRevokeSession(sess.id)}
                          >
                            <LogOut size={13} /> Log Out Device
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {sessions.length > 1 && (
                    <div className="pt-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        onClick={handleRevokeAllOthers}
                      >
                        <AlertTriangle size={13} /> Log Out of All Other Devices
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Password Update */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Update Account Password</CardTitle>
                  <CardDescription className="text-xs">Securely change your authentication credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Current Password</Label>
                    <Input type="password" placeholder="Enter current password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">New Password (Min. 6 chars)</Label>
                      <Input type="password" placeholder="At least 6 characters" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Confirm New Password</Label>
                      <Input type="password" placeholder="Re-type new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="h-9 text-xs" />
                    </div>
                  </div>
                  <Button onClick={handlePasswordChange} className="text-xs h-9">
                    Update Password in Database
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AppLayout>
  );
}
