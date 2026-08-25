import { cn } from "@/lib/utils.ts";
import { format, isToday, isYesterday } from "date-fns";

type Props = {
  dateStr: string;
  className?: string;
  showTime?: boolean;
  time?: string;
};

export default function DateLabel({ dateStr, className, showTime, time }: Props) {
  const date = new Date(dateStr);
  let label: string;
  if (isToday(date)) label = "Today";
  else if (isYesterday(date)) label = "Yesterday";
  else label = format(date, "dd MMM yyyy");

  return (
    <span className={cn("text-muted-foreground text-xs", className)}>
      {label}{showTime && time ? ` · ${time}` : ""}
    </span>
  );
}
