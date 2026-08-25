import React, { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Calendar as CalendarIcon, Check, RotateCcw, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isWithinInterval,
  isBefore,
  addMonths,
  subMonths,
  getDaysInMonth,
  startOfMonth as getMonthStart,
  getDay,
} from "date-fns";
import { cn } from "@/lib/utils.ts";

export type DateFilterPreset = "all" | "today" | "yesterday" | "week" | "month" | "custom";

export interface CalendarFilterValue {
  preset: DateFilterPreset;
  singleDate?: Date;
  startDate?: Date;
  endDate?: Date;
  selectedDates?: Date[];
  label: string;
}

interface CalendarFilterProps {
  value: CalendarFilterValue;
  onChange: (value: CalendarFilterValue) => void;
  className?: string;
}

export default function CalendarFilter({ value, onChange, className }: CalendarFilterProps) {
  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"range" | "single" | "multiple">("range");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Draft states
  const [draftSingle, setDraftSingle] = useState<Date | undefined>(value.singleDate);
  const [draftStart, setDraftStart] = useState<Date | undefined>(value.startDate);
  const [draftEnd, setDraftEnd] = useState<Date | undefined>(value.endDate);
  const [draftMultiple, setDraftMultiple] = useState<Date[]>(value.selectedDates || []);

  const handleApplyPreset = (preset: DateFilterPreset) => {
    const today = new Date();
    if (preset === "all") {
      onChange({ preset: "all", label: "All Time" });
    } else if (preset === "today") {
      onChange({
        preset: "today",
        singleDate: today,
        startDate: today,
        endDate: today,
        label: `Today (${format(today, "MMM d")})`,
      });
    } else if (preset === "yesterday") {
      const yest = subDays(today, 1);
      onChange({
        preset: "yesterday",
        singleDate: yest,
        startDate: yest,
        endDate: yest,
        label: `Yesterday (${format(yest, "MMM d")})`,
      });
    } else if (preset === "week") {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = endOfWeek(today, { weekStartsOn: 1 });
      onChange({
        preset: "week",
        startDate: start,
        endDate: end,
        label: `This Week (${format(start, "MMM d")} - ${format(end, "MMM d")})`,
      });
    } else if (preset === "month") {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      onChange({
        preset: "month",
        startDate: start,
        endDate: end,
        label: `This Month (${format(today, "MMMM yyyy")})`,
      });
    }
  };

  const switchMode = (newMode: "range" | "single" | "multiple") => {
    setMode(newMode);
    if (newMode === "single") {
      setDraftStart(undefined);
      setDraftEnd(undefined);
      setDraftMultiple([]);
      if (!draftSingle) setDraftSingle(new Date());
    } else if (newMode === "multiple") {
      setDraftSingle(undefined);
      setDraftStart(undefined);
      setDraftEnd(undefined);
      if (draftMultiple.length === 0) setDraftMultiple([new Date()]);
    } else {
      setDraftSingle(undefined);
      setDraftMultiple([]);
      if (!draftStart) {
        setDraftStart(startOfMonth(new Date()));
        setDraftEnd(new Date());
      }
    }
  };

  const handleDayClick = (day: Date) => {
    if (mode === "single") {
      setDraftSingle(day);
    } else if (mode === "multiple") {
      setDraftMultiple((prev) => {
        const exists = prev.some((d) => isSameDay(d, day));
        if (exists) {
          const next = prev.filter((d) => !isSameDay(d, day));
          return next.length > 0 ? next : [day];
        }
        return [...prev, day];
      });
    } else {
      // Range mode
      if (!draftStart || (draftStart && draftEnd)) {
        setDraftStart(day);
        setDraftEnd(undefined);
      } else if (draftStart && !draftEnd) {
        if (isBefore(day, draftStart)) {
          setDraftEnd(draftStart);
          setDraftStart(day);
        } else {
          setDraftEnd(day);
        }
      }
    }
  };

  const handleApplyCustom = () => {
    if (mode === "single" && draftSingle) {
      onChange({
        preset: "custom",
        singleDate: draftSingle,
        startDate: draftSingle,
        endDate: draftSingle,
        selectedDates: undefined,
        label: `Day: ${format(draftSingle, "dd MMM yyyy")}`,
      });
    } else if (mode === "multiple" && draftMultiple.length > 0) {
      onChange({
        preset: "custom",
        selectedDates: draftMultiple,
        singleDate: undefined,
        startDate: undefined,
        endDate: undefined,
        label: `${draftMultiple.length} Selected Dates`,
      });
    } else if (mode === "range" && draftStart) {
      const end = draftEnd || draftStart;
      onChange({
        preset: "custom",
        startDate: draftStart,
        endDate: end,
        singleDate: undefined,
        selectedDates: undefined,
        label: `${format(draftStart, "dd MMM")} – ${format(end, "dd MMM yyyy")}`,
      });
    }
    setOpenModal(false);
  };

  // Build calendar month grid
  const daysInMonth = getDaysInMonth(currentMonth);
  const monthStart = getMonthStart(currentMonth);
  const startDayIndex = (getDay(monthStart) + 6) % 7; // Monday start
  const daysArray: (Date | null)[] = [];

  for (let i = 0; i < startDayIndex; i++) daysArray.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
  }

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {/* Quick Presets */}
      <div className="inline-flex rounded-lg p-0.5 bg-muted/60 border border-border/80 text-xs">
        {(["all", "today", "yesterday", "week", "month"] as DateFilterPreset[]).map((p) => {
          const isActive = value.preset === p;
          const labels: Record<DateFilterPreset, string> = {
            all: "All",
            today: "Today",
            yesterday: "Yesterday",
            week: "7 Days",
            month: "This Month",
            custom: "Custom",
          };
          return (
            <button
              key={p}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer capitalize text-[11px]",
                isActive
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {labels[p]}
            </button>
          );
        })}
      </div>

      {/* Custom Picker Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpenModal(true)}
        className={cn(
          "gap-1.5 text-xs h-8 cursor-pointer border-border/80",
          value.preset === "custom" && "border-primary text-primary font-semibold bg-primary/5"
        )}
      >
        <CalendarIcon size={13} />
        <span className="truncate max-w-[170px]">{value.preset === "custom" ? value.label : "Date Filter"}</span>
      </Button>

      {/* Active Filter Clear Icon */}
      {value.preset !== "all" && (
        <button
          type="button"
          onClick={() => handleApplyPreset("all")}
          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-full hover:bg-muted"
          title="Reset date filter"
        >
          <X size={13} />
        </button>
      )}

      {/* Interactive Calendar Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-[420px] p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CalendarIcon size={16} className="text-primary" /> Select Dates & Range
            </DialogTitle>
          </DialogHeader>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg text-xs font-medium my-2">
            <button
              type="button"
              onClick={() => switchMode("range")}
              className={cn(
                "py-1.5 rounded-md text-center transition-all cursor-pointer",
                mode === "range" ? "bg-background shadow-xs font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              Date Range (From-To)
            </button>
            <button
              type="button"
              onClick={() => switchMode("single")}
              className={cn(
                "py-1.5 rounded-md text-center transition-all cursor-pointer",
                mode === "single" ? "bg-background shadow-xs font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              Single Date
            </button>
            <button
              type="button"
              onClick={() => switchMode("multiple")}
              className={cn(
                "py-1.5 rounded-md text-center transition-all cursor-pointer",
                mode === "multiple" ? "bg-background shadow-xs font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              Multiple Dates
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="font-bold text-sm">{format(currentMonth, "MMMM yyyy")}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted-foreground pt-2">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Date Matrix */}
          <div className="grid grid-cols-7 gap-1 pt-1 pb-3">
            {daysArray.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="h-9" />;

              const isStart = mode === "range" && draftStart && isSameDay(day, draftStart);
              const isEnd = mode === "range" && draftEnd && isSameDay(day, draftEnd);
              const isInRange =
                mode === "range" &&
                draftStart &&
                draftEnd &&
                isWithinInterval(day, { start: draftStart, end: draftEnd });

              const isSingleSelected = mode === "single" && draftSingle && isSameDay(day, draftSingle);
              const isMultiSelected =
                mode === "multiple" && draftMultiple.some((d) => isSameDay(d, day));

              const isSelected = isStart || isEnd || isSingleSelected || isMultiSelected;
              const isTodayDate = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "h-9 rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer relative",
                    isInRange && !isSelected && "bg-primary/15 text-primary rounded-none",
                    isSelected && "bg-primary text-primary-foreground font-bold shadow-xs scale-105 z-10",
                    !isSelected && !isInRange && "hover:bg-muted text-foreground",
                    isTodayDate && !isSelected && "border border-primary font-bold text-primary"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Selection Hint */}
          <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
            {mode === "range" && (
              <span>
                {draftStart && draftEnd
                  ? `Selected Range: ${format(draftStart, "dd MMM")} to ${format(draftEnd, "dd MMM yyyy")}`
                  : draftStart
                  ? `Start Date: ${format(draftStart, "dd MMM yyyy")} (Now click end date)`
                  : "Click a date to start the range selection."}
              </span>
            )}
            {mode === "single" && (
              <span>{draftSingle ? `Selected Single Day: ${format(draftSingle, "dd MMMM yyyy")}` : "Click any single day to filter."}</span>
            )}
            {mode === "multiple" && (
              <span>
                {draftMultiple.length > 0
                  ? `${draftMultiple.length} dates selected (${draftMultiple.map((d) => format(d, "MMM d")).slice(0, 3).join(", ")}${draftMultiple.length > 3 ? "..." : ""})`
                  : "Click multiple individual days to select."}
              </span>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraftStart(undefined);
                setDraftEnd(undefined);
                setDraftSingle(undefined);
                setDraftMultiple([]);
              }}
              className="text-xs gap-1"
            >
              <RotateCcw size={12} /> Clear
            </Button>
            <Button size="sm" onClick={handleApplyCustom} className="text-xs gap-1">
              <Check size={13} /> Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Universal helper to check if transaction date passes the CalendarFilter
 */
export function matchesCalendarFilter(
  dateStr: string,
  filter: CalendarFilterValue
): boolean {
  if (filter.preset === "all") return true;

  const date = new Date(dateStr);

  // 1. Multiple Dates Check
  if (filter.selectedDates && filter.selectedDates.length > 0) {
    return filter.selectedDates.some((d) => isSameDay(d, date));
  }

  // 2. Single Day Check
  if (filter.singleDate && !filter.endDate) {
    return isSameDay(filter.singleDate, date);
  }

  // 3. Date Range Check
  if (filter.startDate && filter.endDate) {
    const s = new Date(filter.startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(filter.endDate);
    e.setHours(23, 59, 59, 999);
    return date >= s && date <= e;
  }

  return true;
}
