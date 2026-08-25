import { cn } from "@/lib/utils.ts";
import { formatCurrency } from "@/lib/mock-data.ts";
import type { TransactionType } from "@/lib/mock-data.ts";

type Props = {
  amount: number;
  type: TransactionType;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSign?: boolean;
};

const SIZE_CLASSES = {
  sm: "text-sm font-medium",
  md: "text-base font-semibold",
  lg: "text-xl font-bold",
  xl: "text-2xl font-bold",
};

export default function AmountDisplay({ amount, type, className, size = "md", showSign = true }: Props) {
  const prefix = showSign ? (type === "income" ? "+" : type === "expense" ? "−" : "") : "";
  return (
    <span
      className={cn(
        "tabular-nums",
        SIZE_CLASSES[size],
        type === "income" && "text-[var(--color-income)]",
        type === "expense" && "text-[var(--color-expense)]",
        type === "transfer" && "text-[var(--color-transfer)]",
        className
      )}
    >
      {prefix}{formatCurrency(amount)}
    </span>
  );
}
