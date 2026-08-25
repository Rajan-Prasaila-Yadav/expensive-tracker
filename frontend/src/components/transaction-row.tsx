import type { Transaction } from "@/lib/mock-data.ts";
import { formatCurrency } from "@/lib/mock-data.ts";
import TypeBadge from "./type-badge.tsx";
import DateLabel from "./date-label.tsx";
import { cn } from "@/lib/utils.ts";
import { MoreHorizontal, Eye, Pencil, Trash2, Copy } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import { IconOrLogoDisplay } from "@/pages/categories/page.tsx";

type Props = {
  transaction: Transaction;
  onView?: (t: Transaction) => void;
  onEdit?: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
  onDuplicate?: (t: Transaction) => void;
  className?: string;
};

export default function TransactionRow({ transaction: t, onView, onEdit, onDelete, onDuplicate, className }: Props) {
  const { categories, paymentMethods, incomeSources } = useTransactions();

  const category = categories.find((c) => c.id === t.categoryId);
  const method = paymentMethods.find((p) => p.id === t.paymentMethodId);
  const source = incomeSources.find((s) => s.id === t.sourceId || s.id === t.categoryId) || category;

  const toMethodId = t.tags?.find((tag) => tag.startsWith("to:"))?.replace("to:", "");
  const toMethod = toMethodId ? paymentMethods.find((p) => p.id === toMethodId) : undefined;

  const prefix = t.type === "income" ? "+" : t.type === "expense" ? "−" : "";

  // Dynamic context label tailored to transaction type
  const subtitle =
    t.type === "income"
      ? (source?.name || "Income")
      : t.type === "transfer"
      ? (toMethod ? `Transfer → ${toMethod.name}` : "Account Transfer")
      : (category?.name || "Expense");

  const subtitleIcon =
    t.type === "income"
      ? (source?.icon || "💰")
      : t.type === "transfer"
      ? "🔄"
      : (category?.icon || "📁");

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/60 transition-all duration-200 cursor-pointer group rounded-xl border border-transparent hover:border-border/60 hover:shadow-xs active:scale-[0.995]",
        className
      )}
      onClick={() => onView?.(t)}
    >
      <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        <TypeBadge type={t.type} size="md" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs sm:text-sm font-semibold truncate">{t.title}</p>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[11px] sm:text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 truncate max-w-[120px] sm:max-w-none font-medium">
            <IconOrLogoDisplay icon={subtitleIcon} className="w-3.5 h-3.5 text-xs shrink-0" />
            <span className="truncate">{subtitle}</span>
          </span>
          <span className="text-muted-foreground/40">·</span>
          <DateLabel dateStr={t.date} showTime time={t.time} />
        </div>
      </div>

      {/* Method / Account */}
      <span className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0 max-w-[140px] truncate">
        {method && <IconOrLogoDisplay icon={method.icon} className="w-3 h-3 shrink-0" />}
        <span className="truncate">{method?.name || "Default Account"}</span>
      </span>

      {/* Amount */}
      <span
        className={cn(
          "tabular-nums text-xs sm:text-sm font-bold shrink-0 text-right",
          t.type === "income" && "text-[var(--color-income)]",
          t.type === "expense" && "text-[var(--color-expense)]",
          t.type === "transfer" && "text-[var(--color-transfer)]",
        )}
      >
        {prefix}{formatCurrency(t.amount)}
      </span>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 opacity-50 sm:opacity-0 group-hover:opacity-100 shrink-0 transition-opacity duration-200 cursor-pointer"
          >
            <MoreHorizontal size={15} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(t); }}>
            <Eye size={14} className="mr-2" /> View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(t); }}>
            <Pencil size={14} className="mr-2" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate ? onDuplicate(t) : toast.success("Duplicated"); }}>
            <Copy size={14} className="mr-2" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete?.(t); }}
          >
            <Trash2 size={14} className="mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
