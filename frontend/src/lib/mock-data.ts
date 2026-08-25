import { subMonths, format } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────

export type TransactionType = "income" | "expense" | "transfer";
export type TransactionStatus = "completed" | "pending" | "failed";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType | "all";
  budget?: number;
  spent?: number;
};

export type PaymentMethod = {
  id: string;
  name: string;
  type: "bank" | "card" | "wallet" | "cash" | "upi";
  last4?: string;
  icon: string;
  balance?: number;
};

export type IncomeSource = {
  id: string;
  name: string;
  type: "salary" | "freelance" | "business" | "investment" | "other";
  icon: string;
  color: string;
  monthlyAvg: number;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  date: string;
  time: string;
  categoryId: string;
  paymentMethodId: string;
  sourceId?: string;
  notes?: string;
  status: TransactionStatus;
  tags?: string[];
};

export type Budget = {
  id: string;
  categoryId: string;
  period: "monthly" | "weekly" | "yearly";
  limit: number;
  spent: number;
  startDate: string;
  endDate: string;
};

export type AuditLog = {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  entityId: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  result: "success" | "failure" | "warning";
  userId: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: string;
};

// Clean empty arrays — pure database persistence with 0 mock data
export const CATEGORIES: Category[] = [];
export const PAYMENT_METHODS: PaymentMethod[] = [];
export const INCOME_SOURCES: IncomeSource[] = [];
export const TRANSACTIONS: Transaction[] = [];
export const BUDGETS: Budget[] = [];
export const AUDIT_LOGS: AuditLog[] = [];
export const NOTIFICATIONS: Notification[] = [];

// Default clean user
export const MOCK_USER = {
  id: "user-default",
  name: "User",
  email: "",
  phone: "",
  avatar: "",
  currency: "INR",
  timezone: "Asia/Kolkata",
  language: "en",
  joinedAt: new Date().toISOString().slice(0, 10),
  devices: [],
};

// ── Dynamic Helper Functions ───────────────────────────────────────────────

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getPaymentMethodById(id: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.find((p) => p.id === id);
}

export function getIncomeSourceById(id: string): IncomeSource | undefined {
  return INCOME_SOURCES.find((s) => s.id === id);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calcSummary(txs: Transaction[] = []) {
  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const transfer = txs.filter((t) => t.type === "transfer").reduce((s, t) => s + t.amount, 0);
  return { income, expense, transfer, balance: income - expense };
}

export function getMonthlyData(months = 6, txs: Transaction[] = []) {
  const today = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = subMonths(today, months - 1 - i);
    const label = format(d, "MMM");
    const monthTxs = txs.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    const { income, expense } = calcSummary(monthTxs);
    return { label, income, expense, net: income - expense };
  });
}

const VIBRANT_PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6", "#6366f1"];

export function getCategoryExpenseData(txs: Transaction[] = [], categories: Category[] = []) {
  const expenseTxs = txs.filter((t) => t.type === "expense");
  const map: Record<string, number> = {};
  for (const tx of expenseTxs) {
    if (tx.categoryId) {
      map[tx.categoryId] = (map[tx.categoryId] ?? 0) + tx.amount;
    }
  }
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .map(([catId, amount], idx) => {
      const cat = categories.find((c) => c.id === catId) || getCategoryById(catId);
      // Clean readable human name, never raw UUID database keys
      const displayName = cat?.name || (catId.length > 20 ? "General Expense" : catId);
      const icon = cat?.icon || "📁";
      const color = cat?.color || VIBRANT_PALETTE[idx % VIBRANT_PALETTE.length];
      return {
        id: catId,
        name: displayName,
        icon,
        amount,
        pct: total > 0 ? Math.round((amount / total) * 100) : 0,
        color,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
}
