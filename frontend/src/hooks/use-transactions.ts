/**
 * Global transaction and metadata store.
 * 
 * ARCHITECTURE:
 * - PRIMARY: Django REST API → PostgreSQL (Supabase) — the source of truth
 * - CACHE: localStorage — display cache only; Django/PostgreSQL is the source of truth
 * 
 * On mount: Load from localStorage instantly, then fetch from API and overwrite.
 * On write: persist to the API first. A failed cloud request is never presented
 *           as a successful save, preventing device-specific phantom records.
 */
import { useState, useCallback, useEffect } from "react";
import {
  type Transaction,
  type Category,
  type IncomeSource,
  type PaymentMethod,
} from "@/lib/mock-data.ts";
import apiClient from "@/lib/api-client.ts";
import { toast } from "sonner";
import { format } from "date-fns";

const STORAGE_KEYS = {
  TRANSACTIONS: "financeos_transactions_v1",
  CATEGORIES: "financeos_categories_v1",
  SOURCES: "financeos_sources_v1",
  PAYMENT_METHODS: "financeos_payment_methods_v1",
};

function loadCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as T;
      if (parsed && !Array.isArray(parsed)) return parsed as T;
    }
  } catch (e) {
    console.warn(`[Cache] Failed to parse ${key}:`, e);
  }
  return fallback;
}

function saveCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[Cache] Failed to save ${key}:`, e);
  }
}

export function makeTxId() {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export type NewTransaction = Omit<Transaction, "id">;

export interface TransactionStore {
  transactions: Transaction[];
  categories: Category[];
  incomeSources: IncomeSource[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  fetchTransactions: () => Promise<void>;
  fetchAllMetadata: () => Promise<void>;
  addTransaction: (data: NewTransaction) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<NewTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  duplicateTransaction: (tx: Transaction) => Promise<Transaction>;
  saveCategory: (data: Omit<Category, "id">, existing: Category | null) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveIncomeSource: (data: Omit<IncomeSource, "id">, existing: IncomeSource | null) => Promise<void>;
  deleteIncomeSource: (id: string) => Promise<void>;
  savePaymentMethod: (data: Omit<PaymentMethod, "id">, existing: PaymentMethod | null) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
}

export function useTransactionStore(userId?: string): TransactionStore {
  // Initialize from cache for instant display
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadCache<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, [])
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    loadCache<Category[]>(STORAGE_KEYS.CATEGORIES, [])
  );
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(() =>
    loadCache<IncomeSource[]>(STORAGE_KEYS.SOURCES, [])
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() =>
    loadCache<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, [])
  );
  const [loading, setLoading] = useState(true);

  // Persist state changes to cache
  useEffect(() => { saveCache(STORAGE_KEYS.TRANSACTIONS, transactions); }, [transactions]);
  useEffect(() => { saveCache(STORAGE_KEYS.CATEGORIES, categories); }, [categories]);
  useEffect(() => { saveCache(STORAGE_KEYS.SOURCES, incomeSources); }, [incomeSources]);
  useEffect(() => { saveCache(STORAGE_KEYS.PAYMENT_METHODS, paymentMethods); }, [paymentMethods]);

  // ─── FETCH: API-first, overwrite cache with server data ───

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/transactions/");
      const data = res.data?.results ?? res.data;
      if (Array.isArray(data)) {
        setTransactions(data);
        saveCache(STORAGE_KEYS.TRANSACTIONS, data);
      }
    } catch (err) {
      console.warn("[API] Failed to fetch transactions, using cache:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllMetadata = useCallback(async () => {
    try {
      const [catsRes, srcsRes, pmsRes] = await Promise.allSettled([
        apiClient.get("/categories/"),
        apiClient.get("/income-sources/"),
        apiClient.get("/payment-methods/"),
      ]);

      if (catsRes.status === "fulfilled") {
        const data = Array.isArray(catsRes.value.data) ? catsRes.value.data : [];
        setCategories(data);
        saveCache(STORAGE_KEYS.CATEGORIES, data);
      }
      if (srcsRes.status === "fulfilled") {
        const data = Array.isArray(srcsRes.value.data) ? srcsRes.value.data : [];
        setIncomeSources(data);
        saveCache(STORAGE_KEYS.SOURCES, data);
      }
      if (pmsRes.status === "fulfilled") {
        const data = Array.isArray(pmsRes.value.data) ? pmsRes.value.data : [];
        setPaymentMethods(data);
        saveCache(STORAGE_KEYS.PAYMENT_METHODS, data);
      }
    } catch (err) {
      console.warn("[API] Failed to fetch metadata, using cache:", err);
    }
  }, []);

  // Fetch only after authentication, and again whenever a different account
  // signs in. This makes the database—not a phone's localStorage—the source
  // of every visible record.
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchTransactions();
    fetchAllMetadata();
  }, [userId, fetchTransactions, fetchAllMetadata]);

  // ─── WRITE: Optimistic update + API persist ───

  const addTransaction = useCallback(async (data: NewTransaction): Promise<Transaction> => {
    try {
      const res = await apiClient.post("/transactions/", data);
      const saved: Transaction = { ...data, ...res.data, id: res.data.id };
      setTransactions((prev) => [saved, ...prev]);
      toast.success("Transaction saved!");
      return saved;
    } catch (err) {
      console.error("[API] Failed to save transaction:", err);
      toast.error("Could not save transaction to the cloud. Please try again.");
      throw err;
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, data: Partial<NewTransaction>) => {
    try {
      await apiClient.put(`/transactions/${id}/`, data);
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
      toast.success("Transaction updated!");
    } catch (err) {
      console.error("[API] Failed to update transaction:", err);
      toast.error("Could not update transaction in the cloud.");
      throw err;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/transactions/${id}/`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success("Transaction deleted!");
    } catch (err) {
      console.error("[API] Failed to delete transaction:", err);
      toast.error("Could not delete transaction from the cloud.");
      throw err;
    }
  }, []);

  const duplicateTransaction = useCallback(async (tx: Transaction): Promise<Transaction> => {
    try {
      const res = await apiClient.post(`/transactions/${tx.id}/duplicate/`);
      const dupe: Transaction = { ...tx, ...res.data, id: res.data.id, title: `${tx.title} (Copy)`, date: format(new Date(), "yyyy-MM-dd"), time: format(new Date(), "HH:mm") };
      setTransactions((prev) => [dupe, ...prev]);
      toast.success("Transaction duplicated!");
      return dupe;
    } catch (err) {
      console.error("[API] Failed to duplicate transaction:", err);
      toast.error("Could not duplicate transaction in the cloud.");
      throw err;
    }
  }, []);

  // ─── CATEGORY CRUD ───

  const saveCategory = useCallback(async (data: Omit<Category, "id">, existing: Category | null) => {
    if (existing) {
      try {
        await apiClient.put(`/categories/${existing.id}/`, data);
        setCategories((prev) => prev.map((c) => (c.id === existing.id ? { ...c, ...data } : c)));
        toast.success("Category updated!");
      } catch (err) {
        console.error("[API] Failed to update category:", err);
        toast.error("Could not update category in the cloud.");
        throw err;
      }
    } else {
      const newCat: Category = { id: "", ...data };
      try {
        const res = await apiClient.post("/categories/", data);
        newCat.id = res.data.id;
        setCategories((prev) => [...prev, newCat]);
        toast.success("Category created!");
      } catch (err) {
        console.error("[API] Failed to create category:", err);
        toast.error("Could not create category in the cloud.");
        throw err;
      }
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/categories/${id}/`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted!");
    } catch (err) {
      console.error("[API] Failed to delete category:", err);
      toast.error("Could not delete category from the cloud.");
      throw err;
    }
  }, []);

  // ─── INCOME SOURCE CRUD ───

  const saveIncomeSource = useCallback(async (data: Omit<IncomeSource, "id">, existing: IncomeSource | null) => {
    if (existing) {
      try {
        await apiClient.put(`/income-sources/${existing.id}/`, data);
        setIncomeSources((prev) => prev.map((s) => (s.id === existing.id ? { ...s, ...data } : s)));
        toast.success("Income source updated!");
      } catch (err) {
        console.error("[API] Failed to update income source:", err);
        toast.error("Could not update income source in the cloud.");
        throw err;
      }
    } else {
      const newSrc: IncomeSource = { id: "", ...data };
      try {
        const res = await apiClient.post("/income-sources/", data);
        newSrc.id = res.data.id;
        setIncomeSources((prev) => [...prev, newSrc]);
        toast.success("Income source created!");
      } catch (err) {
        console.error("[API] Failed to create income source:", err);
        toast.error("Could not create income source in the cloud.");
        throw err;
      }
    }
  }, []);

  const deleteIncomeSource = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/income-sources/${id}/`);
      setIncomeSources((prev) => prev.filter((s) => s.id !== id));
      toast.success("Income source deleted!");
    } catch (err) {
      console.error("[API] Failed to delete income source:", err);
      toast.error("Could not delete income source from the cloud.");
      throw err;
    }
  }, []);

  // ─── PAYMENT METHOD CRUD ───

  const savePaymentMethod = useCallback(async (data: Omit<PaymentMethod, "id">, existing: PaymentMethod | null) => {
    if (existing) {
      try {
        await apiClient.put(`/payment-methods/${existing.id}/`, data);
        setPaymentMethods((prev) => prev.map((p) => (p.id === existing.id ? { ...p, ...data } : p)));
        toast.success("Payment method updated!");
      } catch (err) {
        console.error("[API] Failed to update payment method:", err);
        toast.error("Could not update payment method in the cloud.");
        throw err;
      }
    } else {
      const newPm: PaymentMethod = { id: "", ...data };
      try {
        const res = await apiClient.post("/payment-methods/", data);
        newPm.id = res.data.id;
        setPaymentMethods((prev) => [...prev, newPm]);
        toast.success("Payment method created!");
      } catch (err) {
        console.error("[API] Failed to create payment method:", err);
        toast.error("Could not create payment method in the cloud.");
        throw err;
      }
    }
  }, []);

  const deletePaymentMethod = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/payment-methods/${id}/`);
      setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
      toast.success("Payment method deleted!");
    } catch (err) {
      console.error("[API] Failed to delete payment method:", err);
      toast.error("Could not delete payment method from the cloud.");
      throw err;
    }
  }, []);

  return {
    transactions,
    categories,
    incomeSources,
    paymentMethods,
    loading,
    fetchTransactions,
    fetchAllMetadata,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
    saveCategory,
    deleteCategory,
    saveIncomeSource,
    deleteIncomeSource,
    savePaymentMethod,
    deletePaymentMethod,
  };
}
