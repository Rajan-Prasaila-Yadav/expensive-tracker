import { cn } from "@/lib/utils.ts";

type Props = {
  value: number; // 0–100
  color?: string;
  className?: string;
  height?: string;
};

export default function BudgetProgress({ value, color, className, height = "h-2" }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  const barColor =
    pct >= 100 ? "bg-[var(--color-expense)]" :
    pct >= 80 ? "bg-[var(--color-warning)]" :
    color ? "" : "bg-primary";

  return (
    <div className={cn("w-full bg-muted rounded-full overflow-hidden", height, className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", barColor)}
        style={{ width: `${pct}%`, backgroundColor: pct < 80 && color ? color : undefined }}
      />
    </div>
  );
}
