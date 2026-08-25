# 🎨 UI/UX Design System — Complete Analysis

> A 360-degree analysis of every visual and interaction aspect of the FinanceOS application.

---

## 1. Typography System

### 1.1 Font Families

| Font | Usage | Weight Range | Source |
|------|-------|-------------|--------|
| **Inter** | Primary sans-serif — all body text, labels, headings | 400, 500, 600, 700 | `@fontsource/inter` (self-hosted) |
| **Geist / Geist Mono** | Monospace — numeric values, code, audit logs | 100–900 | Google Fonts CDN |
| **Noto Serif** | Serif fallback — currently unused but available | 100–900 | Google Fonts CDN |
| **Fira Code** | Alternative monospace — loaded but secondary | 300–700 | Google Fonts CDN |
| **JetBrains Mono** | Alternative monospace — loaded but secondary | 100–800 | Google Fonts CDN |
| **Montserrat** | Alternative sans-serif — loaded but unused | 100–900 | Google Fonts CDN |

### 1.2 Font Features
```css
font-feature-settings: "cv11", "cv01", "cv02";  /* Inter stylistic alternates */
-webkit-font-smoothing: antialiased;              /* Smooth rendering (macOS/iOS) */
-moz-osx-font-smoothing: grayscale;               /* Smooth rendering (Firefox) */
```

### 1.3 Font Size Scale

| Context | Mobile | Desktop | Weight | Class |
|---------|--------|---------|--------|-------|
| Page title (h1) | `text-xl` (20px) | `text-2xl` (24px) | Bold (700) | `font-bold tracking-tight` |
| Card title | `text-base` (16px) | `text-base` (16px) | Semibold (600) | `font-semibold` |
| Body text | `text-xs` (12px) | `text-sm` (14px) | Normal (400) | — |
| Label (muted) | `text-[11px]` | `text-xs` (12px) | Medium (500) | `text-muted-foreground font-medium` |
| Micro label | `text-[10px]` | `text-[11px]` | Semibold (600) | `font-semibold` |
| Numeric values | `text-xs` (12px) | `text-sm`–`text-xl` | Bold (700) | `tabular-nums font-bold` |
| Status badge | `text-[10px]`–`text-[11px]` | Same | Semibold (600) | `font-semibold px-1.5 py-0.5 rounded-full` |
| Sidebar label | `text-sm` (14px) | Same | Medium (500) | `font-medium` |
| Bottom nav label | `text-[10px]` | — (hidden on desktop) | Semibold (600) | `font-semibold` |

### 1.4 Numeric Display
- All monetary values use `tabular-nums` class for proper alignment
- CSS: `font-variant-numeric: tabular-nums;`
- Prefix conventions: `+` for income, `−` (Unicode minus) for expense, none for transfer
- Currency format: `₹` Indian Rupee with `toLocaleString("en-IN")` formatting

---

## 2. Color System (OKLCH Color Space)

### 2.1 Light Mode Palette

| Token | OKLCH Value | Description | Approximate Hex |
|-------|-------------|-------------|----------------|
| `--background` | `oklch(0.98 0.003 240)` | Page background | `#f8f9fc` |
| `--foreground` | `oklch(0.14 0.01 240)` | Primary text | `#0f172a` |
| `--card` | `oklch(1 0 0)` | Card surface | `#ffffff` |
| `--primary` | `oklch(0.45 0.18 255)` | Brand accent (deep blue) | `#2563eb` |
| `--primary-foreground` | `oklch(0.99 0 0)` | Text on primary | `#ffffff` |
| `--secondary` | `oklch(0.95 0.008 240)` | Secondary surface | `#eef1f5` |
| `--muted` | `oklch(0.95 0.005 240)` | Muted surface | `#f1f3f5` |
| `--muted-foreground` | `oklch(0.52 0.01 240)` | Secondary text | `#64748b` |
| `--accent` | `oklch(0.95 0.008 255)` | Accent surface | `#eef2ff` |
| `--destructive` | `oklch(0.57 0.22 27)` | Error/danger | `#dc2626` |
| `--border` | `oklch(0.91 0.005 240)` | Borders | `#e2e8f0` |
| `--ring` | `oklch(0.45 0.18 255)` | Focus ring (matches primary) | `#2563eb` |

### 2.2 Dark Mode Palette

| Token | OKLCH Value | Description | Approximate Hex |
|-------|-------------|-------------|----------------|
| `--background` | `oklch(0.13 0.015 255)` | Page background | `#0a0e1a` |
| `--foreground` | `oklch(0.93 0.008 240)` | Primary text | `#e8ecf0` |
| `--card` | `oklch(0.18 0.018 255)` | Card surface | `#141828` |
| `--primary` | `oklch(0.6 0.2 255)` | Brand accent (brighter blue) | `#4f87f7` |
| `--secondary` | `oklch(0.22 0.018 255)` | Secondary surface | `#1c2238` |
| `--muted` | `oklch(0.22 0.015 255)` | Muted surface | `#1c2035` |
| `--muted-foreground` | `oklch(0.6 0.01 240)` | Secondary text | `#8690a6` |
| `--border` | `oklch(1 0 0 / 8%)` | Borders (translucent white) | `rgba(255,255,255,0.08)` |
| `--input` | `oklch(1 0 0 / 10%)` | Input borders | `rgba(255,255,255,0.10)` |
| `--destructive` | `oklch(0.65 0.22 27)` | Error (brightened for dark) | `#ef5350` |

### 2.3 Finance Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--income` | `oklch(0.52 0.18 155)` (Green) | `oklch(0.6 0.18 155)` | Income amounts, positive trends |
| `--income-bg` | `oklch(0.96 0.04 155)` | `oklch(0.22 0.06 155)` | Income badges, backgrounds |
| `--expense` | `oklch(0.55 0.22 27)` (Red) | `oklch(0.65 0.22 27)` | Expense amounts, negative trends |
| `--expense-bg` | `oklch(0.97 0.04 27)` | `oklch(0.22 0.06 27)` | Expense badges, backgrounds |
| `--transfer` | `oklch(0.52 0.15 255)` (Blue) | `oklch(0.6 0.18 255)` | Transfer amounts |
| `--transfer-bg` | `oklch(0.96 0.04 255)` | `oklch(0.22 0.06 255)` | Transfer badges |
| `--success` | Same as income | Same as income | Success states |
| `--warning` | `oklch(0.65 0.2 70)` (Amber) | `oklch(0.72 0.2 70)` | Budget warnings, pending |
| `--warning-bg` | `oklch(0.97 0.05 70)` | `oklch(0.22 0.06 70)` | Warning backgrounds |

### 2.4 Sidebar Colors

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar` | `oklch(0.14 0.025 255)` — Very dark blue | `oklch(0.1 0.018 255)` — Near black |
| `--sidebar-foreground` | `oklch(0.88 0.01 240)` — Light gray | `oklch(0.85 0.01 240)` |
| `--sidebar-primary` | `oklch(0.55 0.2 255)` — Bright blue | `oklch(0.6 0.2 255)` |
| `--sidebar-accent` | `oklch(0.22 0.025 255)` — Dark highlight | `oklch(0.18 0.02 255)` |
| `--sidebar-border` | `oklch(0.22 0.02 255)` | `oklch(1 0 0 / 8%)` |

### 2.5 Chart Colors (5-Color Palette)

| Token | Light | Dark | Typical Usage |
|-------|-------|------|---------------|
| `--chart-1` | `oklch(0.55 0.2 255)` | `oklch(0.6 0.22 255)` | Primary chart series |
| `--chart-2` | `oklch(0.65 0.18 160)` | `oklch(0.65 0.18 160)` | Secondary series |
| `--chart-3` | `oklch(0.7 0.18 55)` | `oklch(0.72 0.18 55)` | Tertiary series |
| `--chart-4` | `oklch(0.6 0.2 300)` | `oklch(0.62 0.2 300)` | Fourth series |
| `--chart-5` | `oklch(0.65 0.19 25)` | `oklch(0.68 0.2 25)` | Fifth series |

---

## 3. Spacing & Layout System

### 3.1 Border Radius Scale

| Token | Value | Computed |
|-------|-------|---------|
| `--radius` | `0.625rem` | 10px |
| `--radius-sm` | `calc(var(--radius) - 4px)` | 6px |
| `--radius-md` | `calc(var(--radius) - 2px)` | 8px |
| `--radius-lg` | `var(--radius)` | 10px |
| `--radius-xl` | `calc(var(--radius) + 4px)` | 14px |

### 3.2 Page Content Padding

| Context | Mobile | Desktop |
|---------|--------|---------|
| Main content area | `p-5` (20px) | `md:p-8` (32px) |
| Card content | `p-3` (12px) | `sm:p-4` (16px) |
| Summary cards | `p-2.5` (10px) | `sm:p-4` (16px) |

### 3.3 Grid Layouts

| Component | Mobile Grid | Desktop Grid |
|-----------|------------|--------------|
| Summary cards | `grid-cols-2` | `lg:grid-cols-4` |
| Charts row | `grid-cols-1` | `lg:grid-cols-5` (3+2) |
| Budget cards | `grid-cols-1` | `sm:grid-cols-2 lg:grid-cols-3` |
| Category cards | `grid-cols-2` | `sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` |
| Settings grid | `grid-cols-1` | `sm:grid-cols-2` |
| Filters row | `grid-cols-2` | `sm:flex sm:flex-wrap` |

### 3.4 Max Width Constraints

| Page | Max Width |
|------|-----------|
| Home / Dashboard | `max-w-[1400px]` |
| Analytics | `max-w-[1400px]` |
| Transactions, Income, Expenses, Transfers, Budget, Categories, Reports, Audit Logs | `max-w-[1200px]` |
| Profile | `max-w-[900px]` |
| Settings | `max-w-[780px]` |
| Notifications | `max-w-[700px]` |

---

## 4. Component Library (55 UI Components)

### 4.1 Radix-Based Shadcn/UI Components

The project uses **55 Radix UI primitive-based components** in `src/components/ui/`:

| Category | Components |
|----------|-----------|
| **Layout** | Card, Separator, Aspect Ratio, Resizable, Scroll Area |
| **Navigation** | Navigation Menu, Breadcrumb, Tabs, Pagination, Sidebar |
| **Forms** | Input, Textarea, Select, Checkbox, Radio Group, Switch, Slider, Label, Field, Input Group, Input OTP, Form |
| **Buttons** | Button, Button Group, Toggle, Toggle Group |
| **Feedback** | Alert, Badge, Progress, Spinner, Skeleton, Sonner (Toast), Tooltip |
| **Overlay** | Dialog, Drawer (Vaul), Sheet, Alert Dialog, Popover, Hover Card |
| **Data Display** | Table, Avatar, Calendar, Chart, Carousel, Kbd |
| **Menu** | Dropdown Menu, Context Menu, Menubar, Command |
| **Misc** | Accordion, Collapsible, Empty State, Error State, Item, Sign In |

### 4.2 Custom Application Components

| Component | File | Purpose |
|-----------|------|---------|
| `AppLayout` | `app-layout.tsx` | Main layout wrapper (sidebar + content + bottom nav) |
| `AppSidebar` | `app-sidebar.tsx` | Desktop sidebar with collapsible toggle |
| `BottomNav` | `bottom-nav.tsx` | Mobile bottom navigation bar |
| `ThemeToggle` | `theme-toggle.tsx` | Dark/Light mode toggle button |
| `PageHeader` | `page-header.tsx` | Reusable page title + subtitle + actions |
| `TransactionRow` | `transaction-row.tsx` | Transaction list item with actions dropdown |
| `TransactionSkeleton` | `transaction-skeleton.tsx` | Loading state placeholder |
| `TypeBadge` | `type-badge.tsx` | Income/Expense/Transfer type indicator |
| `DateLabel` | `date-label.tsx` | Formatted date display |
| `AmountDisplay` | `amount-display.tsx` | Formatted currency display |
| `BudgetProgress` | `budget-progress.tsx` | Budget progress bar |

---

## 5. Scrollbar Customization

```css
/* Custom thin scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { border-radius: 9999px; /* bg-border/80 */ }
::-webkit-scrollbar-thumb:hover { /* bg-muted-foreground/50 */ }

/* Hide scrollbar utility */
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
```

---

## 6. Accessibility Notes

- All interactive buttons have `cursor-pointer` explicitly set
- Focus rings: `outline-ring/50` applied globally
- Theme toggle has `aria-label="Toggle theme"`
- Sidebar items have `title` tooltip when collapsed
- Semantic HTML: `<aside>`, `<nav>`, `<main>`, `<h1>` used appropriately
- Keyboard navigation supported through Radix UI primitives
- Color contrast ratios maintained between foreground/background tokens
