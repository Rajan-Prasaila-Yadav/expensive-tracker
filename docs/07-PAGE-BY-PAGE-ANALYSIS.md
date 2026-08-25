# 📄 Page-by-Page Analysis — Complete Breakdown

> Detailed analysis of every single page in the application.

---

## 1. Home / Dashboard (`/`)

### Purpose
Financial overview dashboard — the landing page after login.

### Layout Structure
```
┌─────────────────────────────────────────────┐
│  Date  |  Hello, {name} 👋  | 🌙 🔔 + Add  │  ← Header
├─────────────────────────────────────────────┤
│  Balance  │  Income  │  Expense  │  Budget%  │  ← 4 Summary Cards
├─────────────────────────────────────────────┤
│  Income vs Expenses Chart (3/5)  │ Donut(2/5)│  ← Charts Row
├─────────────────────────────────────────────┤
│  Budget Progress (2/5)  │  Recent Txns (3/5) │  ← Bottom Row
└─────────────────────────────────────────────┘
```

### Key Features
- **Summary Cards (4):** Total Balance, Total Income, Total Expenses, Budget Used %
- **Income vs Expenses Area Chart:** 6-month trend with gradient fills
- **Expense by Category Donut Chart:** Pie chart with top 5 category breakdown
- **Budget Progress:** Top 5 budgets with colored progress bars
- **Recent Transactions:** Last 8 transactions with view/edit/delete
- **Add Transaction:** Opens modal form
- **Trend indicators:** "+12.5% vs last month" type labels

### Data Sources
- `calcSummary(thisMonthTxs)` — Current month aggregation
- `getMonthlyData(6)` — 6-month history
- `getCategoryExpenseData()` — Category breakdown
- `BUDGETS` — Budget progress data

### Modals
- `TransactionDetailModal` — View transaction details
- `TransactionFormModal` — Add/edit transaction

---

## 2. Transactions (`/transactions`)

### Purpose
Complete transaction management hub with full CRUD and advanced filtering.

### Layout Structure
```
┌─────────────────────────────────────────────┐
│  Transactions  |  15 of 25 txns  | + Add    │  ← Header
├─────────────────────────────────────────────┤
│  Income KPI  │  Expenses KPI  │  Net KPI    │  ← 3 Summary Cards
├─────────────────────────────────────────────┤
│  🔍 Search | Date▼ | Category▼ | Method▼..  │  ← Filters Row
├─────────────────────────────────────────────┤
│  [Custom date range picker - conditional]    │  ← Animated expand
├─────────────────────────────────────────────┤
│  All | Income | Expenses | Transfers        │  ← Tabs
├─────────────────────────────────────────────┤
│  Sort: date↓ | amount | title               │  ← Sort Bar
├─────────────────────────────────────────────┤
│  Transaction List                            │  ← Card with rows
│  ├── Row 1 (type badge | title | category | method | amount | status | ⋯)
│  ├── Row 2 ...
│  └── Row N ...
├─────────────────────────────────────────────┤
│  Showing 15 transactions                     │  ← Footer count
└─────────────────────────────────────────────┘
```

### Key Features
- **5 filter dropdowns** + debounced search
- **Custom date range** with animated expand/collapse
- **Tab-based type filter** (All, Income, Expenses, Transfers)
- **3-way sort** (Date, Amount, Title) with direction toggle
- **Transaction row actions** (View, Edit, Duplicate, Delete via dropdown)
- **Active filter count** with clear all button
- **Empty state** with add button

### Modals
- `TransactionDetailModal` — View with edit option
- `TransactionFormModal` — Add/edit with all fields
- `DeleteConfirmDialog` — Confirmation before delete

---

## 3. Income (`/income`)

### Purpose
Income-focused view with source breakdown and monthly trends.

### Key Features
- **3 Summary Cards:** Total Income, This Month, Active Sources
- **Monthly Income Bar Chart** (6 months)
- **Income by Source** card with source icons, types, and totals
- **Source filter** dropdown
- **Transaction count** display
- **Full CRUD** via shared modals (default type: "income")

---

## 4. Expenses (`/expenses`)

### Purpose
Expense tracking with category breakdown and spending analysis.

### Key Features
- **3 Summary Cards:** Total Expenses, This Month, Avg per Transaction
- **Monthly Expenses Bar Chart** (6 months)
- **Top Categories** with progress bars and percentage
- **Category filter** dropdown (expense categories only)
- **Full CRUD** via shared modals (default type: "expense")

---

## 5. Transfers (`/transfers`)

### Purpose
Account transfer management with method overview.

### Key Features
- **4 Summary Cards:** Total Transferred, Completed, Pending/In-Transit, Average Transfer
- **Transfer Methods Overview:** Top 3 payment methods with volume
- **Full filter card:** Search, Date, Method, Status filters in a card container
- **Custom date range** with animated expand
- **Sort controls:** Date and Amount with arrow indicators
- **Transfer-themed styling:** Uses transfer-blue accent color
- **Full CRUD** via shared modals (default type: "transfer")

---

## 6. Budget (`/budget`)

### Purpose
Budget creation, monitoring, and progress tracking.

### Key Features
- **4 Summary Cards:** Total Budget, Total Spent, Remaining, Over Budget count
- **Overall Budget Progress Bar** with percentage and color-coded status
- **Period filter pills:** All, Monthly, Weekly, Yearly
- **Budget cards grid** (responsive: 1→2→3 columns)
  - Category icon with colored background
  - Progress bar with category color
  - Spent / Limit display
  - Status indicator (✓ OK, ⚠ Warning, ⚠ Over)
  - Edit and Delete actions
  - Status message banner
- **Add Budget card** (dashed border, motion hover)
- **Budget Form Modal** with category selector, limit input, period selector
- **Delete Confirm Dialog**

### Status Logic
```typescript
const pct = Math.round((spent / limit) * 100);
const status = pct >= 100 ? "over" : pct >= 80 ? "warning" : "ok";
```

---

## 7. Categories (`/categories`)

### Purpose
Management of categories, income sources, and payment methods (3 entity types in one page).

### Key Features
- **3-tab interface:** Categories | Sources | Methods
- **Categories tab:**
  - Type filter pills (All, Income, Expense, Transfer)
  - Card grid (2→5 columns) with emoji, name, type badge
  - Hover-reveal edit/delete buttons
  - Add card with dashed border
  - Form with name, type, emoji picker (28 emojis), color picker (10 colors), live preview
- **Sources tab:**
  - Source cards with icon, name, type, monthly average
  - Form with name, type, monthly average, emoji picker, color picker
- **Methods tab:**
  - Method cards with icon, name, type, last4, balance
  - Form with name, type, last4 (conditional), balance, emoji picker

### Emoji Picker
28 emoji options in a grid layout with selected border highlight.

### Color Picker
10 color swatches with ring + scale animation on selection.

---

## 8. Analytics (`/analytics`)

### Purpose
Deep financial analytics with multiple chart types.

### Key Features
- **Period selector:** 1W, 1M, 3M, 6M, 9M, 1Y (segmented control)
- **Chart type selector:** Area, Bar, Line (segmented control)
- **4 KPI Cards:** Total Income, Total Expenses, Net Cash Flow, Savings Rate
- **Income vs Expenses Chart:** Dynamic (area/bar/line) with gradient fills
- **Expense Breakdown:** Donut chart + category list with progress bars
- **Income Sources:** Donut chart + source list with progress bars
- **Savings Rate Trend:** Area chart with primary color gradient
- **Avg Spend by Weekday:** Bar chart (Sun–Sat)
- **Budget vs Actual Radar Chart:** Spider/radar chart comparing budget limits vs actual spending

### Chart Types (7 Total)
1. Area Chart (Income vs Expenses)
2. Bar Chart (Income vs Expenses, alternative)
3. Line Chart (Income vs Expenses, alternative with net line)
4. Pie/Donut Chart (Expense breakdown, Income sources)
5. Radar Chart (Budget vs Actual)
6. Area Chart (Savings Rate)
7. Bar Chart (Weekday spending)

---

## 9. Reports (`/reports`)

### Purpose
Financial report generation with export capabilities.

### Key Features
- **Filter card:** Date range + Type + Category + Method + Status
- **Action buttons:** Print/PDF + Export CSV
- **4 Summary Stats:** Transactions count, Total Income, Total Expenses, Net Balance
- **Category breakdown sidebar:** Top 5 expense categories with progress bars
- **Transaction table:**
  - 7 columns: Date, Title, Type, Category, Method, Status, Amount
  - Sortable columns (Date, Title, Amount)
  - Status pills with semantic colors
  - Color-coded amounts
  - Capped at 100 rows with "Export all" option
- **CSV Export:** Uses PapaParse with BOM for Excel compatibility
- **Print/PDF:** Uses `window.print()` with 300ms delay for toast

---

## 10. Profile (`/profile`)

### Purpose
User profile management, stats overview, and security.

### Key Features
- **Profile Card:**
  - Avatar with zoom/preview modal
  - Avatar upload (100KB limit, JPEG/PNG/WebP)
  - Name, email, phone, join date
  - "Premium Member" badge
  - Inline edit form (expandable with animation)
- **Stats Row:** Total Income, Total Expenses, Net Savings, Monthly Budget
- **Quick Access Grid:** 6 navigation tiles to other pages
- **Account Info:** Currency, Timezone, Language, Join date
- **Active Devices:** Device list with sign-out capability
- **Security Section:** Change Password, 2FA, Download Data, Delete Account
- **Avatar Zoom Modal:** Zoom in/out/reset controls (0.75x to 2.5x)

---

## 11. Settings (`/settings`)

### Purpose
Application preferences and configuration.

### Key Features
- **4-tab layout:** General | Alerts | Theme | Security
- **General tab:**
  - Regional preferences (Currency, Language, Timezone, Date Format)
  - Data & Privacy (Export, Clear history, Reset settings)
- **Alerts tab:**
  - 6 notification toggles with Switch components
  - Budget alerts, Transaction alerts, Weekly/Monthly reports, Security, Email digest
- **Appearance tab:**
  - 3-option theme picker (Light/Dark/System) with preview cards
  - Display toggles (Compact Mode, Show Balance, Animations)
- **Security tab:**
  - 2FA setup card
  - Password change form
  - Session management

---

## 12. Audit Logs (`/audit-logs`)

### Purpose
Security and activity event timeline.

### Key Features
- **3 Summary Cards:** Success/Failure/Warning counts (clickable to filter)
- **Search + result filter**
- **Desktop:** Full data table (7 columns: Timestamp, Action, Entity, Device, Browser/OS, IP, Result)
- **Mobile:** Card-based layout with condensed info
- **Result badges:** Color-coded (green/red/amber) with icons
- **Monospace font** for timestamps, actions, and IP addresses
- **Export button** for log download

---

## 13. Notifications (`/notifications`)

### Purpose
Notification center with read/unread management.

### Key Features
- **Unread count** in header subtitle
- **Actions:** Mark all read + Clear all
- **Grouped display:** Unread section (with blue dot) + Earlier section (dimmed)
- **Per-notification actions:** Click to mark read, X to dismiss
- **Type icons:** Info (blue), Success (green), Warning (amber), Error (red)
- **Animated list:** AnimatePresence for smooth add/remove
- **Empty state:** Bell icon + "You're all caught up!"
- **Relative timestamps:** "Today, 14:30" / "Yesterday, 09:15" / "25 Aug 2026, 10:00"

---

## 14. Auth Pages (5 Sub-Pages)

| Page | Route | Purpose |
|------|-------|---------|
| Sign In | `/sign-in` | Email/password login |
| Sign Up | `/sign-up` | New account registration |
| Forgot Password | `/forgot-password` | Password reset request |
| Reset Password | `/reset-password` | New password entry |
| Verify OTP | `/verify-otp` | OTP verification |
| Auth Callback | `/auth/callback` | OIDC callback handler |

### Auth Flow
1. User submits credentials → OIDC provider
2. Callback received at `/auth/callback`
3. Token stored in auth context
4. Redirect to Home page

---

## 15. Not Found Page (`*`)

- Custom 404 error page
- Catches all unmatched routes
- Provides navigation back to home
