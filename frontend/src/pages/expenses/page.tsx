import { useMemo, useState } from "react";
import AppLayout from "@/components/app-layout.tsx";
import PageHeader from "@/components/page-header.tsx";
import TransactionRow from "@/components/transaction-row.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { formatCurrency, getMonthlyData } from "@/lib/mock-data.ts";
import type { Transaction } from "@/lib/mock-data.ts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingDown, Plus, FileSpreadsheet, Printer, Search, X,
  ArrowUpDown, Filter, Tag, CreditCard, CheckCircle2, Clock, XCircle
} from "lucide-react";
import TransactionDetailModal from "@/pages/transactions/_components/TransactionDetailModal.tsx";
import TransactionFormModal from "@/pages/transactions/_components/TransactionFormModal.tsx";
import DeleteConfirmDialog from "@/pages/transactions/_components/DeleteConfirmDialog.tsx";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import CalendarFilter, { type CalendarFilterValue, matchesCalendarFilter } from "@/components/calendar-filter.tsx";
import { exportToCSV, exportToPDF } from "@/lib/export-utils.ts";
import { IconOrLogoDisplay } from "@/pages/categories/page.tsx";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { motion, AnimatePresence } from "motion/react";

type SortField = "date" | "amount" | "title";
type SortDir = "asc" | "desc";

export default function ExpensesPage() {
  const {
    transactions,
    categories,
    paymentMethods,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
  } = useTransactions();

  const [rawSearch, setRawSearch] = useState("");
  const [search] = useDebounce(rawSearch, 300);

  const [dateFilter, setDateFilter] = useState<CalendarFilterValue>({
    preset: "all",
    label: "All Time",
  });

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [viewTx, setViewTx] = useState<Transaction | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const getCat = (id: string) => categories.find((c) => c.id === id);

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === "expense" || c.type === "all");
  }, [categories]);

  // Filtered & Sorted Expense Transactions
  const expenseTxs = useMemo(() => {
    let txs = transactions.filter((t: Transaction) => t.type === "expense");

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      txs = txs.filter((t) => {
        const cat = getCat(t.categoryId);
        const acc = paymentMethods.find((p) => p.id === t.paymentMethodId);
        return (
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (cat && cat.name.toLowerCase().includes(q)) ||
          (acc && acc.name.toLowerCase().includes(q)) ||
          String(t.amount).includes(q) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
        );
      });
    }

    // Category filter
    if (categoryFilter !== "all") {
      txs = txs.filter((t: Transaction) => t.categoryId === categoryFilter);
    }

    // Payment account filter
    if (accountFilter !== "all") {
      txs = txs.filter((t: Transaction) => t.paymentMethodId === accountFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      txs = txs.filter((t: Transaction) => t.status === statusFilter);
    }

    // Date range filter
    txs = txs.filter((t: Transaction) => matchesCalendarFilter(t.date, dateFilter));

    // Dynamic sorting
    return [...txs].sort((a, b) => {
      let diff = 0;
      if (sortField === "date") {
        diff = `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`);
      } else if (sortField === "amount") {
        diff = a.amount - b.amount;
      } else if (sortField === "title") {
        diff = a.title.localeCompare(b.title);
      }
      return sortDir === "asc" ? diff : -diff;
    });
  }, [transactions, search, categoryFilter, accountFilter, statusFilter, dateFilter, sortField, sortDir, categories, paymentMethods]);

  const totalExpense = expenseTxs.filter((t) => t.status === "completed").reduce((s: number, t: Transaction) => s + t.amount, 0);
  const monthlyData = useMemo(() => getMonthlyData(6, transactions), [transactions]);
  const thisMonth = monthlyData[monthlyData.length - 1]?.expense ?? 0;
  const avgPerTx = expenseTxs.length > 0 ? Math.round(totalExpense / expenseTxs.length) : 0;

  // Category spending breakdown for active results
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenseTxs.forEach((t) => {
      if (t.categoryId) {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      }
    });
    return Object.entries(map)
      .map(([id, amount]) => {
        const cat = getCat(id);
        const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
        const displayName = cat?.name || (id.length > 20 ? "General Expense" : id);
        return { id, name: displayName, icon: cat?.icon || "📁", amount, pct };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenseTxs, categories, totalExpense]);

  const handleExportCSV = () => {
    const exportData = expenseTxs.map((t) => ({
      Date: t.date,
      Time: t.time,
      Title: t.title,
      Category: getCat(t.categoryId)?.name || "Expense",
      Account: paymentMethods.find((p) => p.id === t.paymentMethodId)?.name || "Default Account",
      Amount: t.amount,
      Status: t.status.toUpperCase(),
      Notes: t.notes || "",
    }));

    exportToCSV(exportData, "expense-statement", {
      title: "Expense Statement & Outflow Breakdown",
      dateRange: dateFilter.label,
      totalCount: expenseTxs.length,
      totalAmount: totalExpense,
    });
    toast.success("Expense statement exported to Excel / CSV!");
  };

  const handleExportPDF = () => {
    const exportData = expenseTxs.map((t) => ({
      date: `${t.date} ${t.time}`,
      title: t.title,
      category: getCat(t.categoryId)?.name || "Expense",
      account: paymentMethods.find((p) => p.id === t.paymentMethodId)?.name || "Default Account",
      amount: `-₹${t.amount.toLocaleString()}`,
      status: t.status,
    }));

    exportToPDF(
      exportData,
      {
        title: "Official Expense Statement",
        dateRange: dateFilter.label,
        totalCount: expenseTxs.length,
        totalAmount: totalExpense,
      },
      [
        { key: "date", label: "Date & Time" },
        { key: "title", label: "Description" },
        { key: "category", label: "Expense Category" },
        { key: "account", label: "Paid Account" },
        { key: "amount", label: "Amount (₹)" },
        { key: "status", label: "Status" },
      ]
    );
    toast.success("Generating formal printable Expense statement…");
  };

  const hasActiveFilters = Boolean(
    rawSearch || categoryFilter !== "all" || accountFilter !== "all" || statusFilter !== "all" || dateFilter.preset !== "all"
  );

  const resetFilters = () => {
    setRawSearch("");
    setCategoryFilter("all");
    setAccountFilter("all");
    setStatusFilter("all");
    setDateFilter({ preset: "all", label: "All Time" });
  };

  return (
    <AppLayout>
      <div className="p-5 md:p-8 max-w-[1300px] mx-auto space-y-6">
        <PageHeader
          title="Expenses"
          subtitle="Track, filter, and analyze all your spending by category and payment account"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs h-9 cursor-pointer">
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span className="hidden sm:inline">Export Excel</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5 text-xs h-9 cursor-pointer">
                <Printer size={14} />
                <span>PDF Print</span>
              </Button>
              <Button onClick={() => setShowAdd(true)} className="gap-2 text-xs h-9 cursor-pointer">
                <Plus size={16} /> Add Expense
              </Button>
            </div>
          }
        />

        {/* Dynamic Search, Filter & Calendar Controls Toolbar */}
        <div className="space-y-3 p-3.5 sm:p-4 border rounded-xl bg-card shadow-xs">
          {/* Row 1: Search + Calendar Range */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search description, category, payment account, tags, amount…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs"
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

          {/* Row 2: Secondary Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t">
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[190px] h-8 text-xs">
                <SelectValue placeholder="Category: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Category: All</SelectItem>
                {expenseCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-1.5">
                      <IconOrLogoDisplay icon={c.icon} className="w-3.5 h-3.5" />
                      <span>{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Account Filter */}
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                <SelectValue placeholder="Account: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Account: All</SelectItem>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-1.5">
                      <IconOrLogoDisplay icon={m.icon} className="w-3.5 h-3.5" />
                      <span>{m.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <div className="flex items-center gap-1 ml-auto">
              <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                <SelectTrigger className="h-8 text-xs w-[120px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="title">Description</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs gap-1 cursor-pointer"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                title={`Sort ${sortDir === "asc" ? "Descending" : "Ascending"}`}
              >
                <ArrowUpDown size={13} />
                <span className="capitalize">{sortDir}</span>
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={13} className="mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Summary KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Filtered Outflow</p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums text-[var(--color-expense)]">{formatCurrency(totalExpense)}</p>
            <p className="text-xs text-muted-foreground mt-1">{expenseTxs.length} active records</p>
          </CardContent></Card>
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg per Entry</p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums">{formatCurrency(avgPerTx)}</p>
            <p className="text-xs text-muted-foreground mt-1">Average transaction</p>
          </CardContent></Card>
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground mb-1">This Month</p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums">{formatCurrency(thisMonth)}</p>
            <p className="text-xs text-[var(--color-expense)] font-medium mt-1">Current month total</p>
          </CardContent></Card>
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground mb-1">Categories Impacted</p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums">{categoryData.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active categories</p>
          </CardContent></Card>
        </div>

        {/* Dynamic Category Spending Breakdown */}
        {categoryData.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Spending Breakdown</h2>
              <span className="text-[11px] text-muted-foreground">Click any category to filter</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {categoryData.map((c) => {
                const isSelected = categoryFilter === c.id;
                return (
                  <Card
                    key={c.id}
                    onClick={() => setCategoryFilter(isSelected ? "all" : c.id)}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary",
                      isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <IconOrLogoDisplay icon={c.icon} className="w-4 h-4" />
                        <p className="text-xs font-semibold truncate">{c.name}</p>
                      </div>
                      <p className="text-xs sm:text-sm font-bold tabular-nums">{formatCurrency(c.amount)}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                        <span>{c.pct}% of total</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* 6-Month Expense Trend Chart */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingDown size={16} className="text-[var(--color-expense)]" />
              6-Month Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0), "Expense"]}
                    contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Expense History ({expenseTxs.length})</h2>
            <span className="text-xs text-muted-foreground">
              {hasActiveFilters
                ? `Showing ${expenseTxs.length} of ${transactions.filter((t) => t.type === "expense").length} records`
                : `${expenseTxs.length} records`}
            </span>
          </div>

          {expenseTxs.length === 0 ? (
            <div className="text-center py-12 border rounded-xl text-muted-foreground text-sm space-y-2 bg-card">
              <p>No expense transactions matched your search or filters.</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {expenseTxs.map((t: Transaction) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TransactionRow
                      transaction={t}
                      onView={() => setViewTx(t)}
                      onEdit={() => setEditTx(t)}
                      onDelete={() => setDeleteTx(t)}
                      onDuplicate={() => duplicateTransaction(t)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {viewTx && (
        <TransactionDetailModal
          transaction={viewTx}
          onClose={() => setViewTx(null)}
          onEdit={() => {
            setEditTx(viewTx);
            setViewTx(null);
          }}
          onDelete={() => {
            setDeleteTx(viewTx);
            setViewTx(null);
          }}
          onDuplicate={() => {
            duplicateTransaction(viewTx);
            setViewTx(null);
          }}
        />
      )}
      {(showAdd || editTx) && (
        <TransactionFormModal
          transaction={editTx}
          defaultType="expense"
          onSave={async (data, existing) => {
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
      {deleteTx && (
        <DeleteConfirmDialog
          transaction={deleteTx}
          onConfirm={async () => {
            await deleteTransaction(deleteTx.id);
            setDeleteTx(null);
          }}
          onClose={() => setDeleteTx(null)}
        />
      )}
    </AppLayout>
  );
}
