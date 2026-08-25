# 🏗 System Architecture — Django, PostgreSQL & Prisma Backend

> Architecture document for the proposed Django + PostgreSQL + Prisma backend stack, mapped from the current frontend data models.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  React 19 + Vite + TypeScript + Tailwind CSS             │
│  Pages: Dashboard, Transactions, Budget, Analytics...    │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API (JSON)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  BACKEND (Django 5.x)                     │
│  ┌──────────────┐ ┌─────────────┐ ┌───────────────────┐ │
│  │ Django REST   │ │ Auth (JWT/  │ │  Business Logic   │ │
│  │ Framework     │ │ Allauth)    │ │  Services Layer   │ │
│  └──────┬───────┘ └──────┬──────┘ └─────────┬─────────┘ │
│         │                │                   │           │
│  ┌──────▼────────────────▼───────────────────▼─────────┐ │
│  │           Prisma ORM (prisma-client-py)              │ │
│  └──────────────────────┬──────────────────────────────┘ │
└─────────────────────────┬────────────────────────────────┘
                          │ SQL
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   PostgreSQL 16+                          │
│  Tables: users, transactions, categories, budgets...     │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema (PostgreSQL via Prisma)

### 2.1 Prisma Schema Definition

```prisma
// schema.prisma

generator client {
  provider             = "prisma-client-py"
  interface            = "asyncio"
  recursive_type_depth = 5
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ═══════════════════════════════════════════════════════════
// USER & AUTH
// ═══════════════════════════════════════════════════════════

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String
  phone        String?
  avatar       String?
  currency     String    @default("INR")
  timezone     String    @default("Asia/Kolkata")
  language     String    @default("en")
  dateFormat   String    @default("dd-MM-yyyy") @map("date_format")
  passwordHash String    @map("password_hash")
  is2FAEnabled Boolean   @default(false) @map("is_2fa_enabled")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // Relations
  transactions  Transaction[]
  categories    Category[]
  incomeSources IncomeSource[]
  paymentMethods PaymentMethod[]
  budgets       Budget[]
  devices       Device[]
  auditLogs     AuditLog[]
  notifications Notification[]
  settings      UserSettings?

  @@map("users")
}

model UserSettings {
  id                 String  @id @default(uuid())
  userId             String  @unique @map("user_id")
  user               User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Notification preferences
  budgetAlerts       Boolean @default(true) @map("budget_alerts")
  transactionAlerts  Boolean @default(true) @map("transaction_alerts")
  weeklyReport       Boolean @default(true) @map("weekly_report")
  monthlyReport      Boolean @default(false) @map("monthly_report")
  securityAlerts     Boolean @default(true) @map("security_alerts")
  emailDigest        Boolean @default(false) @map("email_digest")
  
  // Display preferences
  compactMode        Boolean @default(false) @map("compact_mode")
  showBalance        Boolean @default(true) @map("show_balance")
  animations         Boolean @default(true)
  theme              String  @default("system") // "light" | "dark" | "system"
  
  @@map("user_settings")
}

// ═══════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════

enum TransactionType {
  income
  expense
  transfer
}

enum TransactionStatus {
  completed
  pending
  failed
}

model Transaction {
  id              String            @id @default(uuid())
  userId          String            @map("user_id")
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type            TransactionType
  title           String
  amount          Decimal           @db.Decimal(12, 2)
  date            DateTime          @db.Date
  time            String            // "HH:mm" format
  notes           String?
  status          TransactionStatus @default(completed)
  
  categoryId      String            @map("category_id")
  category        Category          @relation(fields: [categoryId], references: [id])
  paymentMethodId String            @map("payment_method_id")
  paymentMethod   PaymentMethod     @relation(fields: [paymentMethodId], references: [id])
  sourceId        String?           @map("source_id")
  source          IncomeSource?     @relation(fields: [sourceId], references: [id])
  
  tags            String[]          @default([])
  
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")
  
  @@index([userId, date])
  @@index([userId, type])
  @@index([userId, categoryId])
  @@index([userId, status])
  @@map("transactions")
}

// ═══════════════════════════════════════════════════════════
// CATEGORIES & SOURCES
// ═══════════════════════════════════════════════════════════

model Category {
  id           String  @id @default(uuid())
  userId       String  @map("user_id")
  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name         String
  icon         String  // Emoji string
  color        String  // Hex color
  type         String  // "income" | "expense" | "transfer" | "all"
  
  transactions Transaction[]
  budgets      Budget[]
  
  createdAt    DateTime @default(now()) @map("created_at")
  
  @@unique([userId, name])
  @@map("categories")
}

model IncomeSource {
  id           String  @id @default(uuid())
  userId       String  @map("user_id")
  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name         String
  type         String  // "salary" | "freelance" | "business" | "investment" | "other"
  icon         String
  color        String
  monthlyAvg   Decimal @db.Decimal(12, 2) @map("monthly_avg")
  
  transactions Transaction[]
  
  @@unique([userId, name])
  @@map("income_sources")
}

enum PaymentMethodType {
  bank
  card
  wallet
  cash
  upi
}

model PaymentMethod {
  id           String            @id @default(uuid())
  userId       String            @map("user_id")
  user         User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name         String
  type         PaymentMethodType
  last4        String?
  icon         String
  balance      Decimal?          @db.Decimal(12, 2)
  
  transactions Transaction[]
  
  @@unique([userId, name])
  @@map("payment_methods")
}

// ═══════════════════════════════════════════════════════════
// BUDGETS
// ═══════════════════════════════════════════════════════════

enum BudgetPeriod {
  weekly
  monthly
  yearly
}

model Budget {
  id          String       @id @default(uuid())
  userId      String       @map("user_id")
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  categoryId  String       @map("category_id")
  category    Category     @relation(fields: [categoryId], references: [id])
  period      BudgetPeriod
  limitAmount Decimal      @db.Decimal(12, 2) @map("limit_amount")
  startDate   DateTime     @db.Date @map("start_date")
  endDate     DateTime     @db.Date @map("end_date")
  
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")
  
  @@unique([userId, categoryId, period])
  @@map("budgets")
}

// ═══════════════════════════════════════════════════════════
// AUDIT LOGS & NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

enum AuditResult {
  success
  failure
  warning
}

model AuditLog {
  id        String      @id @default(uuid())
  userId    String      @map("user_id")
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  action    String
  entity    String
  entityId  String      @map("entity_id")
  device    String
  browser   String
  os        String
  ip        String
  result    AuditResult
  
  timestamp DateTime    @default(now())
  
  @@index([userId, timestamp])
  @@map("audit_logs")
}

enum NotificationType {
  info
  success
  warning
  error
}

model Notification {
  id        String           @id @default(uuid())
  userId    String           @map("user_id")
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title     String
  message   String
  type      NotificationType
  read      Boolean          @default(false)
  
  timestamp DateTime         @default(now())
  
  @@index([userId, read])
  @@map("notifications")
}

// ═══════════════════════════════════════════════════════════
// DEVICES
// ═══════════════════════════════════════════════════════════

model Device {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name       String
  os         String
  browser    String
  isCurrent  Boolean  @default(false) @map("is_current")
  lastActive DateTime @map("last_active")
  
  @@map("devices")
}
```

---

## 3. Django Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── prisma/
│   └── schema.prisma              # Prisma schema (above)
├── config/
│   ├── settings/
│   │   ├── base.py                # Common settings
│   │   ├── development.py         # Dev settings
│   │   └── production.py          # Prod settings
│   ├── urls.py                    # Root URL config
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── users/
│   │   ├── models.py              # User model extensions
│   │   ├── serializers.py         # User/Profile serializers
│   │   ├── views.py               # Profile, Settings API
│   │   └── urls.py
│   ├── transactions/
│   │   ├── models.py              # Transaction model
│   │   ├── serializers.py         # Transaction CRUD serializers
│   │   ├── views.py               # Transaction API (CRUD + filters)
│   │   ├── filters.py             # Django-filter integration
│   │   └── urls.py
│   ├── categories/
│   │   ├── models.py              # Category, IncomeSource, PaymentMethod
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── budgets/
│   │   ├── models.py              # Budget model
│   │   ├── serializers.py
│   │   ├── views.py               # Budget CRUD + spent calculations
│   │   └── urls.py
│   ├── analytics/
│   │   ├── views.py               # Analytics computation endpoints
│   │   ├── services.py            # Aggregation logic
│   │   └── urls.py
│   ├── reports/
│   │   ├── views.py               # Report generation + CSV/PDF export
│   │   ├── services.py            # Report computation
│   │   └── urls.py
│   ├── notifications/
│   │   ├── models.py              # Notification model
│   │   ├── serializers.py
│   │   ├── views.py               # CRUD + mark read/clear
│   │   └── urls.py
│   └── audit/
│       ├── models.py              # AuditLog model
│       ├── middleware.py           # Auto-logging middleware
│       ├── serializers.py
│       ├── views.py
│       └── urls.py
└── utils/
    ├── pagination.py              # Custom pagination
    ├── permissions.py             # Custom permissions
    └── exceptions.py              # Custom exception handler
```

---

## 4. API Endpoints

### 4.1 Authentication

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/register/` | Create account |
| `POST` | `/api/auth/login/` | Get JWT tokens |
| `POST` | `/api/auth/refresh/` | Refresh access token |
| `POST` | `/api/auth/forgot-password/` | Request password reset |
| `POST` | `/api/auth/reset-password/` | Reset with token |
| `POST` | `/api/auth/verify-otp/` | OTP verification |
| `POST` | `/api/auth/logout/` | Invalidate tokens |

### 4.2 Transactions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/transactions/` | List (with filters, search, sort, pagination) |
| `POST` | `/api/transactions/` | Create transaction |
| `GET` | `/api/transactions/{id}/` | Get detail |
| `PUT` | `/api/transactions/{id}/` | Update transaction |
| `DELETE` | `/api/transactions/{id}/` | Delete transaction |
| `POST` | `/api/transactions/{id}/duplicate/` | Duplicate transaction |
| `GET` | `/api/transactions/summary/` | Get income/expense/transfer totals |

**Query Parameters:**
```
?search=groceries
&type=income|expense|transfer
&category_id=uuid
&payment_method_id=uuid
&status=completed|pending|failed
&date_from=2026-01-01
&date_to=2026-01-31
&sort=date|-date|amount|-amount|title|-title
&page=1
&page_size=20
```

### 4.3 Categories, Sources, Methods

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET/POST` | `/api/categories/` | List / Create categories |
| `PUT/DELETE` | `/api/categories/{id}/` | Update / Delete |
| `GET/POST` | `/api/income-sources/` | List / Create sources |
| `PUT/DELETE` | `/api/income-sources/{id}/` | Update / Delete |
| `GET/POST` | `/api/payment-methods/` | List / Create methods |
| `PUT/DELETE` | `/api/payment-methods/{id}/` | Update / Delete |

### 4.4 Budgets

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET/POST` | `/api/budgets/` | List / Create budgets |
| `PUT/DELETE` | `/api/budgets/{id}/` | Update / Delete |
| `GET` | `/api/budgets/summary/` | Budget progress (spent computed from transactions) |

### 4.5 Analytics

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/analytics/overview/` | Dashboard KPIs |
| `GET` | `/api/analytics/monthly-trend/` | Monthly income/expense data |
| `GET` | `/api/analytics/category-breakdown/` | Expense by category |
| `GET` | `/api/analytics/source-breakdown/` | Income by source |
| `GET` | `/api/analytics/savings-rate/` | Savings rate trend |
| `GET` | `/api/analytics/weekday-spending/` | Average by day of week |
| `GET` | `/api/analytics/budget-vs-actual/` | Budget comparison |

### 4.6 Reports, Notifications, Audit Logs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/reports/generate/` | Generate filtered report data |
| `GET` | `/api/reports/export/csv/` | Export as CSV |
| `GET/POST` | `/api/notifications/` | List / Create |
| `POST` | `/api/notifications/mark-all-read/` | Mark all as read |
| `DELETE` | `/api/notifications/clear-all/` | Clear all |
| `GET` | `/api/audit-logs/` | List with filters |
| `GET` | `/api/audit-logs/summary/` | Success/failure/warning counts |

### 4.7 Profile & Settings

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET/PUT` | `/api/profile/` | Get / Update profile |
| `POST` | `/api/profile/avatar/` | Upload avatar |
| `GET/PUT` | `/api/settings/` | Get / Update settings |
| `POST` | `/api/settings/change-password/` | Change password |
| `GET` | `/api/devices/` | List active devices |
| `POST` | `/api/devices/{id}/sign-out/` | Sign out device |
| `POST` | `/api/devices/sign-out-all/` | Sign out all other devices |
| `GET` | `/api/export/data/` | Export all user data |

---

## 5. Current → Proposed Migration Mapping

| Current (Frontend) | Proposed (Backend) |
|--------------------|--------------------|
| `mock-data.ts` (TRANSACTIONS array) | `PostgreSQL transactions table` |
| `mock-data.ts` (CATEGORIES constant) | `PostgreSQL categories table` (seeded per user) |
| `mock-data.ts` (PAYMENT_METHODS constant) | `PostgreSQL payment_methods table` |
| `mock-data.ts` (INCOME_SOURCES constant) | `PostgreSQL income_sources table` |
| `mock-data.ts` (BUDGETS constant) | `PostgreSQL budgets table` |
| `mock-data.ts` (AUDIT_LOGS constant) | `PostgreSQL audit_logs table` (auto-generated) |
| `mock-data.ts` (NOTIFICATIONS constant) | `PostgreSQL notifications table` |
| `mock-data.ts` (MOCK_USER constant) | `PostgreSQL users table` |
| `calcSummary()` function | `Django analytics service` |
| `formatCurrency()` function | `Keep in frontend` (display-only) |
| `getMonthlyData()` function | `Django analytics endpoint` |
| `getCategoryExpenseData()` function | `Django analytics endpoint` |
| `Convex BaaS` (current) | `Django REST Framework` |
| `OIDC Auth` (current) | `Django Allauth + JWT` |
| `localStorage` (theme) | `Keep in frontend + user_settings table` |
| `React Context` (transactions) | `React Query + API calls` |

---

## 6. Environment Configuration

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker"
SECRET_KEY="django-insecure-your-secret-key"
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
JWT_SECRET_KEY="your-jwt-secret"
REDIS_URL="redis://localhost:6379/0"
```
