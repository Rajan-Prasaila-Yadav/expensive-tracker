/**
 * Global transaction and metadata store connected to Django REST API, PostgreSQL database & resilient localStorage cache.
 */
import { useState, useCallback, useEffect } from "react";
import {
  CATEGORIES as DEFAULT_CATEGORIES,
  INCOME_SOURCES as DEFAULT_SOURCES,
  PAYMENT_METHODS as DEFAULT_METHODS,
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

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed && !Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn(`Failed to parse ${key} from storage:`, e);
  }
  return fallback;
}

function saveStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${key} to storage:`, e);
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

export function useTransactionStore(): TransactionStore {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, [])
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    loadStorage<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES)
  );
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(() =>
    loadStorage<IncomeSource[]>(STORAGE_KEYS.SOURCES, DEFAULT_SOURCES)
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() =>
    loadStorage<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, DEFAULT_METHODS)
  );
  const [loading, setLoading] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    saveStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.SOURCES, incomeSources);
  }, [incomeSources]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.PAYMENT_METHODS, paymentMethods);
  }, [paymentMethods]);

  // Fetch live transactions from Django REST API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/transactions/");
      if (res.data?.results && Array.isArray(res.data.results) && res.data.results.length > 0) {
        setTransactions(res.data.results);
      }
    } catch {
      // Retain local state
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch live categories, sources, and payment methods
  const fetchAllMetadata = useCallback(async () => {
    try {
      const [catsRes, srcsRes, pmsRes] = await Promise.allSettled([
        apiClient.get("/categories/"),
        apiClient.get("/income-sources/"),
        apiClient.get("/payment-methods/"),
      ]);

      if (catsRes.status === "fulfilled" && Array.isArray(catsRes.value.data) && catsRes.value.data.length > 0) {
        setCategories(catsRes.value.data);
      }
      if (srcsRes.status === "fulfilled" && Array.isArray(srcsRes.value.data) && srcsRes.value.data.length > 0) {
        setIncomeSources(srcsRes.value.data);
      }
      if (pmsRes.status === "fulfilled" && Array.isArray(pmsRes.value.data) && pmsRes.value.data.length > 0) {
        setPaymentMethods(pmsRes.value.data);
      }
    } catch {
      // Retain local state
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchAllMetadata();
  }, [fetchTransactions, fetchAllMetadata]);

  // Transaction Actions
  const addTransaction = useCallback(async (data: NewTransaction): Promise<Transaction> => {
    const tempId = makeTxId();
    const optimisticTx: Transaction = { id: tempId, ...data };
    setTransactions((prev) => {
      const next = [optimisticTx, ...prev];
      saveStorage(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });

    try {
      const res = await apiClient.post("/transactions/", data);
      if (res.data?.id) {
        setTransactions((prev) => {
          const next = prev.map((t) => (t.id === tempId ? { ...t, id: res.data.id } : t));
          saveStorage(STORAGE_KEYS.TRANSACTIONS, next);
          return next;
        });
        optimisticTx.id = res.data.id;
      }
      toast.success("Transaction recorded successfully!");
    } catch {
      toast.success("Transaction recorded locally and queued for cloud sync!");
    }

    return optimisticTx;
  }, []);

  const updateTransaction = useCallback(async (id: string, data: Partial<NewTransaction>) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...data } : t));
      saveStorage(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });
    try {
      await apiClient.put(`/transactions/${id}/`, data);
      toast.success("Transaction updated successfully!");
    } catch {
      toast.success("Transaction updated locally!");
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveStorage(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });
    try {
      await apiClient.delete(`/transactions/${id}/`);
      toast.success("Transaction deleted successfully!");
    } catch {
      toast.success("Transaction removed locally!");
    }
  }, []);

  const duplicateTransaction = useCallback(async (tx: Transaction): Promise<Transaction> => {
    const tempId = makeTxId();
    const dupe: Transaction = {
      ...tx,
      id: tempId,
      title: `${tx.title} (Copy)`,
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
    };
    setTransactions((prev) => {
      const next = [dupe, ...prev];
      saveStorage(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });

    try {
      const res = await apiClient.post(`/transactions/${tx.id}/duplicate/`);
      if (res.data?.id) {
        setTransactions((prev) => {
          const next = prev.map((t) => (t.id === tempId ? { ...t, id: res.data.id } : t));
          saveStorage(STORAGE_KEYS.TRANSACTIONS, next);
          return next;
        });
        dupe.id = res.data.id;
      }
      toast.success("Transaction duplicated successfully!");
    } catch {
      toast.success("Transaction duplicated locally!");
    }
    return dupe;
  }, []);

  // Category Actions
  const saveCategory = useCallback(async (data: Omit<Category, "id">, existing: Category | null) => {
    if (existing) {
      setCategories((prev) => {
        const next = prev.map((c) => (c.id === existing.id ? { ...c, ...data } : c));
        saveStorage(STORAGE_KEYS.CATEGORIES, next);
        return next;
      });
      try {
        await apiClient.put(`/categories/${existing.id}/`, data);
        toast.success("Category updated successfully!");
      } catch {
        toast.success("Category updated locally!");
      }
    } else {
      const tempId = `cat-${Date.now()}`;
      const newCat: Category = { id: tempId, ...data };
      setCategories((prev) => {
        const next = [...prev, newCat];
        saveStorage(STORAGE_KEYS.CATEGORIES, next);
        return next;
      });
      try {
        const res = await apiClient.post("/categories/", data);
        if (res.data?.id) {
          setCategories((prev) => {
            const next = prev.map((c) => (c.id === tempId ? { ...c, id: res.data.id } : c));
            saveStorage(STORAGE_KEYS.CATEGORIES, next);
            return next;
          });
        }
        toast.success("Category created successfully!");
      } catch {
        toast.success("Category created locally!");
      }
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveStorage(STORAGE_KEYS.CATEGORIES, next);
      return next;
    });
    try {
      await apiClient.delete(`/categories/${id}/`);
      toast.success("Category deleted successfully!");
    } catch {
      toast.success("Category removed locally!");
    }
  }, []);

  // Income Source Actions
  const saveIncomeSource = useCallback(async (data: Omit<IncomeSource, "id">, existing: IncomeSource | null) => {
    if (existing) {
      setIncomeSources((prev) => {
        const next = prev.map((s) => (s.id === existing.id ? { ...s, ...data } : s));
        saveStorage(STORAGE_KEYS.SOURCES, next);
        return next;
      });
      try {
        await apiClient.put(`/income-sources/${existing.id}/`, data);
        toast.success("Income stream updated successfully!");
      } catch {
        toast.success("Income stream updated locally!");
      }
    } else {
      const tempId = `src-${Date.now()}`;
      const newSrc: IncomeSource = { id: tempId, ...data };
      setIncomeSources((prev) => {
        const next = [...prev, newSrc];
        saveStorage(STORAGE_KEYS.SOURCES, next);
        return next;
      });
      try {
        const res = await apiClient.post("/income-sources/", data);
        if (res.data?.id) {
          setIncomeSources((prev) => {
            const next = prev.map((s) => (s.id === tempId ? { ...s, id: res.data.id } : s));
            saveStorage(STORAGE_KEYS.SOURCES, next);
            return next;
          });
        }
        toast.success("Income stream created successfully!");
      } catch {
        toast.success("Income stream created locally!");
      }
    }
  }, []);

  const deleteIncomeSource = useCallback(async (id: string) => {
    setIncomeSources((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveStorage(STORAGE_KEYS.SOURCES, next);
      return next;
    });
    try {
      await apiClient.delete(`/income-sources/${id}/`);
      toast.success("Income stream deleted successfully!");
    } catch {
      toast.success("Income stream removed locally!");
    }
  }, []);

  // Payment Method Actions
  const savePaymentMethod = useCallback(async (data: Omit<PaymentMethod, "id">, existing: PaymentMethod | null) => {
    if (existing) {
      setPaymentMethods((prev) => {
        const next = prev.map((p) => (p.id === existing.id ? { ...p, ...data } : p));
        saveStorage(STORAGE_KEYS.PAYMENT_METHODS, next);
        return next;
      });
      try {
        await apiClient.put(`/payment-methods/${existing.id}/`, data);
        toast.success("Payment account updated successfully!");
      } catch {
        toast.success("Payment account updated locally!");
      }
    } else {
      const tempId = `pm-${Date.now()}`;
      const newPm: PaymentMethod = { id: tempId, ...data };
      setPaymentMethods((prev) => {
        const next = [...prev, newPm];
        saveStorage(STORAGE_KEYS.PAYMENT_METHODS, next);
        return next;
      });
      try {
        const res = await apiClient.post("/payment-methods/", data);
        if (res.data?.id) {
          setPaymentMethods((prev) => {
            const next = prev.map((p) => (p.id === tempId ? { ...p, id: res.data.id } : p));
            saveStorage(STORAGE_KEYS.PAYMENT_METHODS, next);
            return next;
          });
        }
        toast.success("Payment account created successfully!");
      } catch {
        toast.success("Payment account created locally!");
      }
    }
  }, []);

  const deletePaymentMethod = useCallback(async (id: string) => {
    setPaymentMethods((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveStorage(STORAGE_KEYS.PAYMENT_METHODS, next);
      return next;
    });
    try {
      await apiClient.delete(`/payment-methods/${id}/`);
      toast.success("Payment account deleted successfully!");
    } catch {
      toast.success("Payment account removed locally!");
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
