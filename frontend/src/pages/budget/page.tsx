import { useState, useMemo, useEffect, useCallback } from "react";
import AppLayout from "@/components/app-layout.tsx";
import PageHeader from "@/components/page-header.tsx";
import BudgetProgress from "@/components/budget-progress.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { formatCurrency, type Budget, type Transaction, type Category } from "@/lib/mock-data.ts";
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { motion, AnimatePresence } from "motion/react";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import apiClient from "@/lib/api-client.ts";
import { IconOrLogoDisplay } from "@/pages/categories/page.tsx";

type PeriodFilter = "all" | "monthly" | "weekly" | "yearly";

const BUDGET_STORAGE_KEY = "financeos_budgets_v1";

function loadStoredBudgets(): Budget[] {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to parse stored budgets:", e);
  }
  return [];
}

export default function BudgetPage() {
  const { transactions, categories } = useTransactions();
  const [budgets, setBudgets] = useState<Budget[]>(loadStoredBudgets);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<Budget | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");

  // Keep localStorage in sync with budgets state
  useEffect(() => {
    try {
      localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
    } catch (e) {
      console.warn("Failed to save budgets to storage:", e);
    }
  }, [budgets]);

  // Fetch budgets from Django REST API on mount
  const fetchBudgets = useCallback(async () => {
    try {
      const res = await apiClient.get("/budgets/");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setBudgets(res.data);
      }
    } catch {
      // Retain local state
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense" || c.type === "transfer" || !c.type || c.type === "all"),
    [categories]
  );

  const getCat = useCallback((id: string): Category | undefined => {
    return categories.find((c) => c.id === id);
  }, [categories]);

  // Compute live spent for each budget from transactions
  const liveBudgets = useMemo(() => {
    return budgets.map((b) => {
      const liveSpent = transactions
        .filter((t: Transaction) => t.categoryId === b.categoryId && t.type === "expense")
        .reduce((s: number, t: Transaction) => s + t.amount, 0);
      return { ...b, spent: liveSpent > 0 ? liveSpent : b.spent };
    });
  }, [budgets, transactions]);

  const filtered = useMemo(
    () => (periodFilter === "all" ? liveBudgets : liveBudgets.filter((b) => b.period === periodFilter)),
    [liveBudgets, periodFilter]
  );

  const totalBudget = liveBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = liveBudgets.reduce((s, b) => s + b.spent, 0);
  const overBudgetCount = liveBudgets.filter((b) => b.spent >= b.limit).length;
  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const handleSave = async (data: Omit<Budget, "id" | "spent" | "startDate" | "endDate">, existing: Budget | null) => {
    if (existing) {
      setBudgets((prev) => {
        const next = prev.map((b) => (b.id === existing.id ? { ...b, ...data } : b));
        localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      try {
        await apiClient.put(`/budgets/${existing.id}/`, data);
        toast.success("Budget updated successfully!");
      } catch {
        toast.success("Budget updated locally!");
      }
    } else {
      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${lastDay}`;
      const tempId = `budget-${Date.now()}`;

      const catSpent = transactions
        .filter((t: Transaction) => t.categoryId === data.categoryId && t.type === "expense")
        .reduce((s: number, t: Transaction) => s + t.amount, 0);
      const newBudget: Budget = { id: tempId, spent: catSpent, startDate, endDate, ...data };

      setBudgets((prev) => {
        const next = [...prev, newBudget];
        localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      try {
        const res = await apiClient.post("/budgets/", { ...data, startDate, endDate });
        if (res.data?.id) {
          setBudgets((prev) => {
            const next = prev.map((b) => (b.id === tempId ? { ...b, id: res.data.id } : b));
            localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        }
        toast.success("Budget created successfully!");
      } catch {
        toast.success("Budget recorded locally!");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    setBudgets((prev) => {
      const next = prev.filter((b) => b.id !== id);
      localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setDeleting(null);
    try {
      await apiClient.delete(`/budgets/${id}/`);
      toast.success("Budget deleted successfully!");
    } catch {
      toast.success("Budget removed locally!");
    }
  };

  const summaryCards = [
    { label: "Total Budget", value: formatCurrency(totalBudget), color: "text-foreground", icon: Target, bg: "bg-muted" },
    { label: "Total Spent", value: formatCurrency(totalSpent), color: "text-[var(--color-expense)]", icon: TrendingUp, bg: "bg-[var(--color-expense-bg)]" },
    { label: "Remaining", value: formatCurrency(Math.max(0, totalBudget - totalSpent)), color: "text-[var(--color-income)]", icon: CheckCircle, bg: "bg-[var(--color-income-bg)]" },
    {
      label: "Over Budget",
      value: `${overBudgetCount} of ${budgets.length}`,
      color: overBudgetCount > 0 ? "text-[var(--color-expense)]" : "text-[var(--color-income)]",
      icon: AlertTriangle,
      bg: overBudgetCount > 0 ? "bg-[var(--color-expense-bg)]" : "bg-[var(--color-income-bg)]",
    },
  ];

  return (
    <AppLayout>
      <div className="p-5 md:p-8 max-w-[1200px] mx-auto space-y-6">
        <PageHeader
          title="Budget"
          subtitle="Set and track your monthly spending limits"
          actions={
            <Button onClick={() => setShowAdd(true)} className="gap-2 cursor-pointer">
              <Plus size={16} /> Add Budget
            </Button>
          }
        />

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          {summaryCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                    <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
                    <span className={cn("w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                      <s.icon size={13} className={s.color} />
                    </span>
                  </div>
                  <p className={cn("text-base sm:text-xl font-bold tabular-nums mt-0.5 sm:mt-1 truncate", s.color)}>{s.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Overall progress bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Overall Budget Usage</p>
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  overallPct >= 100
                    ? "text-[var(--color-expense)]"
                    : overallPct >= 80
                    ? "text-[var(--color-warning)]"
                    : "text-[var(--color-income)]"
                )}
              >
                {overallPct}%
              </p>
            </div>
            <BudgetProgress value={overallPct} height="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {formatCurrency(totalSpent)} spent of {formatCurrency(totalBudget)} total budget
            </p>
          </CardContent>
        </Card>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "monthly", "weekly", "yearly"] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors capitalize cursor-pointer",
                periodFilter === p
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {p === "all" ? "All Periods" : p}
            </button>
          ))}
        </div>

        {/* Budget Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((b, i) => {
              const cat = getCat(b.categoryId);
              const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
              const status = pct >= 100 ? "over" : pct >= 80 ? "warning" : "ok";
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
                >
                  <Card className="card-hover border-border/70 hover:border-primary/40 overflow-hidden">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform duration-200 group-hover:scale-105 aspect-square overflow-hidden p-1"
                            style={{ backgroundColor: `${cat?.color || "#3b82f6"}22` }}
                          >
                            <IconOrLogoDisplay icon={cat?.icon || "📁"} className="text-xl" />
                          </span>
                          <div>
                            <p className="font-semibold text-sm">{cat?.name || "Uncategorized"}</p>
                            <p className="text-xs text-muted-foreground capitalize">{b.period}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {status === "over" && <AlertTriangle size={13} className="text-[var(--color-expense)] mr-1" />}
                          {status === "warning" && <AlertTriangle size={13} className="text-[var(--color-warning)] mr-1" />}
                          {status === "ok" && <CheckCircle size={13} className="text-[var(--color-income)] mr-1" />}
                          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setEditing(b)}>
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive cursor-pointer"
                            onClick={() => setDeleting(b)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>

                      <BudgetProgress value={pct} color={cat?.color} height="h-2.5" />

                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <p className="text-[11px] text-muted-foreground">Spent</p>
                          <p className="text-sm font-semibold tabular-nums text-[var(--color-expense)]">{formatCurrency(b.spent)}</p>
                        </div>
                        <div className="text-center">
                          <p
                            className={cn(
                              "text-xs font-bold tabular-nums",
                              status === "over"
                                ? "text-[var(--color-expense)]"
                                : status === "warning"
                                ? "text-[var(--color-warning)]"
                                : "text-muted-foreground"
                            )}
                          >
                            {pct}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-muted-foreground">Limit</p>
                          <p className="text-sm font-semibold tabular-nums">{formatCurrency(b.limit)}</p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "mt-3 text-center text-[11px] font-medium py-1.5 rounded-lg",
                          status === "over" && "bg-[var(--color-expense-bg)] text-[var(--color-expense)]",
                          status === "warning" && "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
                          status === "ok" && "bg-[var(--color-income-bg)] text-[var(--color-income)]"
                        )}
                      >
                        {status === "over"
                          ? `Over by ${formatCurrency(b.spent - b.limit)}`
                          : status === "warning"
                          ? `${formatCurrency(b.limit - b.spent)} left — almost there`
                          : `${formatCurrency(b.limit - b.spent)} remaining`}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Add Budget Card */}
          <motion.button
            onClick={() => setShowAdd(true)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer min-h-[200px]"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Plus size={20} />
            </div>
            <p className="text-sm font-medium">Add Budget</p>
            <p className="text-xs">Track a new spending category</p>
          </motion.button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editing) && (
        <BudgetFormModal
          budget={editing}
          categories={expenseCategories.length > 0 ? expenseCategories : categories}
          onSave={handleSave}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
        />
      )}

      {/* Delete Confirm */}
      {deleting && (
        <Dialog open onOpenChange={() => setDeleting(null)}>
          <DialogContent className="max-w-[380px]">
            <DialogHeader>
              <DialogTitle>Remove Budget</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Remove the budget for <strong>{getCat(deleting.categoryId)?.name || "this category"}</strong>? This cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}

type FormData = Omit<Budget, "id" | "spent" | "startDate" | "endDate">;

function BudgetFormModal({
  budget,
  categories,
  onSave,
  onClose,
}: {
  budget: Budget | null;
  categories: Category[];
  onSave: (data: FormData, existing: Budget | null) => void;
  onClose: () => void;
}) {
  const defaultCategory = budget?.categoryId || categories[0]?.id || "";
  const [form, setForm] = useState<FormData>({
    categoryId: defaultCategory,
    limit: budget?.limit ?? 5000,
    period: budget?.period ?? "monthly",
  });
  const [limitStr, setLimitStr] = useState(budget ? String(budget.limit) : "5000");

  const handleSave = () => {
    const catId = form.categoryId || defaultCategory;
    if (!catId) {
      toast.error("Please select a category");
      return;
    }
    const limit = parseFloat(limitStr);
    if (!limitStr || isNaN(limit) || limit <= 0) {
      toast.error("Enter a valid budget limit");
      return;
    }
    onSave({ ...form, categoryId: catId, limit }, budget);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{budget ? "Edit Budget" : "Add New Budget"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Category</Label>
            {categories.length > 0 ? (
              <Select value={form.categoryId || defaultCategory} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <IconOrLogoDisplay icon={c.icon} className="w-4 h-4 text-sm inline-block" />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-xs text-amber-500 bg-amber-500/10 p-2.5 rounded-lg">
                No expense categories found. Please create an expense category in the Categories page first.
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Budget Limit (₹)</Label>
            <Input
              type="number"
              placeholder="e.g. 5000"
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Period</Label>
            <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v as Budget["period"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={categories.length === 0}>
            {budget ? "Save Changes" : "Add Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
