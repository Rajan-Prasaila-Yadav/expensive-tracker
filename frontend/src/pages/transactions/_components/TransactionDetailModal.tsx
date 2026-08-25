import type { Transaction } from "@/lib/mock-data.ts";
import { formatCurrency } from "@/lib/mock-data.ts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import TypeBadge from "@/components/type-badge.tsx";
import {
  Pencil, Calendar, Tag, CreditCard, FileText, Briefcase,
  CheckCircle, Clock, XCircle, Trash2, Copy, ArrowRightLeft,
  Hash, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import { IconOrLogoDisplay } from "@/pages/categories/page.tsx";

type Props = {
  transaction: Transaction;
  onClose: () => void;
  onEdit?: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
  onDuplicate?: (t: Transaction) => void;
};

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, color: "text-[var(--color-income)]", bg: "bg-[var(--color-income-bg)]", label: "Completed" },
  pending: { icon: Clock, color: "text-[var(--color-warning)]", bg: "bg-[var(--color-warning-bg)]", label: "Pending" },
  failed: { icon: XCircle, color: "text-[var(--color-expense)]", bg: "bg-[var(--color-expense-bg)]", label: "Failed" },
};

export default function TransactionDetailModal({
  transaction: t,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
  const { categories, paymentMethods, incomeSources } = useTransactions();

  const category = categories.find((c) => c.id === t.categoryId);
  const method = paymentMethods.find((p) => p.id === t.paymentMethodId);
  const source = incomeSources.find((s) => s.id === t.sourceId || s.id === t.categoryId) || category;

  const toMethodId = t.tags?.find((tag) => tag.startsWith("to:"))?.replace("to:", "");
  const toMethod = toMethodId ? paymentMethods.find((p) => p.id === toMethodId) : undefined;

  const prefix = t.type === "income" ? "+" : t.type === "expense" ? "−" : "";

  let formattedDate = t.date;
  try {
    formattedDate = format(parseISO(t.date), "EEEE, d MMMM yyyy");
  } catch {
    formattedDate = t.date;
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[460px] p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {t.type === "income" ? "Income Details" : t.type === "transfer" ? "Transfer Details" : "Expense Details"}
          </DialogTitle>
        </DialogHeader>

        {/* Amount Hero Section */}
        <div className="flex flex-col items-center py-4 gap-2">
          <TypeBadge type={t.type} size="lg" />
          <p
            className={`text-3xl font-extrabold tracking-tight tabular-nums ${
              t.type === "income" ? "text-[var(--color-income)]" :
              t.type === "expense" ? "text-[var(--color-expense)]" : "text-primary"
            }`}
          >
            {prefix}{formatCurrency(t.amount)}
          </p>
          <p className="text-base font-semibold text-center leading-snug">{t.title}</p>
        </div>

        {/* Dynamic Details List Tailored to Transaction Type */}
        <div className="space-y-3.5 border-t pt-4 text-sm">
          {/* Date & Time */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <Calendar size={14} /> Date & Time
            </span>
            <div className="text-right">
              <p className="font-medium text-xs sm:text-sm">{formattedDate}</p>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{t.time || "00:00"}</p>
            </div>
          </div>

          {/* 1. EXPENSE SPECIFIC FIELDS */}
          {t.type === "expense" && (
            <>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Tag size={14} /> Expense Category
                </span>
                <div className="flex items-center gap-2">
                  {category ? (
                    <>
                      <IconOrLogoDisplay icon={category.icon} className="w-4 h-4 text-sm inline-block" />
                      <span className="font-semibold text-xs sm:text-sm">{category.name}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs">General Expense</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <CreditCard size={14} /> Paid From Account
                </span>
                <div className="flex items-center gap-2">
                  {method ? (
                    <>
                      <IconOrLogoDisplay icon={method.icon} className="w-4 h-4 text-sm inline-block" />
                      <span className="font-semibold text-xs sm:text-sm">
                        {method.name} {method.last4 ? `(••${method.last4})` : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs">Default Account</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 2. INCOME SPECIFIC FIELDS */}
          {t.type === "income" && (
            <>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Briefcase size={14} /> Income Stream / Source
                </span>
                <div className="flex items-center gap-2">
                  {source ? (
                    <>
                      <IconOrLogoDisplay icon={source.icon} className="w-4 h-4 text-sm inline-block" />
                      <span className="font-semibold text-xs sm:text-sm">{source.name}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs">Direct Income</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <ArrowDownLeft size={14} className="text-[var(--color-income)]" /> Deposited Into Account
                </span>
                <div className="flex items-center gap-2">
                  {method ? (
                    <>
                      <IconOrLogoDisplay icon={method.icon} className="w-4 h-4 text-sm inline-block" />
                      <span className="font-semibold text-xs sm:text-sm">
                        {method.name} {method.last4 ? `(••${method.last4})` : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs">Default Account</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 3. TRANSFER SPECIFIC FIELDS */}
          {t.type === "transfer" && (
            <>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <ArrowUpRight size={14} className="text-[var(--color-expense)]" /> Transferred From
                </span>
                <div className="flex items-center gap-2">
                  {method ? (
                    <>
                      <IconOrLogoDisplay icon={method.icon} className="w-4 h-4 text-sm inline-block" />
                      <span className="font-semibold text-xs sm:text-sm">
                        {method.name} {method.last4 ? `(••${method.last4})` : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs">Primary Account</span>
                  )}
                </div>
              </div>

              {toMethod && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground text-xs">
                    <ArrowDownLeft size={14} className="text-[var(--color-income)]" /> Transferred To
                  </span>
                  <div className="flex items-center gap-2">
                    <IconOrLogoDisplay icon={toMethod.icon} className="w-4 h-4 text-sm inline-block" />
                    <span className="font-semibold text-xs sm:text-sm">
                      {toMethod.name} {toMethod.last4 ? `(••${toMethod.last4})` : ""}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tags */}
          {t.tags && t.tags.filter((tag) => !tag.startsWith("to:")).length > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground text-xs">
                <Hash size={14} /> Tags
              </span>
              <div className="flex flex-wrap gap-1 justify-end max-w-[240px]">
                {t.tags.filter((tag) => !tag.startsWith("to:")).map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-muted font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {t.notes && (
            <div className="flex items-start justify-between gap-4 pt-1">
              <span className="flex items-center gap-2 text-muted-foreground text-xs shrink-0">
                <FileText size={14} /> Notes
              </span>
              <p className="text-xs text-right font-normal bg-muted/40 p-2 rounded-lg max-w-[250px] break-words text-foreground">
                {t.notes}
              </p>
            </div>
          )}
        </div>

        {/* CRUD Action Buttons */}
        <div className="flex items-center justify-between border-t pt-4 mt-3">
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs cursor-pointer"
              onClick={() => {
                onDelete(t);
                onClose();
              }}
            >
              <Trash2 size={13} /> Delete
            </Button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onDuplicate && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs cursor-pointer"
                onClick={() => {
                  onDuplicate(t);
                  onClose();
                }}
              >
                <Copy size={13} /> Duplicate
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                className="gap-1.5 text-xs cursor-pointer"
                onClick={() => {
                  onEdit(t);
                  onClose();
                }}
              >
                <Pencil size={13} /> Edit
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
