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
  TrendingUp, Plus, FileSpreadsheet, Printer, Search, X,
  ArrowUpDown, Filter, Wallet, CheckCircle2, Clock, XCircle
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

export default function IncomePage() {
  const {
    transactions,
    incomeSources,
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

  const [sourceFilter, setSourceFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [viewTx, setViewTx] = useState<Transaction | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Combine incomeSources and income categories
  const allStreams = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon: string; type?: string; color?: string }>();
    incomeSources.forEach((s) => map.set(s.id, { id: s.id, name: s.name, icon: s.icon, type: s.type, color: s.color }));
    categories.filter((c) => c.type === "income" || c.type === "all").forEach((c) => {
      if (!map.has(c.id)) {
        map.set(c.id, { id: c.id, name: c.name, icon: c.icon, type: "Category", color: c.color });
      }
    });
    return Array.from(map.values());
  }, [incomeSources, categories]);

  const getSource = (id: string) => {
    return allStreams.find((s) => s.id === id) || incomeSources.find((s) => s.id === id) || categories.find((c) => c.id === id);
  };

  // Filtered & Sorted Income Transactions
  const incomeTxs = useMemo(() => {
    let txs = transactions.filter((t: Transaction) => t.type === "income");

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      txs = txs.filter((t) => {
        const stream = getSource(t.sourceId || t.categoryId || "");
        const acc = paymentMethods.find((p) => p.id === t.paymentMethodId);
        return (
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (stream && stream.name.toLowerCase().includes(q)) ||
          (acc && acc.name.toLowerCase().includes(q)) ||
          String(t.amount).includes(q) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
        );
      });
    }

    // Source stream filter
    if (sourceFilter !== "all") {
      txs = txs.filter((t: Transaction) => t.sourceId === sourceFilter || t.categoryId === sourceFilter);
    }

    // Payment account filter
    if (accountFilter !== "all") {
      txs = txs.filter((t: Transaction) => t.paymentMethodId === accountFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      txs = txs.filter((t: Transaction) => t.status === statusFilter);
    }

    // Date interval filter
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
  }, [transactions, search, sourceFilter, accountFilter, statusFilter, dateFilter, sortField, sortDir, allStreams, paymentMethods]);

  const totalIncome = incomeTxs.filter((t: Transaction) => t.status === "completed").reduce((s: number, t: Transaction) => s + t.amount, 0);
  const monthlyData = useMemo(() => getMonthlyData(6, transactions), [transactions]);
  const thisMonth = monthlyData[monthlyData.length - 1]?.income ?? 0;
  const avgIncome = incomeTxs.length > 0 ? Math.round(totalIncome / incomeTxs.length) : 0;

  const bySource = useMemo(() => {
    return allStreams.map((src) => {
      const total = transactions
        .filter((t: Transaction) => t.type === "income" && (t.sourceId === src.id || t.categoryId === src.id) && t.status === "completed")
        .reduce((s: number, t: Transaction) => s + t.amount, 0);
      return { ...src, total };
    }).filter((s) => s.total > 0);
  }, [allStreams, transactions]);

  const handleExportCSV = () => {
    const exportData = incomeTxs.map((t) => ({
      Date: t.date,
      Time: t.time,
      Title: t.title,
      Source: getSource(t.sourceId || t.categoryId || "")?.name || "Income",
      Account: paymentMethods.find((p) => p.id === t.paymentMethodId)?.name || "Default Account",
      Amount: t.amount,
      Status: t.status.toUpperCase(),
      Notes: t.notes || "",
    }));

    exportToCSV(exportData, "income-statement", {
      title: "Income Statement & Sources Report",
      dateRange: dateFilter.label,
      totalCount: incomeTxs.length,
      totalAmount: totalIncome,
    });
    toast.success("Income statement exported to Excel / CSV!");
  };

  const handleExportPDF = () => {
    const exportData = incomeTxs.map((t) => ({
      date: `${t.date} ${t.time}`,
      title: t.title,
      source: getSource(t.sourceId || t.categoryId || "")?.name || "Income",
      account: paymentMethods.find((p) => p.id === t.paymentMethodId)?.name || "Default Account",
      amount: `+₹${t.amount.toLocaleString()}`,
      status: t.status,
    }));

    exportToPDF(
      exportData,
      {
        title: "Official Income Statement",
        dateRange: dateFilter.label,
        totalCount: incomeTxs.length,
        totalAmount: totalIncome,
      },
      [
        { key: "date", label: "Date & Time" },
        { key: "title", label: "Description" },
        { key: "source", label: "Income Source" },
        { key: "account", label: "Deposited Account" },
        { key: "amount", label: "Amount (₹)" },
        { key: "status", label: "Status" },
      ]
    );
    toast.success("Generating formal printable Income statement…");
  };

  const hasActiveFilters = Boolean(
    rawSearch || sourceFilter !== "all" || accountFilter !== "all" || statusFilter !== "all" || dateFilter.preset !== "all"
  );

  const resetFilters = () => {
    setRawSearch("");
    setSourceFilter("all");
    setAccountFilter("all");
    setStatusFilter("all");
    setDateFilter({ preset: "all", label: "All Time" });
  };

  return (
    <AppLayout>
      <div className="p-5 md:p-8 max-w-[1300px] mx-auto space-y-6">
        <PageHeader
          title="Income"
          subtitle="Track all your dynamic income streams, earnings, and deposit accounts"
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
                <Plus size={16} /> Add Income
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
                placeholder="Search description, income stream, account, tags, amount…"
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
            {/* Income Stream Filter */}
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-[190px] h-8 text-xs">
                <SelectValue placeholder="Stream: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Stream: All</SelectItem>
                {allStreams.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-1.5">
                      <IconOrLogoDisplay icon={s.icon} className="w-3.5 h-3.5" />
                      <span>{s.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Deposit Account Filter */}
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

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Filtered Income</p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums text-[var(--color-income)]">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-muted-foreground mt-1">{incomeTxs.length} active records</p>
          </CardContent></Card>
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg per Entry</p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums">{formatCurrency(avgIncome)}</p>
            <p className="text-xs text-muted-foreground mt-1">Average transaction</p>
          </CardContent></Card>
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground mb-1">This Month</p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums">{formatCurrency(thisMonth)}</p>
            <p className="text-xs text-[var(--color-income)] font-medium mt-1">Current month total</p>
          </CardContent></Card>
          <Card className="overflow-hidden"><CardContent className="p-3.5 sm:p-4">
            <p className="text-xs text-muted-foreground mb-1">Active Income Streams</p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums">{bySource.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Earning channels</p>
          </CardContent></Card>
        </div>

        {/* Dynamic Income Stream Breakdown */}
        {bySource.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Income Stream Breakdown</h2>
              <span className="text-[11px] text-muted-foreground">Click any stream to filter</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {bySource.map((s) => {
                const isSelected = sourceFilter === s.id;
                return (
                  <Card
                    key={s.id}
                    onClick={() => setSourceFilter(isSelected ? "all" : s.id)}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary",
                      isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""
                    )}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center p-0.5 bg-muted/40 aspect-square">
                          <IconOrLogoDisplay icon={s.icon} className="w-5 h-5" />
                        </div>
                        <p className="font-semibold text-xs truncate">{s.name}</p>
                      </div>
                      <p className="text-sm sm:text-base font-bold tabular-nums text-[var(--color-income)]">{formatCurrency(s.total)}</p>
                      <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{s.type || "Income"}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Income Chart */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--color-income)]" />
              6-Month Income Trend
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
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0), "Income"]}
                    contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Income History ({incomeTxs.length})</h2>
            <span className="text-xs text-muted-foreground">
              {hasActiveFilters
                ? `Showing ${incomeTxs.length} of ${transactions.filter((t) => t.type === "income").length} records`
                : `${incomeTxs.length} records`}
            </span>
          </div>

          {incomeTxs.length === 0 ? (
            <div className="text-center py-12 border rounded-xl text-muted-foreground text-sm space-y-2 bg-card">
              <p>No income transactions matched your search or filters.</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {incomeTxs.map((t: Transaction) => (
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
          defaultType="income"
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
