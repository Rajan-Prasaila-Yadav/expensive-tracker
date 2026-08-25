import { useState, useMemo } from "react";
import AppLayout from "@/components/app-layout.tsx";
import PageHeader from "@/components/page-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import {
  CATEGORIES, PAYMENT_METHODS, calcSummary, formatCurrency,
  getCategoryById, getPaymentMethodById, type Transaction,
} from "@/lib/mock-data.ts";
import { Download, FileSpreadsheet, Printer, TrendingUp, TrendingDown, ArrowUpDown, ArrowRightLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { motion } from "motion/react";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import CalendarFilter, { type CalendarFilterValue, matchesCalendarFilter } from "@/components/calendar-filter.tsx";
import { exportToCSV, exportToPDF } from "@/lib/export-utils.ts";

type SortField = "date" | "amount" | "title";
type SortDir = "asc" | "desc";

export default function ReportsPage() {
  const { transactions, categories, paymentMethods } = useTransactions();
  const [dateFilter, setDateFilter] = useState<CalendarFilterValue>({
    preset: "month",
    label: "This Month",
  });

  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    return transactions
      .filter((t: Transaction) => {
        if (!matchesCalendarFilter(t.date, dateFilter)) return false;
        if (typeFilter !== "all" && t.type !== typeFilter) return false;
        if (categoryFilter !== "all" && t.categoryId !== categoryFilter) return false;
        if (methodFilter !== "all" && t.paymentMethodId !== methodFilter) return false;
        if (statusFilter !== "all" && t.status !== statusFilter) return false;
        return true;
      })
      .sort((a: Transaction, b: Transaction) => {
        let cmp = 0;
        if (sortField === "date") cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        else if (sortField === "amount") cmp = a.amount - b.amount;
        else cmp = a.title.localeCompare(b.title);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [transactions, dateFilter, typeFilter, categoryFilter, methodFilter, statusFilter, sortField, sortDir]);

  const summary = useMemo(() => calcSummary(filtered), [filtered]);

  // Category breakdown for mini table
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filtered
      .filter((t: Transaction) => t.type === "expense" && t.status === "completed")
      .forEach((t: Transaction) => {
        map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
      });
    return Object.entries(map)
      .map(([id, amount]) => ({
        cat: categories.find((c) => c.id === id) || getCategoryById(id),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filtered, categories]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d: SortDir) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const handleExportCSV = () => {
    const rows = filtered.map((tx: Transaction) => {
      const cat = categories.find((c) => c.id === tx.categoryId) || getCategoryById(tx.categoryId);
      const method = paymentMethods.find((p) => p.id === tx.paymentMethodId) || getPaymentMethodById(tx.paymentMethodId);
      return {
        Date: format(parseISO(tx.date), "dd/MM/yyyy"),
        Time: tx.time,
        Title: tx.title,
        Type: tx.type.toUpperCase(),
        Category: cat?.name ?? "",
        "Payment Method": method?.name ?? "",
        Status: tx.status.toUpperCase(),
        Amount: tx.type === "income" ? tx.amount : -tx.amount,
        Notes: tx.notes ?? "",
      };
    });

    exportToCSV(rows, "financeos-report", {
      title: "Comprehensive Financial Statement & Report",
      dateRange: dateFilter.label,
      totalCount: filtered.length,
      totalAmount: summary.balance,
    });
    toast.success("Financial statement exported to CSV / Excel!");
  };

  const handleExportPDF = () => {
    const rows = filtered.map((tx: Transaction) => {
      const cat = categories.find((c) => c.id === tx.categoryId) || getCategoryById(tx.categoryId);
      const method = paymentMethods.find((p) => p.id === tx.paymentMethodId) || getPaymentMethodById(tx.paymentMethodId);
      return {
        date: format(parseISO(tx.date), "dd/MM/yyyy"),
        time: tx.time,
        title: tx.title,
        type: tx.type,
        category: cat?.name ?? "",
        method: method?.name ?? "",
        amount: tx.amount,
        status: tx.status,
      };
    });

    exportToPDF(
      rows,
      {
        title: "Comprehensive Financial Statement & Statement of Cash Flows",
        dateRange: dateFilter.label,
        totalCount: filtered.length,
        totalAmount: summary.balance,
      },
      [
        { key: "date", label: "Date" },
        { key: "time", label: "Time" },
        { key: "title", label: "Description" },
        { key: "type", label: "Type" },
        { key: "category", label: "Category" },
        { key: "method", label: "Payment Wallet" },
        { key: "amount", label: "Amount (₹)" },
        { key: "status", label: "Status" },
      ]
    );
    toast.success("Audit-ready PDF statement generated!");
  };

  const summaryStats = [
    { label: "Filtered Income", value: summary.income, color: "text-[var(--color-income)]", bg: "bg-[var(--color-income-bg)]", icon: TrendingUp },
    { label: "Filtered Expenses", value: summary.expense, color: "text-[var(--color-expense)]", bg: "bg-[var(--color-expense-bg)]", icon: TrendingDown },
    { label: "Net Period Cashflow", value: summary.balance, color: summary.balance >= 0 ? "text-[var(--color-income)]" : "text-[var(--color-expense)]", bg: summary.balance >= 0 ? "bg-[var(--color-income-bg)]" : "bg-[var(--color-expense-bg)]", icon: ArrowRightLeft },
    { label: "Total Transactions", value: filtered.length, isCount: true, color: "text-foreground", bg: "bg-muted", icon: FileSpreadsheet },
  ];

  return (
    <AppLayout>
      <div className="p-5 md:p-8 max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Financial Reports & Statement"
          subtitle="Generate, filter, and export comprehensive financial records with instant CSV and PDF statements"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 cursor-pointer">
                <FileSpreadsheet size={14} className="text-emerald-500" /> Export CSV / Excel
              </Button>
              <Button size="sm" onClick={handleExportPDF} className="gap-1.5 cursor-pointer">
                <Download size={14} /> Export PDF Report
              </Button>
            </div>
          }
        />

        {/* Date Filter Presets */}
        <Card className="p-3">
          <CalendarFilter value={dateFilter} onChange={setDateFilter} />
        </Card>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                    <s.icon size={18} className={s.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                    <p className={cn("text-base font-bold tabular-nums truncate", s.color)}>
                      {s.isCount ? s.value : formatCurrency(s.value)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 items-center">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[130px] text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[140px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[140px] text-xs"><SelectValue placeholder="Payment Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wallets</SelectItem>
              {paymentMethods.map((m) => <SelectItem key={m.id} value={m.id}>{m.icon} {m.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[120px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Top Expense Categories Breakdown */}
        {categoryBreakdown.length > 0 && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Spending Categories</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {categoryBreakdown.map(({ cat, amount }) => (
                  <div key={cat?.id || amount} className="p-2.5 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{cat?.icon || "📁"}</span>
                      <span className="text-xs font-semibold truncate">{cat?.name}</span>
                    </div>
                    <p className="text-xs font-bold text-[var(--color-expense)] mt-1 tabular-nums">{formatCurrency(amount)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Data Table */}
        <Card className="overflow-hidden">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">Statement Data ({filtered.length} records)</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground text-left">
                  <th className="p-3 font-semibold cursor-pointer" onClick={() => toggleSort("date")}>
                    <div className="flex items-center gap-1">Date & Time <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer" onClick={() => toggleSort("title")}>
                    <div className="flex items-center gap-1">Title <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Payment Method</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right cursor-pointer" onClick={() => toggleSort("amount")}>
                    <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown size={12} /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No records found for the selected date period.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const cat = getCategoryById(t.categoryId);
                    const pm = getPaymentMethodById(t.paymentMethodId);
                    return (
                      <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-muted-foreground whitespace-nowrap">{t.date} {t.time}</td>
                        <td className="p-3 font-semibold truncate max-w-[200px]">{t.title}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <span>{cat?.icon}</span> <span>{cat?.name}</span>
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{pm?.icon} {pm?.name}</td>
                        <td className="p-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize",
                            t.status === "completed" && "bg-[var(--color-income-bg)] text-[var(--color-income)]",
                            t.status === "pending" && "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
                            t.status === "failed" && "bg-[var(--color-expense-bg)] text-[var(--color-expense)]"
                          )}>
                            {t.status}
                          </span>
                        </td>
                        <td className={cn(
                          "p-3 text-right font-bold tabular-nums",
                          t.type === "income" && "text-[var(--color-income)]",
                          t.type === "expense" && "text-[var(--color-expense)]",
                          t.type === "transfer" && "text-[var(--color-transfer)]"
                        )}>
                          {t.type === "income" ? `+${formatCurrency(t.amount)}` : `-${formatCurrency(t.amount)}`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
