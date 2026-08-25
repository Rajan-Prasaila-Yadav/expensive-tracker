# 🔍 Filters, Search, Sorting, Dropdowns & Calendar Pickers — Complete Analysis

> Every filtering, searching, sorting, dropdown, and date-picking mechanism across all pages.

---

## 1. Search Implementation

### 1.1 Debounced Search (Transactions, Transfers, Audit Logs)

```typescript
// Hook: src/hooks/use-debounce.ts
const [rawSearch, setRawSearch] = useState("");
const [search] = useDebounce(rawSearch, 300);  // 300ms debounce
```

**Search UI Pattern:**
```tsx
<div className="relative">
  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
  <Input className="pl-8 h-9 text-xs sm:text-sm" placeholder="Search (2+ chars)…" />
  {rawSearch && (
    <button onClick={() => setRawSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
      <X size={13} />
    </button>
  )}
</div>
```

### 1.2 Search by Page

| Page | Minimum Chars | Fields Searched | Debounce |
|------|--------------|-----------------|----------|
| **Transactions** | 2 chars | `title`, `category.name` | 300ms |
| **Transfers** | 2 chars | `title`, `notes` | 300ms |
| **Audit Logs** | 2 chars | `action`, `entity`, `ip` | 350ms |

---

## 2. Filter Dropdowns (Select Components)

All filter dropdowns use Radix UI `Select` with consistent styling:

```tsx
<Select value={filterValue} onValueChange={setFilterValue}>
  <SelectTrigger className="h-9 w-full sm:w-[130px] text-xs sm:text-sm">
    <SelectValue placeholder="Category" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All categories</SelectItem>
    {CATEGORIES.map(c => (
      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 2.1 Filters by Page

#### Transactions Page (5 Filters + Search)

| Filter | Type | Options | Width |
|--------|------|---------|-------|
| Search | Text input (debounced) | Free text | `max-w-[260px]` |
| Date | Select dropdown | All dates, Today, Yesterday, This week, This month, Custom range | `w-[130px]` |
| Category | Select dropdown | All categories + each category with emoji | `w-[130px]` |
| Payment Method | Select dropdown | All methods + each method with emoji | `w-[130px]` |
| Status | Select dropdown | All status, Completed, Pending, Failed | `w-[110px]` |
| **Clear button** | Ghost button | Shows count of active filters | Auto |

#### Transfers Page (4 Filters + Search)

| Filter | Type | Options | Width |
|--------|------|---------|-------|
| Search | Text input (debounced) | Free text | `max-w-[260px]` |
| Date | Select dropdown | All Dates, Today, Yesterday, This Week, This Month, Custom Range | `w-[130px]` |
| Account/Method | Select dropdown | All Accounts + payment methods | `w-[140px]` |
| Status | Select dropdown | All Status, Completed, Pending, Failed | `w-[110px]` |

#### Income Page (1 Filter)

| Filter | Type | Options |
|--------|------|---------|
| Source | Select dropdown | All sources + each income source with emoji |

#### Expenses Page (1 Filter)

| Filter | Type | Options |
|--------|------|---------|
| Category | Select dropdown | All categories (expense type only) |

#### Reports Page (5 Filters)

| Filter | Type | Options |
|--------|------|---------|
| Date Range | Two date inputs | Start date + End date |
| Type | Select dropdown | All types, Income, Expense, Transfer |
| Category | Select dropdown | All categories |
| Method | Select dropdown | All methods |
| Status | Select dropdown | All statuses |

#### Budget Page (1 Filter)

| Filter | Type | Options |
|--------|------|---------|
| Period | Pill buttons | All Periods, Monthly, Weekly, Yearly |

#### Categories Page (1 Filter per tab)

| Filter | Type | Options |
|--------|------|---------|
| Category Type | Pill buttons | All, Income, Expense, Transfer |

#### Audit Logs Page (2 Filters)

| Filter | Type | Options |
|--------|------|---------|
| Search | Text input (debounced) | Free text |
| Result | Select + Clickable cards | All results, Success, Failure, Warning |

#### Analytics Page (2 Controls)

| Filter | Type | Options |
|--------|------|---------|
| Period | Segmented control (pills) | 1W, 1M, 3M, 6M, 9M, 1Y |
| Chart Type | Segmented control (pills) | Area, Bar, Line |

---

## 3. Sorting Mechanisms

### 3.1 Transactions Page — Sort Bar

```tsx
<div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
  <span>Sort:</span>
  {(["date", "amount", "title"] as SortField[]).map(f => (
    <button onClick={() => toggleSort(f)} className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-md capitalize",
      sortField === f ? "bg-muted text-foreground font-medium" : "hover:bg-muted/60"
    )}>
      {f} <SortIcon field={f} />
    </button>
  ))}
</div>
```

**Sort Fields:** Date, Amount, Title  
**Sort Directions:** Ascending ↑, Descending ↓  
**Icons:** `ArrowUpDown` (neutral), `ArrowUp` (asc), `ArrowDown` (desc)

### 3.2 Transfers Page — Sort Controls

```tsx
<div className="flex items-center gap-1 text-xs text-muted-foreground">
  <span>Sort by:</span>
  <button>Date {sortDir === "asc" ? "↑" : "↓"}</button>
  <button>Amount {sortDir === "asc" ? "↑" : "↓"}</button>
</div>
```

**Sort Fields:** Date, Amount  
**Uses Unicode arrows:** ↑ ↓

### 3.3 Reports Page — Table Column Sort

```tsx
<th onClick={() => field && toggleSort(field)} className="cursor-pointer">
  <span className="flex items-center gap-1">
    {label} {field && <ArrowUpDown size={11} />}
  </span>
</th>
```

**Sortable Columns:** Date, Title, Amount  
**Non-Sortable Columns:** Type, Category, Method, Status

### 3.4 Sort Logic (Shared Pattern)

```typescript
const toggleSort = (field: SortField) => {
  if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
  else { setSortField(field); setSortDir("desc"); }
};

txs.sort((a, b) => {
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
```

---

## 4. Date Filtering System

### 4.1 Preset Date Filters

```typescript
type DateFilter = "all" | "today" | "yesterday" | "week" | "month" | "custom";
```

| Preset | Date Range Logic |
|--------|-----------------|
| `all` | No date filtering |
| `today` | `startOfDay(now)` to `endOfDay(now)` |
| `yesterday` | `startOfDay(subDays(now,1))` to `endOfDay(subDays(now,1))` |
| `week` | `startOfWeek(now)` to `endOfWeek(now)` |
| `month` | `startOfMonth(now)` to `endOfMonth(now)` |
| `custom` | User-defined start and end dates |

All use `date-fns` functions: `isWithinInterval`, `parseISO`, `startOfDay`, `endOfDay`, etc.

### 4.2 Custom Date Range Picker

```tsx
<AnimatePresence>
  {showCustomRange && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
        <CalendarRange size={15} className="text-muted-foreground" />
        <Label>From</Label>
        <Input type="date" value={customStart} onChange={...} className="h-8 w-[140px]" />
        <Label>To</Label>
        <Input type="date" value={customEnd} onChange={...} className="h-8 w-[140px]" />
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

**Features:**
- Animated expand/collapse with `AnimatePresence`
- Native browser `<input type="date">` picker
- Calendar icon visual indicator
- Default range: current month start to end

### 4.3 Reports Page Date Picker

```tsx
<div className="flex items-center gap-1.5">
  <Calendar size={14} className="text-muted-foreground" />
  <Input type="date" value={startDate} className="h-9 flex-1 sm:w-[130px]" />
  <span className="text-muted-foreground text-xs">–</span>
  <Input type="date" value={endDate} className="h-9 flex-1 sm:w-[130px]" />
</div>
```

Always visible (not collapsible), defaults to current month.

---

## 5. Tab-Based Filtering

### 5.1 Transactions Page Tabs
```tsx
<Tabs value={tab} onValueChange={(v) => setTab(v)}>
  <TabsList>
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="income">Income</TabsTrigger>
    <TabsTrigger value="expense">Expenses</TabsTrigger>
    <TabsTrigger value="transfer">Transfers</TabsTrigger>
  </TabsList>
</Tabs>
```

### 5.2 Categories Page Tabs (3 Entity Types)
```tsx
<Tabs value={tab} onValueChange={(v) => setTab(v)}>
  <TabsList className="grid grid-cols-3">
    <TabsTrigger value="categories"><Tag /> Categories</TabsTrigger>
    <TabsTrigger value="sources"><TrendingUp /> Sources</TabsTrigger>
    <TabsTrigger value="methods"><Wallet /> Methods</TabsTrigger>
  </TabsList>
</Tabs>
```

### 5.3 Settings Page Tabs (4 Sections)
```tsx
<Tabs defaultValue="general">
  <TabsList className="grid grid-cols-4">
    <TabsTrigger value="general"><Globe /> General</TabsTrigger>
    <TabsTrigger value="notifications"><Bell /> Alerts</TabsTrigger>
    <TabsTrigger value="appearance"><Palette /> Theme</TabsTrigger>
    <TabsTrigger value="security"><Lock /> Security</TabsTrigger>
  </TabsList>
</Tabs>
```

---

## 6. Pill-Button Filters (Custom Toggle Buttons)

### 6.1 Budget Period Filter
```tsx
{(["all", "monthly", "weekly", "yearly"]).map(p => (
  <button
    onClick={() => setPeriodFilter(p)}
    className={cn(
      "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors capitalize cursor-pointer",
      periodFilter === p
        ? "bg-primary text-primary-foreground border-primary"
        : "border-border text-muted-foreground hover:border-primary/40"
    )}
  />
))}
```

### 6.2 Category Type Filter
Same pill-button pattern: All, Income, Expense, Transfer

### 6.3 Analytics Period Selector
```tsx
<div className="flex gap-1 bg-muted p-1 rounded-lg">
  {(["1w", "1m", "3m", "6m", "9m", "1y"]).map(p => (
    <button className={cn(
      "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
      period === p ? "bg-background shadow text-foreground" : "text-muted-foreground"
    )} />
  ))}
</div>
```

### 6.4 Analytics Chart Type Selector
Same segmented control: Area, Bar, Line

---

## 7. Action Dropdowns (Context Menus)

### 7.1 Transaction Row Actions

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 sm:opacity-0 group-hover:opacity-100">
      <MoreHorizontal size={15} />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-40">
    <DropdownMenuItem><Eye /> View</DropdownMenuItem>
    <DropdownMenuItem><Pencil /> Edit</DropdownMenuItem>
    <DropdownMenuItem><Copy /> Duplicate</DropdownMenuItem>
    <DropdownMenuItem className="text-destructive"><Trash2 /> Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Features:**
- Aligned to end of row
- Fixed width `w-40` (160px)
- Destructive action in red
- Click propagation stopped with `e.stopPropagation()`

---

## 8. Active Filter Count & Clear

### Transactions Page
```tsx
const activeFilters = [
  categoryFilter !== "all",
  methodFilter !== "all",
  statusFilter !== "all",
  dateFilter !== "all"
].filter(Boolean).length;

{activeFilters > 0 && (
  <Button variant="ghost" onClick={clearFilters}>
    <X size={13} /> Clear ({activeFilters})
  </Button>
)}
```

### Transfers Page
```tsx
const hasActiveFilters = rawSearch !== "" || dateFilter !== "all" || methodFilter !== "all" || statusFilter !== "all";

{hasActiveFilters && (
  <Button variant="ghost" onClick={clearFilters}>
    <X size={13} /> Clear
  </Button>
)}
```

---

## 9. Calendar Component (Available but Not Used in Picker Mode)

The project has a full `Calendar` component (`src/components/ui/calendar.tsx`) based on `react-day-picker` v10, but the actual date filtering uses native HTML `<input type="date">` elements instead. The Calendar component is available for future implementation of a richer calendar picker UI.

---

## 10. Empty States

Every filtered/searchable list has a dedicated empty state:

| Page | Empty State Content |
|------|-------------------|
| Transactions | Icon + "No transactions found" + "Try adjusting your filters" + "Add Transaction" button |
| Income | `TrendingUp` icon + "No income transactions found" + "Add Income" button |
| Expenses | `TrendingDown` icon + "No expense transactions found" + "Add Expense" button |
| Transfers | Circular icon badge + "No transfers found" + Dynamic message (filters vs. first transfer) |
| Audit Logs | `Shield` icon + "No audit logs match your filters" + "Clear filters" button |
| Notifications | `Bell` icon + "No notifications" + "You're all caught up!" |
| Reports | "No records match the selected filters" |
| Budget | (uses add-card as empty state prompt) |
