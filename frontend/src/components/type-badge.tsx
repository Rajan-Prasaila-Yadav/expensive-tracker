import { cn } from "@/lib/utils.ts";
import type { TransactionType } from "@/lib/mock-data.ts";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";

type Props = {
  type: TransactionType;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-11 h-11" };
const ICON_SIZES = { sm: 13, md: 16, lg: 20 };

export default function TypeBadge({ type, size = "md", className }: Props) {
  const Icon = type === "income" ? ArrowDownLeft : type === "expense" ? ArrowUpRight : ArrowLeftRight;
  return (
    <span
      className={cn(
        "rounded-full flex items-center justify-center shrink-0",
        SIZES[size],
        type === "income" && "bg-[var(--color-income-bg)] text-[var(--color-income)]",
        type === "expense" && "bg-[var(--color-expense-bg)] text-[var(--color-expense)]",
        type === "transfer" && "bg-[var(--color-transfer-bg)] text-[var(--color-transfer)]",
        className
      )}
    >
      <Icon size={ICON_SIZES[size]} strokeWidth={2.5} />
    </span>
  );
}
