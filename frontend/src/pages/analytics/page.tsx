import { useMemo, useState } from "react";
import AppLayout from "@/components/app-layout.tsx";
import PageHeader from "@/components/page-header.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  getMonthlyData, getCategoryExpenseData, formatCurrency, calcSummary,
  type Transaction, type Category, type IncomeSource,
} from "@/lib/mock-data.ts";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis,
} from "recharts";
import {
  subDays, format, parseISO, isWithinInterval,
  startOfDay, endOfDay, getDay,
} from "date-fns";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Repeat2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils.ts";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import { IconOrLogoDisplay } from "@/pages/categories/page.tsx";

type Period = "1w" | "1m" | "3m" | "6m" | "9m" | "1y";

function getDailyData(days: number, txs: Transaction[]) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(today, days - 1 - i);
    const label = days <= 14 ? format(d, "EEE dd") : format(d, "dd MMM");
    const dayTxs = txs.filter((t) => {
      const td = parseISO(t.date);
      return isWithinInterval(td, { start: startOfDay(d), end: endOfDay(d) });
    });
    const { income, expense } = calcSummary(dayTxs);
    return { label, income, expense, net: income - expense };
  });
}

function getWeekdaySpendData(txs: Transaction[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totals = Array(7).fill(0) as number[];
  const counts = Array(7).fill(0) as number[];
  txs.filter((t) => t.type === "expense" && t.status === "completed").forEach((t) => {
    const dow = getDay(parseISO(t.date));
    totals[dow] += t.amount;
    counts[dow]++;
  });
  return days.map((name, i) => ({ name, avg: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0, total: totals[i] }));
}

const VIBRANT_PALETTE = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];

function getIncomeSourceBreakdown(txs: Transaction[], sources: IncomeSource[], categories: Category[]) {
  const map: Record<string, number> = {};
  txs.filter((t) => t.type === "income" && t.status === "completed").forEach((t) => {
    const src = sources.find((s) => s.id === t.categoryId || s.id === t.sourceId) || categories.find((c) => c.id === t.categoryId);
    const name = src?.name || "General Income";
    map[name] = (map[name] ?? 0) + t.amount;
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map).map(([name, amount], idx) => {
    const src = sources.find((s) => s.name === name) || categories.find((c) => c.name === name);
    return {
      name,
      icon: src?.icon || "💰",
      amount,
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: src?.color || VIBRANT_PALETTE[idx % VIBRANT_PALETTE.length],
    };
  }).sort((a, b) => b.amount - a.amount);
}

function getSavingsRate(months: number, txs: Transaction[]) {
  return getMonthlyData(months, txs).map((d) => ({
    ...d,
    savingsRate: d.income > 0 ? Math.round(((d.income - d.expense) / d.income) * 100) : 0,
  }));
}

export default function AnalyticsPage() {
  const { transactions, categories, incomeSources } = useTransactions();
  const [period, setPeriod] = useState<Period>("1m");
  const [chartType, setChartType] = useState<"area" | "bar" | "line">("area");

  const chartData = useMemo(() => {
    if (period === "1w") return getDailyData(7, transactions);
    if (period === "1m") return getDailyData(30, transactions);
    if (period === "3m") return getMonthlyData(3, transactions);
    if (period === "6m") return getMonthlyData(6, transactions);
    if (period === "9m") return getMonthlyData(9, transactions);
    return getMonthlyData(12, transactions);
  }, [period, transactions]);

  const categoryData = useMemo(() => getCategoryExpenseData(transactions, categories), [transactions, categories]);
  const weekdayData = useMemo(() => getWeekdaySpendData(transactions), [transactions]);
  const incomeSourceData = useMemo(() => getIncomeSourceBreakdown(transactions, incomeSources, categories), [transactions, incomeSources, categories]);
  const savingsData = useMemo(() => getSavingsRate(6, transactions), [transactions]);

  const totalIncome = chartData.reduce((s, d) => s + d.income, 0);
  const totalExpense = chartData.reduce((s, d) => s + d.expense, 0);
  const netFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Top spending categories radar data
  const radarData = useMemo(() => {
    const list = categories.filter((c) => c.type === "expense" || !c.type || c.type === "all");
    if (list.length === 0) return [];
    return list.slice(0, 6).map((c) => {
      const spent = transactions
        .filter((t: Transaction) => t.categoryId === c.id && t.type === "expense" && t.status === "completed")
        .reduce((s: number, t: Transaction) => s + t.amount, 0);
      return { category: c.name, spent, budget: c.budget || (spent > 0 ? spent * 1.2 : 5000) };
    });
  }, [categories, transactions]);

  const kpis = [
    { label: "Total Income", value: formatCurrency(totalIncome), icon: TrendingUp, color: "text-[var(--color-income)]", bg: "bg-[var(--color-income-bg)]", trend: "+8.2% vs prev period", up: true },
    { label: "Total Expenses", value: formatCurrency(totalExpense), icon: TrendingDown, color: "text-[var(--color-expense)]", bg: "bg-[var(--color-expense-bg)]", trend: "+3.1% vs prev period", up: false },
    { label: "Net Cash Flow", value: formatCurrency(netFlow), icon: Minus, color: netFlow >= 0 ? "text-[var(--color-income)]" : "text-[var(--color-expense)]", bg: netFlow >= 0 ? "bg-[var(--color-income-bg)]" : "bg-[var(--color-expense-bg)]", trend: netFlow >= 0 ? "Positive cash flow" : "Negative cash flow", up: netFlow >= 0 },
    { label: "Savings Rate", value: `${savingsRate}%`, icon: Repeat2, color: savingsRate >= 20 ? "text-[var(--color-income)]" : "text-[var(--color-warning)]", bg: savingsRate >= 20 ? "bg-[var(--color-income-bg)]" : "bg-[var(--color-warning-bg)]", trend: savingsRate >= 20 ? "Good savings habit" : "Below 20% target", up: savingsRate >= 20 },
  ];

  return (
    <AppLayout>
      <div className="p-5 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <PageHeader title="Analytics" subtitle="Visual insights into your financial patterns" />

        {/* Controls */}
        <motion.div
          className="flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto max-w-full">
            {(["1w", "1m", "3m", "6m", "9m", "1y"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer shrink-0",
                  period === p ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p === "1w" ? "1W" : p === "1m" ? "1M" : p === "3m" ? "3M" : p === "6m" ? "6M" : p === "9m" ? "9M" : "1Y"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {(["area", "bar", "line"] as const).map((ct) => (
              <button
                key={ct}
                onClick={() => setChartType(ct)}
                className={cn(
                  "px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize cursor-pointer",
                  chartType === ct ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {ct}
              </button>
            ))}
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
            >
              <Card className="hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">{k.label}</p>
                    <span className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0", k.bg)}>
                      <k.icon size={14} className={k.color} />
                    </span>
                  </div>
                  <p className={cn("text-base sm:text-xl font-bold tabular-nums truncate", k.color)}>{k.value}</p>
                  <p className={cn("text-[10px] sm:text-[11px] mt-1 flex items-center gap-1 truncate", k.up ? "text-[var(--color-income)]" : "text-muted-foreground")}>
                    {k.up ? <ArrowUpRight size={11} className="shrink-0" /> : <ArrowDownRight size={11} className="shrink-0" />}
                    <span className="truncate">{k.trend}</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Income vs Expense Trend</CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--color-income)]" /> Income</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--color-expense)]" /> Expense</span>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={280}>
              {chartType === "area" ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="anIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="anExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(v, n) => [formatCurrency(Number(v)), n === "income" ? "Income" : "Expense"]} contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }} />
                  <Area type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} fill="url(#anIncomeGrad)" />
                  <Area type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2} fill="url(#anExpenseGrad)" />
                </AreaChart>
              ) : chartType === "bar" ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(v, n) => [formatCurrency(Number(v)), n === "income" ? "Income" : "Expense"]} contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--color-expense)" radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(v, n) => [formatCurrency(Number(v)), n === "income" ? "Income" : "Expense"]} contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }} />
                  <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Breakdown Row: Expenses & Income */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category expense breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle></CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-[160px] h-[160px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} dataKey="amount" cx="50%" cy="50%" outerRadius={72} innerRadius={40} paddingAngle={2}>
                          {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2.5 w-full">
                    {categoryData.map((d) => (
                      <div key={d.name || d.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            <IconOrLogoDisplay icon={d.icon} className="w-3.5 h-3.5 text-xs inline-block shrink-0" />
                            <span className="text-xs font-medium truncate">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-muted-foreground">{formatCurrency(d.amount)}</span>
                            <span className="text-xs font-semibold tabular-nums">{d.pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">No expense data recorded</div>
              )}
            </CardContent>
          </Card>

          {/* Income sources */}
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Income Sources</CardTitle></CardHeader>
            <CardContent>
              {incomeSourceData.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-[160px] h-[160px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={incomeSourceData} dataKey="amount" cx="50%" cy="50%" outerRadius={72} innerRadius={40} paddingAngle={2}>
                          {incomeSourceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2.5 w-full">
                    {incomeSourceData.map((d) => (
                      <div key={d.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            <IconOrLogoDisplay icon={d.icon} className="w-3.5 h-3.5 text-xs inline-block shrink-0" />
                            <span className="text-xs font-medium truncate">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-muted-foreground">{formatCurrency(d.amount)}</span>
                            <span className="text-xs font-semibold tabular-nums">{d.pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">No income data recorded</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Savings Rate Trend + Weekday Spending */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Savings Rate Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={savingsData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="srGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip formatter={(v) => `${String(v)}%`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }} />
                  <Area type="monotone" dataKey="savingsRate" name="Savings Rate" stroke="var(--color-primary)" strokeWidth={2} fill="url(#srGrad)" dot={{ r: 4, fill: "var(--color-primary)" }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Avg Spend by Weekday</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekdayData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }} />
                  <Bar dataKey="avg" name="Avg Spend" fill="var(--color-expense)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Budget vs Actual Radar */}
        {radarData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Budget vs Actual Spending</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <Radar name="Budget" dataKey="budget" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.12} strokeWidth={2} />
                  <Radar name="Spent" dataKey="spent" stroke="var(--color-expense)" fill="var(--color-expense)" fillOpacity={0.18} strokeWidth={2} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-0.5 bg-[var(--color-primary)] inline-block rounded" /> Budget limit
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-0.5 bg-[var(--color-expense)] inline-block rounded" /> Actual spend
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
