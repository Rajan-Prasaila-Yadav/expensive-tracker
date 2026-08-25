import { useState, useMemo } from "react";
import { formatCurrency, type Transaction } from "@/lib/mock-data.ts";
import AppLayout from "@/components/app-layout.tsx";
import PageHeader from "@/components/page-header.tsx";
import TransactionRow from "@/components/transaction-row.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import {
  Search, Plus, X, ArrowLeftRight, ArrowUpDown,
  FileSpreadsheet, Printer, ShieldCheck, CheckCircle2, Clock
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { motion, AnimatePresence } from "motion/react";
import TransactionDetailModal from "@/pages/transactions/_components/TransactionDetailModal.tsx";
import TransactionFormModal from "@/pages/transactions/_components/TransactionFormModal.tsx";
import DeleteConfirmDialog from "@/pages/transactions/_components/DeleteConfirmDialog.tsx";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import CalendarFilter, { type CalendarFilterValue, matchesCalendarFilter } from "@/components/calendar-filter.tsx";
import { exportToCSV, exportToPDF } from "@/lib/export-utils.ts";
import { IconOrLogoDisplay } from "@/pages/categories/page.tsx";

type SortField = "date" | "amount" | "title";
type SortDir = "asc" | "desc";

export default function TransfersPage() {
  const {
    transactions,
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

  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [viewTx, setViewTx] = useState<Transaction | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const getPm = (id: string) => paymentMethods.find((p) => p.id === id);

  // Transfers only
  const allTransfers = useMemo(() => {
    return transactions.filter((t: Transaction) => t.type === "transfer");
  }, [transactions]);

  const filtered = useMemo(() => {
    let txs = [...allTransfers];

    const q = search.trim().toLowerCase();
    if (q) {
      txs = txs.filter((t: Transaction) => {
        const fromAcc = getPm(t.paymentMethodId);
        const toTag = t.tags?.find((tag) => tag.startsWith("to:"))?.replace("to:", "");
        const toAcc = toTag ? getPm(toTag) : undefined;
        return (
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (fromAcc && fromAcc.name.toLowerCase().includes(q)) ||
          (toAcc && toAcc.name.toLowerCase().includes(q)) ||
          String(t.amount).includes(q) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
        );
      });
    }

    if (methodFilter !== "all") {
      txs = txs.filter((t: Transaction) => t.paymentMethodId === methodFilter || t.tags?.includes(`to:${methodFilter}`));
    }
    if (statusFilter !== "all") txs = txs.filter((t: Transaction) => t.status === statusFilter);

    // Apply universal calendar filter
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
  }, [allTransfers, search, methodFilter, statusFilter, dateFilter, sortField, sortDir]);

  const totalVolume = useMemo(() => {
    return filtered.filter((t: Transaction) => t.status === "completed").reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  }, [filtered]);

  const completedCount = useMemo(() => {
    return filtered.filter((t: Transaction) => t.status === "completed").length;
  }, [filtered]);

  const pendingCount = useMemo(() => {
    return filtered.filter((t: Transaction) => t.status === "pending").length;
  }, [filtered]);

  const handleExportCSV = () => {
    const exportData = filtered.map((t) => ({
      Date: t.date,
      Time: t.time,
      Title: t.title,
      FromMethod: getPm(t.paymentMethodId)?.name || t.paymentMethodId,
      Amount: t.amount,
      Status: t.status.toUpperCase(),
      Notes: t.notes || "",
    }));

    exportToCSV(exportData, "transfers-statement", {
      title: "Account Transfers & Reallocations",
      dateRange: dateFilter.label,
      totalCount: filtered.length,
      totalAmount: totalVolume,
    });
    toast.success("Transfer statement exported to Excel / CSV!");
  };

  const handleExportPDF = () => {
    const exportData = filtered.map((t) => ({
      date: `${t.date} ${t.time}`,
      title: t.title,
      account: getPm(t.paymentMethodId)?.name || "Account",
      amount: `₹${t.amount.toLocaleString()}`,
      status: t.status,
    }));

    exportToPDF(
      exportData,
      {
        title: "Official Account Reallocations & Transfers",
        dateRange: dateFilter.label,
        totalCount: filtered.length,
        totalAmount: totalVolume,
      },
      [
        { key: "date", label: "Date & Time" },
        { key: "title", label: "Transfer Description" },
        { key: "account", label: "Source Account" },
        { key: "amount", label: "Volume (₹)" },
        { key: "status", label: "Status" },
      ]
    );
    toast.success("Generating formal printable Transfer statement…");
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-8 max-w-[1200px] mx-auto space-y-4">
        {/* Page Header */}
        <PageHeader
          title="Account Transfers"
          subtitle="Move funds between your bank accounts, digital wallets, and cash"
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
              <Button onClick={() => setShowAdd(true)} className="gap-2 text-xs h-9">
                <Plus size={15} /> Add Transfer
              </Button>
            </div>
          }
        />

        {/* Informative Banner */}
        <div className="p-3 rounded-xl bg-[var(--color-transfer-bg)] text-[var(--color-transfer)] text-xs flex items-start gap-2.5 border border-[var(--color-transfer)]/20">
          <ShieldCheck size={16} className="shrink-0 mt-0.5" />
          <span>
            <strong>Zero-Sum Integrity:</strong> Internal transfers adjust liquidity across accounts (e.g. Bank to eSewa) with zero net change to total wealth.
          </span>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="overflow-hidden">
            <CardContent className="p-3.5 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-[var(--color-transfer-bg)] text-[var(--color-transfer)] flex items-center justify-center shrink-0">
                <ArrowLeftRight size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium truncate">Total Filtered Volume</p>
                <p className="text-base sm:text-xl font-bold tabular-nums truncate text-[var(--color-transfer)]">
                  {formatCurrency(totalVolume)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-3.5 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-[var(--color-income-bg)] text-[var(--color-income)] flex items-center justify-center shrink-0">
                <CheckCircle2 size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium truncate">Total Transfer Records</p>
                <p className="text-base sm:text-xl font-bold tabular-nums truncate">
                  {filtered.length} active
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Universal Calendar Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 border rounded-xl bg-card">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 sm:max-w-[260px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 h-9 text-xs"
                placeholder="Search transfers…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
              />
            </div>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="h-9 w-[200px] text-xs">
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
          </div>

          <CalendarFilter value={dateFilter} onChange={setDateFilter} />
        </div>

        {/* Transfer List */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Transfer Log ({filtered.length})</h2>
          {filtered.length === 0 ? (
            <div className="text-center py-16 border rounded-xl bg-card">
              <ArrowLeftRight size={28} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold">No transfers found</p>
              <p className="text-xs text-muted-foreground mt-1">Adjust filters or record a new account transfer</p>
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
      </div>

      {/* Modals */}
      {viewTx && <TransactionDetailModal transaction={viewTx} onClose={() => setViewTx(null)} onEdit={() => { setEditTx(viewTx); setViewTx(null); }} onDelete={() => { setDeleteTx(viewTx); setViewTx(null); }} onDuplicate={() => { duplicateTransaction(viewTx); setViewTx(null); }} />}
      {(showAdd || editTx) && (
        <TransactionFormModal
          transaction={editTx}
          defaultType="transfer"
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
      {deleteTx && <DeleteConfirmDialog transaction={deleteTx} onConfirm={async () => { await deleteTransaction(deleteTx.id); setDeleteTx(null); }} onClose={() => setDeleteTx(null)} />}
    </AppLayout>
  );
}
