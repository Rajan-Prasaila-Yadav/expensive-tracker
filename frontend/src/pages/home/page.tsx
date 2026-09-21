import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/app-layout.tsx";
import TransactionRow from "@/components/transaction-row.tsx";
import BudgetProgress from "@/components/budget-progress.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  calcSummary, getMonthlyData, getCategoryExpenseData, getCategoryIncomeData,
  formatCurrency, getCategoryById,
} from "@/lib/mock-data.ts";
import type { Transaction, Budget } from "@/lib/mock-data.ts";
import type { NewTransaction } from "@/hooks/use-transactions.ts";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Target, Plus, ArrowRight, Bell } from "lucide-react";
import { format } from "date-fns";
import { motion } from "motion/react";
import TransactionDetailModal from "@/pages/transactions/_components/TransactionDetailModal.tsx";
import TransactionFormModal from "@/pages/transactions/_components/TransactionFormModal.tsx";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import ThemeToggle from "@/components/theme-toggle.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import apiClient from "@/lib/api-client.ts";
import { IconOrLogoDisplay } from "@/pages/categories/page.tsx";
import { cn } from "@/lib/utils.ts";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    transactions,
    categories,
    loading,
    fetchTransactions,
    fetchAllMetadata,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
  } = useTransactions();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [timeframe, setTimeframe] = useState<"all" | "month">("all");
  const [categoryTab, setCategoryTab] = useState<"expense" | "income">("expense");

  // Fetch live budgets, notifications and refresh transactions from Django backend
  const fetchData = useCallback(async () => {
    try {
      const [budgetsRes, notifsRes] = await Promise.allSettled([
        apiClient.get("/budgets/"),
        apiClient.get("/notifications/"),
      ]);

      if (budgetsRes.status === "fulfilled" && Array.isArray(budgetsRes.value.data)) {
        setBudgets(budgetsRes.value.data);
      }
      if (notifsRes.status === "fulfilled" && notifsRes.value.data) {
        const notifs = Array.isArray(notifsRes.value.data)
          ? notifsRes.value.data
          : notifsRes.value.data.results || [];
        setUnreadCount(notifs.filter((n: any) => !n.read).length);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchTransactions();
    fetchAllMetadata();
  }, [fetchData, fetchTransactions, fetchAllMetadata]);

  // Safe date helper to avoid UTC midnight timezone offset bugs
  const getTxDate = (dateStr?: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dateStr);
  };

  // Current Month Transactions
  const thisMonthTxs = useMemo(() => {
    const now = new Date();
    return transactions.filter((t: Transaction) => {
      const d = getTxDate(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [transactions]);

  // Previous Month Transactions
  const lastMonthTxs = useMemo(() => {
    const now = new Date();
    const targetMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return transactions.filter((t: Transaction) => {
      const d = getTxDate(t.date);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });
  }, [transactions]);

  // Summaries
  const allTimeSummary = useMemo(() => calcSummary(transactions), [transactions]);
  const thisMonthSummary = useMemo(() => calcSummary(thisMonthTxs), [thisMonthTxs]);
  const lastMonthSummary = useMemo(() => calcSummary(lastMonthTxs), [lastMonthTxs]);

  // Active display summary
  const displaySummary = timeframe === "month" ? thisMonthSummary : allTimeSummary;

  // Live Budgets
  const liveBudgets = useMemo(() => {
    return budgets.map((b) => {
      const liveSpent = transactions
        .filter((t: Transaction) => t.categoryId === b.categoryId && t.type === "expense" && (t.status === "completed" || t.status === "cleared" || !t.status))
        .reduce((s: number, t: Transaction) => s + t.amount, 0);
      return { ...b, spent: liveSpent > 0 ? liveSpent : b.spent };
    });
  }, [budgets, transactions]);

  const totalBudget = liveBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = liveBudgets.reduce((s, b) => s + b.spent, 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const monthlyData = useMemo(() => getMonthlyData(6, transactions), [transactions]);
  const categoryExpenseData = useMemo(() => getCategoryExpenseData(transactions, categories), [transactions, categories]);
  const categoryIncomeData = useMemo(() => getCategoryIncomeData(transactions, categories), [transactions, categories]);

  // Auto-switch to income if user has no expenses but has income
  useEffect(() => {
    if (categoryExpenseData.length === 0 && categoryIncomeData.length > 0) {
      setCategoryTab("income");
    }
  }, [categoryExpenseData.length, categoryIncomeData.length]);

  const activeCategoryData = categoryTab === "expense" ? categoryExpenseData : categoryIncomeData;

  const recentTxs = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time || "00:00"}`).getTime() || new Date(a.date).getTime();
      const timeB = new Date(`${b.date}T${b.time || "00:00"}`).getTime() || new Date(b.date).getTime();
      return timeB - timeA;
    }).slice(0, 8);
  }, [transactions]);

  const summaryCards = [
    {
      label: "Total Balance",
      value: formatCurrency(allTimeSummary.balance),
      icon: Wallet,
      color: allTimeSummary.balance >= 0 ? "text-[var(--color-income)]" : "text-[var(--color-expense)]",
      bg: allTimeSummary.balance >= 0 ? "bg-[var(--color-income-bg)]" : "bg-[var(--color-expense-bg)]",
      trend: timeframe === "month"
        ? (thisMonthSummary.balance >= 0 ? `+${formatCurrency(thisMonthSummary.balance)} this month` : `${formatCurrency(thisMonthSummary.balance)} this month`)
        : `${transactions.length} total entries recorded`,
      trendPositive: allTimeSummary.balance >= 0,
    },
    {
      label: timeframe === "month" ? "Monthly Income" : "Total Income",
      value: formatCurrency(displaySummary.income),
      icon: TrendingUp,
      color: "text-[var(--color-income)]",
      bg: "bg-[var(--color-income-bg)]",
      trend: timeframe === "month"
        ? (lastMonthSummary.income > 0
            ? `${((thisMonthSummary.income - lastMonthSummary.income) / lastMonthSummary.income * 100).toFixed(0)}% vs last month`
            : `${thisMonthTxs.filter((t) => t.type === "income").length} active records this month`)
        : `${transactions.filter((t) => t.type === "income").length} total income records`,
      trendPositive: true,
    },
    {
      label: timeframe === "month" ? "Monthly Expenses" : "Total Expenses",
      value: formatCurrency(displaySummary.expense),
      icon: TrendingDown,
      color: "text-[var(--color-expense)]",
      bg: "bg-[var(--color-expense-bg)]",
      trend: timeframe === "month"
        ? (lastMonthSummary.expense > 0
            ? `${((thisMonthSummary.expense - lastMonthSummary.expense) / lastMonthSummary.expense * 100).toFixed(0)}% vs last month`
            : `${thisMonthTxs.filter((t) => t.type === "expense").length} active records this month`)
        : `${transactions.filter((t) => t.type === "expense").length} total expense records`,
      trendPositive: displaySummary.expense === 0 || (timeframe === "month" ? thisMonthSummary.expense <= lastMonthSummary.expense : true),
    },
    {
      label: "Budget Used",
      value: `${budgetPct}%`,
      icon: Target,
      color: budgetPct > 90 ? "text-[var(--color-expense)]" : budgetPct > 75 ? "text-[var(--color-warning)]" : "text-[var(--color-income)]",
      bg: budgetPct > 90 ? "bg-[var(--color-expense-bg)]" : budgetPct > 75 ? "bg-[var(--color-warning-bg)]" : "bg-[var(--color-income-bg)]",
      trend: totalBudget > 0 ? `${formatCurrency(totalSpent)} of ${formatCurrency(totalBudget)}` : "No active budgets",
      trendPositive: budgetPct <= 75,
    },
  ];

  return (
    <AppLayout>
      <div className="p-5 md:p-8 space-y-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-start justify-between"
        >
          <div>
            <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
            <h1 className="text-2xl font-bold mt-0.5 flex items-center gap-2">
              <span>Hello, {user?.name ? user.name.split(" ")[0] : "there"}</span>
              <motion.span
                className="inline-block origin-[70%_70%]"
                animate={{ rotate: [0, 15, -10, 15, -5, 10, 0] }}
                transition={{
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 2.5,
                  ease: "easeInOut",
                  repeatDelay: 1.2,
                }}
              >
                👋
              </motion.span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center bg-muted/60 p-0.5 sm:p-1 rounded-xl border border-border/50 text-xs">
              <button
                onClick={() => setTimeframe("all")}
                className={cn(
                  "px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all cursor-pointer text-[11px] sm:text-xs",
                  timeframe === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeframe("month")}
                className={cn(
                  "px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all cursor-pointer text-[11px] sm:text-xs",
                  timeframe === "month"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                This Month
              </button>
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-xl cursor-pointer"
              onClick={() => navigate("/notifications")}
              title="Notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-expense)] rounded-full animate-pulse" />
              )}
            </Button>
            <Button onClick={() => setShowAdd(true)} className="gap-2 h-9 px-3 sm:px-4 cursor-pointer">
              <Plus size={16} /> Add
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {summaryCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-5 space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{c.label}</span>
                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                      <c.icon size={15} className={`sm:w-[18px] sm:h-[18px] ${c.color}`} />
                    </div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold tracking-tight truncate">{c.value}</div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
                      {c.trend}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cashflow Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.28, ease: "easeOut" }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-semibold">Cashflow Overview</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Monthly income vs expenses comparison</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-income)]" />
                    <span className="text-muted-foreground">Income</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-expense)]" />
                    <span className="text-muted-foreground">Expense</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[220px] sm:h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          borderColor: "var(--color-border)",
                          borderRadius: "12px",
                          fontSize: "12px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        formatter={(val: any, name: any) => [formatCurrency(Number(val) || 0), name === "income" ? "Income" : "Expense"]}
                      />
                      <Area type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} fill="url(#incomeGrad)" />
                      <Area type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2} fill="url(#expenseGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category & Income Stream Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {categoryTab === "expense" ? "Expense by Category" : "Income by Stream"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {categoryTab === "expense" ? "Spending distribution across categories" : "Income sources distribution"}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50 text-[11px]">
                  <button
                    onClick={() => setCategoryTab("expense")}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer",
                      categoryTab === "expense"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Expense
                  </button>
                  <button
                    onClick={() => setCategoryTab("income")}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer",
                      categoryTab === "income"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Income
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {activeCategoryData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-[150px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={activeCategoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={68}
                            paddingAngle={3}
                            dataKey="amount"
                          >
                            {activeCategoryData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--color-card)",
                              borderColor: "var(--color-border)",
                              borderRadius: "10px",
                              fontSize: "12px",
                            }}
                            formatter={(val: any) => [formatCurrency(Number(val) || 0), categoryTab === "expense" ? "Spent" : "Earned"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 max-h-[130px] overflow-y-auto pr-1">
                      {activeCategoryData.slice(0, 5).map((c) => (
                        <div key={c.id || c.name} className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            <IconOrLogoDisplay icon={c.icon} className="w-3.5 h-3.5 text-xs inline-block shrink-0" />
                            <span className="text-muted-foreground font-medium truncate">{c.name}</span>
                          </div>
                          <span className="font-semibold shrink-0 ml-2">{formatCurrency(c.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground text-center p-4">
                    {categoryTab === "expense"
                      ? "No expense data recorded yet. Switch to Income to see earnings."
                      : "No income data recorded yet."}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom row: Recent Transactions & Budget progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.42, ease: "easeOut" }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Latest transactions from your PostgreSQL database</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-xs gap-1 cursor-pointer">
                  <Link to="/transactions">
                    View all <ArrowRight size={13} />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {recentTxs.length > 0 ? (
                  <div className="divide-y divide-border">
                    {recentTxs.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        onView={(t) => setSelectedTx(t)}
                      />
                    ))}
                  </div>
                ) : loading ? (
                  <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Loading your transactions...
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No transactions recorded yet. Click <strong>+ Add</strong> to record your first transaction.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Budget Overview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.49, ease: "easeOut" }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">Active Budgets</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Budget status this month</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-xs gap-1 cursor-pointer">
                  <Link to="/budget">
                    Manage <ArrowRight size={13} />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {liveBudgets.length > 0 ? (
                  liveBudgets.slice(0, 4).map((b) => {
                    const category = categories.find((c) => c.id === b.categoryId);
                    const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
                    const isOver = b.spent >= b.limit;
                    return (
                      <div key={b.id} className="space-y-1.5 p-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <IconOrLogoDisplay icon={category?.icon || "🎯"} className="w-3.5 h-3.5 text-xs inline-block shrink-0" />
                            <span className="font-semibold truncate">{category?.name || "General Budget"}</span>
                          </div>
                          <span className={cn("font-medium shrink-0", isOver ? "text-[var(--color-expense)] font-bold" : "text-muted-foreground")}>
                            {formatCurrency(b.spent)} / {formatCurrency(b.limit)} <span className="font-semibold">({pct}%)</span>
                          </span>
                        </div>
                        <BudgetProgress value={pct} color={category?.color} />
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                          <span className="capitalize">{b.period}</span>
                          <span className={isOver ? "text-[var(--color-expense)] font-semibold" : "text-[var(--color-income)]"}>
                            {isOver ? `Over by ${formatCurrency(b.spent - b.limit)}` : `${formatCurrency(b.limit - b.spent)} remaining`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No active budgets configured. Visit the Budget page to set category spending limits.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onEdit={(t) => {
            setSelectedTx(null);
            setEditTx(t);
          }}
          onDelete={async (t) => {
            await deleteTransaction(t.id);
            setSelectedTx(null);
          }}
          onDuplicate={async (t) => {
            await duplicateTransaction(t);
            setSelectedTx(null);
          }}
        />
      )}

      {/* Add / Edit Transaction Modal */}
      {(showAdd || editTx) && (
        <TransactionFormModal
          transaction={editTx}
          onSave={async (data: NewTransaction, existing: Transaction | null) => {
            if (existing) {
              await updateTransaction(existing.id, data);
            } else {
              await addTransaction(data);
            }
            setShowAdd(false);
            setEditTx(null);
          }}
          onClose={() => {
            setShowAdd(false);
            setEditTx(null);
          }}
        />
      )}
    </AppLayout>
  );
}
