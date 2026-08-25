import { useState, useMemo } from "react";
import {
  formatCurrency, calcSummary, type Transaction, type TransactionType,
} from "@/lib/mock-data.ts";
import AppLayout from "@/components/app-layout.tsx";
import PageHeader from "@/components/page-header.tsx";
import TransactionRow from "@/components/transaction-row.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import {
  Search, Plus, X, TrendingUp, TrendingDown, ArrowLeftRight,
  ArrowUpDown, FileSpreadsheet, Printer, ArrowRightLeft,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { motion, AnimatePresence } from "motion/react";
import TransactionDetailModal from "./_components/TransactionDetailModal.tsx";
import TransactionFormModal from "./_components/TransactionFormModal.tsx";
import DeleteConfirmDialog from "./_components/DeleteConfirmDialog.tsx";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import CalendarFilter, { type CalendarFilterValue, matchesCalendarFilter } from "@/components/calendar-filter.tsx";
import { exportToCSV, exportToPDF } from "@/lib/export-utils.ts";
import { IconOrLogoDisplay } from "@/pages/categories/page.tsx";

type SortField = "date" | "amount" | "title";
type SortDir = "asc" | "desc";

export default function TransactionsPage() {
  const {
    transactions,
    categories,
    incomeSources,
    paymentMethods,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
  } = useTransactions();

  const [tab, setTab] = useState<"all" | TransactionType>("all");
  const [rawSearch, setRawSearch] = useState("");
  const [search] = useDebounce(rawSearch, 300);

  // Calendar filter state
  const [dateFilter, setDateFilter] = useState<CalendarFilterValue>({
    preset: "all",
    label: "All Time",
  });

  // Dynamic filters matching active tab
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [viewTx, setViewTx] = useState<Transaction | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Helper resolvers for dynamic metadata
  const getCat = (id: string) => categories.find((c) => c.id === id);
  const getSrc = (id: string) => incomeSources.find((s) => s.id === id);
  const getPm = (id: string) => paymentMethods.find((p) => p.id === id);

  // Reset tab-specific filters on tab switch
  const handleTabChange = (newTab: "all" | TransactionType) => {
    setTab(newTab);
    setCategoryFilter("all");
    setSourceFilter("all");
  };

  const filtered = useMemo(() => {
    let txs = [...transactions];

    if (tab !== "all") txs = txs.filter((t: Transaction) => t.type === tab);

    const q = search.trim().length >= 2 ? search.toLowerCase() : "";
    if (q) {
      txs = txs.filter(
        (t: Transaction) =>
          t.title.toLowerCase().includes(q) ||
          getCat(t.categoryId)?.name.toLowerCase().includes(q) ||
          (t.sourceId && getSrc(t.sourceId)?.name.toLowerCase().includes(q))
      );
    }

    // Category filter for expense/all
    if (tab !== "income" && categoryFilter !== "all") {
      txs = txs.filter((t: Transaction) => t.categoryId === categoryFilter);
    }

    // Income source filter for income tab
    if (tab === "income" && sourceFilter !== "all") {
      txs = txs.filter((t: Transaction) => t.sourceId === sourceFilter);
    }

    if (methodFilter !== "all") txs = txs.filter((t: Transaction) => t.paymentMethodId === methodFilter);
    if (statusFilter !== "all") txs = txs.filter((t: Transaction) => t.status === statusFilter);

    // Universal calendar filter
    txs = txs.filter((t: Transaction) => matchesCalendarFilter(t.date, dateFilter));

    txs.sort((a: Transaction, b: Transaction) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime();
      } else if (sortField === "amount") {
        cmp = a.amount - b.amount;
      } else {
        cmp = a.title.localeCompare(b.title);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return txs;
  }, [transactions, tab, search, categoryFilter, sourceFilter, methodFilter, statusFilter, dateFilter, sortField, sortDir, categories, incomeSources]);

  const summary = useMemo(() => calcSummary(filtered), [filtered]);

  const clearFilters = () => {
    setRawSearch("");
    setDateFilter({ preset: "all", label: "All Time" });
    setCategoryFilter("all");
    setSourceFilter("all");
    setMethodFilter("all");
    setStatusFilter("all");
  };

  const activeFilters = [
    search,
    dateFilter.preset !== "all" ? "date" : "",
    categoryFilter !== "all" ? categoryFilter : "",
    sourceFilter !== "all" ? sourceFilter : "",
    methodFilter !== "all" ? methodFilter : "",
    statusFilter !== "all" ? statusFilter : "",
  ].filter(Boolean).length;

  const handleExportCSV = () => {
    const exportData = filtered.map((t) => ({
      ID: t.id,
      Date: t.date,
      Time: t.time,
      Type: t.type.toUpperCase(),
      Title: t.title,
      CategoryOrSource:
        t.type === "income"
          ? getSrc(t.sourceId || "")?.name || "Income"
          : getCat(t.categoryId)?.name || t.categoryId,
      PaymentAccount: getPm(t.paymentMethodId)?.name || t.paymentMethodId,
      Amount: t.amount,
      Status: t.status.toUpperCase(),
      Notes: t.notes || "",
    }));

    exportToCSV(exportData, `transactions-${tab}`, {
      title: `${tab.toUpperCase()} Statement`,
      dateRange: dateFilter.label,
      totalCount: filtered.length,
      totalAmount: summary.balance,
    });
    toast.success("Statement exported to CSV / Excel!");
  };

  const handleExportPDF = () => {
    const exportData = filtered.map((t) => ({
      date: `${t.date} ${t.time}`,
      type: t.type,
      title: t.title,
      details:
        t.type === "income"
          ? `Source: ${getSrc(t.sourceId || "")?.name || "Income"}`
          : `Category: ${getCat(t.categoryId)?.name || t.categoryId}`,
      amount:
        t.type === "income"
          ? `+₹${t.amount.toLocaleString()}`
          : t.type === "expense"
          ? `-₹${t.amount.toLocaleString()}`
          : `₹${t.amount.toLocaleString()}`,
      status: t.status,
    }));

    exportToPDF(
      exportData,
      {
        title: `Official ${tab.toUpperCase()} Statement`,
        dateRange: dateFilter.label,
        totalCount: filtered.length,
        totalAmount: summary.balance,
      },
      [
        { key: "date", label: "Date & Time" },
        { key: "title", label: "Description" },
        { key: "details", label: "Category / Stream" },
        { key: "amount", label: "Amount (₹)" },
        { key: "status", label: "Status" },
      ]
    );
    toast.success("Generating formal printable PDF…");
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-8 max-w-[1200px] mx-auto space-y-4">
        {/* Page Header */}
        <PageHeader
          title="Master Transactions"
          subtitle="Unified financial ledger with instant search, sorting, and reporting"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-9 cursor-pointer"
                onClick={handleExportCSV}
              >
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span className="hidden sm:inline">Export Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-9 cursor-pointer"
                onClick={handleExportPDF}
              >
                <Printer size={14} />
                <span className="hidden sm:inline">Export PDF</span>
              </Button>
              <Button onClick={() => setShowAdd(true)} className="gap-2 text-xs h-9">
                <Plus size={15} /> Add Record
              </Button>
            </div>
          }
        />

        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
          {[
            { label: "Filtered Income", shortLabel: "Income", value: summary.income, icon: TrendingUp, color: "text-[var(--color-income)]", bg: "bg-[var(--color-income-bg)]" },
            { label: "Filtered Expenses", shortLabel: "Expense", value: summary.expense, icon: TrendingDown, color: "text-[var(--color-expense)]", bg: "bg-[var(--color-expense-bg)]" },
            { label: "Net Cashflow", shortLabel: "Net Flow", value: summary.balance, icon: ArrowLeftRight, color: summary.balance >= 0 ? "text-[var(--color-income)]" : "text-[var(--color-expense)]", bg: "bg-primary/10" },
          ].map((s) => (
            <Card key={s.label} className="overflow-hidden">
              <CardContent className="p-2 sm:p-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
                <span className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                  <s.icon size={14} className={s.color} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate sm:hidden">{s.shortLabel}</p>
                  <p className="hidden sm:block text-[11px] text-muted-foreground font-medium truncate">{s.label}</p>
                  <p className={cn("text-xs sm:text-base font-bold tabular-nums truncate", s.color)}>
                    {formatCurrency(s.value)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters & Dynamic Tabs Row */}
        <div className="space-y-2.5">
          {/* Top Tabs with Tab Selection */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <Tabs value={tab} onValueChange={(v) => handleTabChange(v as "all" | TransactionType)}>
              <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex h-9 p-1">
                <TabsTrigger value="all" className="text-xs">All Records</TabsTrigger>
                <TabsTrigger value="expense" className="text-xs">Expenses (-)</TabsTrigger>
                <TabsTrigger value="income" className="text-xs">Income (+)</TabsTrigger>
                <TabsTrigger value="transfer" className="text-xs flex items-center gap-1">
                  <ArrowRightLeft size={12} /> Transfers (0)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Universal Calendar Filter */}
            <CalendarFilter value={dateFilter} onChange={setDateFilter} />
          </div>

          {/* DYNAMIC PARAMETERS ROW WITH EXPLICIT LABELS */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 items-center">
            {/* Search Input */}
            <div className="relative col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 h-9 text-xs"
                placeholder={
                  tab === "income"
                    ? "Search salary, client, project…"
                    : tab === "transfer"
                    ? "Search transfer title…"
                    : "Search expense title or category…"
                }
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
              />
              {rawSearch && (
                <button onClick={() => setRawSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* EXPENSE & ALL TAB: Show Categories Dropdown */}
            {tab !== "income" && tab !== "transfer" && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[170px] text-xs">
                  <SelectValue placeholder="Category: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Category: All</SelectItem>
                  {categories.filter((c) => tab === "all" || c.type === "expense").map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-1.5">
                        <IconOrLogoDisplay icon={c.icon} className="w-3.5 h-3.5" />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* INCOME TAB: Show Income Streams Dropdown */}
            {tab === "income" && (
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[180px] text-xs">
                  <SelectValue placeholder="Income Stream: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Income Stream: All</SelectItem>
                  {incomeSources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-1.5">
                        <IconOrLogoDisplay icon={s.icon} className="w-3.5 h-3.5" />
                        <span>{s.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* PAYMENT ACCOUNT DROPDOWN WITH CONTEXTUAL LABEL */}
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="h-9 w-full sm:w-[180px] text-xs">
                <SelectValue
                  placeholder={
                    tab === "income"
                      ? "Deposited In: All"
                      : tab === "transfer"
                      ? "Source Account: All"
                      : "Paid From: All"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {tab === "income" ? "Deposited In: All" : tab === "transfer" ? "Source Account: All" : "Paid From: All"}
                </SelectItem>
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

            {/* SORT BUTTON WITH EXPLICIT ORDER */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1 text-xs"
              onClick={() => {
                if (sortField === "date") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                else { setSortField("date"); setSortDir("desc"); }
              }}
            >
              <ArrowUpDown size={13} /> {sortDir === "desc" ? "Newest First" : "Oldest First"}
            </Button>

            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground cursor-pointer text-xs" onClick={clearFilters}>
                <X size={13} /> Reset ({activeFilters})
              </Button>
            )}
          </div>
        </div>

        {/* Transaction List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 border rounded-xl bg-card">
            <p className="text-sm font-semibold">No records match your criteria</p>
            <p className="text-xs text-muted-foreground mt-1">Try selecting a different date range or resetting filters</p>
            {activeFilters > 0 && (
              <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={clearFilters}>
                Reset all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {filtered.map((t) => (
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

      {/* Modals */}
      {viewTx && (
        <TransactionDetailModal
          transaction={viewTx}
          onClose={() => setViewTx(null)}
          onEdit={() => { setEditTx(viewTx); setViewTx(null); }}
          onDelete={() => { setDeleteTx(viewTx); setViewTx(null); }}
          onDuplicate={() => { duplicateTransaction(viewTx); setViewTx(null); }}
        />
      )}

      {(showAdd || editTx) && (
        <TransactionFormModal
          transaction={editTx}
          defaultType={tab === "all" ? "expense" : tab}
          onSave={editTx ? (data) => updateTransaction(editTx.id, data) : addTransaction}
          onClose={() => { setShowAdd(false); setEditTx(null); }}
        />
      )}

      {deleteTx && (
        <DeleteConfirmDialog
          transaction={deleteTx}
          onConfirm={() => { deleteTransaction(deleteTx.id); setDeleteTx(null); }}
          onClose={() => setDeleteTx(null)}
        />
      )}
    </AppLayout>
  );
}
