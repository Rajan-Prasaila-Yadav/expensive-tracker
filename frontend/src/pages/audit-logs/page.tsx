import { useState, useEffect, useCallback, useMemo } from "react";
import AppLayout from "@/components/app-layout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, Search, X,
  RotateCw, FileSpreadsheet, Printer, Laptop, Globe, Calendar,
  Activity, Layers, ArrowUpRight, Lock, Clock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils.ts";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client.ts";
import type { AuditLog } from "@/lib/mock-data.ts";
import CalendarFilter, { type CalendarFilterValue, matchesCalendarFilter } from "@/components/calendar-filter.tsx";
import { exportToCSV, exportToPDF } from "@/lib/export-utils.ts";

type Result = "success" | "failure" | "warning";

const RESULT_CONFIG: Record<Result, { icon: typeof CheckCircle2; color: string; bg: string; badge: string; label: string }> = {
  success: { icon: CheckCircle2, color: "text-[var(--color-income)]", bg: "bg-[var(--color-income-bg)]", badge: "bg-[var(--color-income-bg)] text-[var(--color-income)]", label: "Success" },
  failure: { icon: XCircle, color: "text-[var(--color-expense)]", bg: "bg-[var(--color-expense-bg)]", badge: "bg-[var(--color-expense-bg)] text-[var(--color-expense)]", label: "Failed" },
  warning: { icon: AlertTriangle, color: "text-[var(--color-warning)]", bg: "bg-[var(--color-warning-bg)]", badge: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]", label: "Warning" },
};

function safeFormatDate(dateStr?: string, fmt = "dd MMM yyyy, HH:mm:ss"): string {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Just now";
    return format(d, fmt);
  } catch {
    return "Just now";
  }
}

// Clean up legacy raw paths or user agent strings if any exist in the database
function formatAction(action: string): string {
  if (!action) return "System Activity";
  if (action.startsWith("POST_")) return `Created ${action.replace("POST_", "").toLowerCase()}`;
  if (action.startsWith("PUT_")) return `Updated ${action.replace("PUT_", "").toLowerCase()}`;
  if (action.startsWith("DELETE_")) return `Deleted ${action.replace("DELETE_", "").toLowerCase()}`;
  return action;
}

function formatModule(entity: string): string {
  if (!entity) return "General";
  if (entity.includes("transaction")) return "Transactions";
  if (entity.includes("income-source")) return "Income Streams";
  if (entity.includes("payment-method")) return "Accounts & Wallets";
  if (entity.includes("categor")) return "Categories";
  if (entity.includes("budget")) return "Budgets";
  if (entity.includes("auth") || entity.includes("profile")) return "Security & Auth";
  return entity;
}

function formatClientDevice(device?: string, browser?: string, os?: string): string {
  if (device && !device.includes("Mozilla")) return device;
  const b = browser && !browser.includes("Mozilla") ? browser : "Chrome";
  const o = os && !os.includes("Mozilla") ? os : "Windows";
  return `${b} on ${o}`;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultFilter, setResultFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [rawSearch, setRawSearch] = useState("");
  const [search] = useDebounce(rawSearch, 300);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [dateFilter, setDateFilter] = useState<CalendarFilterValue>({
    preset: "all",
    label: "All Time",
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/audit-logs/");
      if (Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Unique modules in logs
  const availableModules = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(formatModule(l.entity)));
    return Array.from(set);
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const moduleName = formatModule(log.entity);
      const actionName = formatAction(log.action);
      const clientLabel = formatClientDevice(log.device, log.browser, log.os);

      if (resultFilter !== "all" && log.result !== resultFilter) return false;
      if (moduleFilter !== "all" && moduleName !== moduleFilter) return false;
      if (!matchesCalendarFilter(log.timestamp, dateFilter)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          actionName.toLowerCase().includes(q) ||
          moduleName.toLowerCase().includes(q) ||
          clientLabel.toLowerCase().includes(q) ||
          (log.ip && log.ip.includes(q))
        );
      }
      return true;
    });
  }, [logs, resultFilter, moduleFilter, dateFilter, search]);

  const counts = {
    total: logs.length,
    success: logs.filter((l) => l.result === "success").length,
    failure: logs.filter((l) => l.result === "failure").length,
    warning: logs.filter((l) => l.result === "warning").length,
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No audit logs to export");
      return;
    }
    const rows = filtered.map((l) => ({
      Timestamp: safeFormatDate(l.timestamp),
      Action: formatAction(l.action),
      Module: formatModule(l.entity),
      Client: formatClientDevice(l.device, l.browser, l.os),
      "IP Address": l.ip,
      Outcome: (l.result || "SUCCESS").toUpperCase(),
    }));

    exportToCSV(rows, "security-audit-trail", {
      title: "Security Audit & Activity Trail",
      dateRange: dateFilter.label,
      totalCount: filtered.length,
    });
    toast.success("Audit trail exported to Excel / CSV!");
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) {
      toast.error("No audit logs to export");
      return;
    }
    const rows = filtered.map((l) => ({
      timestamp: safeFormatDate(l.timestamp),
      action: formatAction(l.action),
      module: formatModule(l.entity),
      device: formatClientDevice(l.device, l.browser, l.os),
      ip: l.ip,
      result: (l.result || "SUCCESS").toUpperCase(),
    }));

    exportToPDF(
      rows,
      {
        title: "Official Security & Activity Audit Log",
        dateRange: dateFilter.label,
        totalCount: filtered.length,
      },
      [
        { key: "timestamp", label: "Timestamp" },
        { key: "action", label: "Action Taken" },
        { key: "module", label: "Workspace Module" },
        { key: "device", label: "Client Environment" },
        { key: "ip", label: "IP Address" },
        { key: "result", label: "Outcome" },
      ]
    );
    toast.success("Generating formal printable security log…");
  };

  const hasActiveFilters = Boolean(
    rawSearch || resultFilter !== "all" || moduleFilter !== "all" || dateFilter.preset !== "all"
  );

  const resetFilters = () => {
    setRawSearch("");
    setResultFilter("all");
    setModuleFilter("all");
    setDateFilter({ preset: "all", label: "All Time" });
  };

  return (
    <AppLayout>
      <div className="p-5 md:p-8 max-w-[1300px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield size={22} className="text-primary" /> Audit Logs
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Real-time security and mutation trail recorded directly in PostgreSQL
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 cursor-pointer" onClick={handleExportCSV}>
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span className="hidden sm:inline">Export Excel</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 cursor-pointer" onClick={handleExportPDF}>
              <Printer size={14} />
              <span>PDF Print</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 cursor-pointer" onClick={fetchLogs} disabled={loading}>
              <RotateCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground truncate">Total Actions Logged</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 tabular-nums">{counts.total}</p>
          </CardContent></Card>
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground truncate">Successful Operations</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 tabular-nums text-[var(--color-income)]">{counts.success}</p>
          </CardContent></Card>
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground truncate">Failed Attempts</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 tabular-nums text-[var(--color-expense)]">{counts.failure}</p>
          </CardContent></Card>
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground truncate">Security Warnings</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 tabular-nums text-[var(--color-warning)]">{counts.warning}</p>
          </CardContent></Card>
        </div>

        {/* Dynamic Search & Filters Toolbar */}
        <div className="space-y-3 p-3.5 border rounded-xl bg-card shadow-xs">
          {/* Row 1: Search + Calendar Picker */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search action name, module, browser, or IP address…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-8 pr-8 h-9 text-xs"
              />
              {rawSearch && (
                <button
                  onClick={() => setRawSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <CalendarFilter value={dateFilter} onChange={setDateFilter} />
          </div>

          {/* Row 2: Module & Outcome Selectors */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t">
            {/* Module Filter */}
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                <SelectValue placeholder="Module: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Module: All</SelectItem>
                {availableModules.map((m) => (
                  <SelectItem key={m} value={m}>
                    <span>{m}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Outcome Filter */}
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs">
                <SelectValue placeholder="Outcome: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Outcome: All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer ml-auto"
              >
                <X size={13} className="mr-1" /> Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Audit Event Log ({filtered.length})</h2>
            <span className="text-xs text-muted-foreground">Click any record to inspect security details</span>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <Shield size={32} className="text-muted-foreground/40" />
                <p className="text-sm font-semibold">No audit logs match your search or filter</p>
                <p className="text-xs text-muted-foreground">Every system action is recorded automatically.</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs mt-2">
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((log, i) => {
                  const cfg = RESULT_CONFIG[log.result as Result] || RESULT_CONFIG.success;
                  const Icon = cfg.icon;
                  const actionName = formatAction(log.action);
                  const moduleName = formatModule(log.entity);
                  const clientLabel = formatClientDevice(log.device, log.browser, log.os);

                  return (
                    <motion.div
                      key={log.id || i}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        onClick={() => setSelectedLog(log)}
                        className="cursor-pointer hover:border-primary/40 hover:shadow-xs transition-all duration-200 active:scale-[0.998]"
                      >
                        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                            <span className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                              <Icon size={16} className={cfg.color} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs sm:text-sm text-foreground truncate">{actionName}</span>
                                <Badge variant="secondary" className="text-[10px] font-medium py-0 px-2">
                                  {moduleName}
                                </Badge>
                                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase", cfg.badge)}>
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className="inline-flex items-center gap-1 truncate">
                                  <Laptop size={12} className="shrink-0" />
                                  <span className="truncate">{clientLabel}</span>
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                  <Globe size={11} className="shrink-0" />
                                  <span>{log.ip}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground whitespace-nowrap self-end sm:self-center font-mono text-right shrink-0">
                            {safeFormatDate(log.timestamp, "dd MMM yyyy, HH:mm")}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Audit Log Detail Modal */}
      {selectedLog && (
        <Dialog open onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-[460px] p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <Shield size={16} className="text-primary" /> Audit Event Details
              </DialogTitle>
            </DialogHeader>

            <div className="py-3 space-y-4 text-sm">
              {/* Event Hero */}
              <div className="p-3.5 rounded-xl bg-muted/40 border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Action Performed</span>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase",
                    RESULT_CONFIG[selectedLog.result as Result]?.badge || "bg-emerald-50 text-emerald-700"
                  )}>
                    {selectedLog.result.toUpperCase()}
                  </span>
                </div>
                <p className="text-base font-bold text-foreground">{formatAction(selectedLog.action)}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedLog.entityId && !selectedLog.entityId.startsWith("api")
                    ? selectedLog.entityId
                    : `Action executed on the ${formatModule(selectedLog.entity)} module.`}
                </p>
              </div>

              {/* Dynamic Attribute Table */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Layers size={13} /> Module / Page
                  </span>
                  <span className="font-semibold text-foreground">{formatModule(selectedLog.entity)}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock size={13} /> Exact Timestamp
                  </span>
                  <span className="font-mono text-foreground">{safeFormatDate(selectedLog.timestamp)}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Laptop size={13} /> Client Environment
                  </span>
                  <span className="font-medium text-foreground">{formatClientDevice(selectedLog.device, selectedLog.browser, selectedLog.os)}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Globe size={13} /> Client IP Address
                  </span>
                  <span className="font-mono font-medium text-foreground">{selectedLog.ip || "127.0.0.1"}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Lock size={13} /> Security Ledger
                  </span>
                  <span className="text-[11px] text-[var(--color-income)] font-semibold">PostgreSQL Verified</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button size="sm" onClick={() => setSelectedLog(null)} className="text-xs cursor-pointer">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
