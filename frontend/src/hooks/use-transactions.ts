/**
 * Global transaction and metadata store connected to Django REST API & PostgreSQL database.
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

let _txCounter = 10000;
export function makeTxId() { return `tx-${++_txCounter}`; }

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch live transactions from Django REST API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/transactions/");
      if (res.data?.results && Array.isArray(res.data.results)) {
        setTransactions(res.data.results);
      }
    } catch {
      // Retain state
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
      // Retain state
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
    setTransactions((prev) => [optimisticTx, ...prev]);

    try {
      const res = await apiClient.post("/transactions/", data);
      if (res.data?.id) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: res.data.id } : t))
        );
        optimisticTx.id = res.data.id;
      }
      toast.success("Transaction recorded in database!");
    } catch (err) {
      console.error("Failed to persist transaction:", err);
      toast.error("Failed to record transaction in database");
    }

    return optimisticTx;
  }, []);

  const updateTransaction = useCallback(async (id: string, data: Partial<NewTransaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    try {
      await apiClient.put(`/transactions/${id}/`, data);
      toast.success("Transaction updated in database!");
    } catch (err) {
      console.error("Failed to update transaction:", err);
      toast.error("Failed to update transaction in database");
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await apiClient.delete(`/transactions/${id}/`);
      toast.success("Transaction deleted from database!");
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      toast.error("Failed to delete transaction from database");
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
    setTransactions((prev) => [dupe, ...prev]);

    try {
      const res = await apiClient.post(`/transactions/${tx.id}/duplicate/`);
      if (res.data?.id) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: res.data.id } : t))
        );
        dupe.id = res.data.id;
      }
      toast.success("Transaction duplicated in database!");
    } catch (err) {
      console.error("Failed to duplicate transaction:", err);
      toast.error("Failed to duplicate transaction");
    }
    return dupe;
  }, []);

  // Category Actions
  const saveCategory = useCallback(async (data: Omit<Category, "id">, existing: Category | null) => {
    if (existing) {
      setCategories((prev) => prev.map((c) => (c.id === existing.id ? { ...c, ...data } : c)));
      try {
        await apiClient.put(`/categories/${existing.id}/`, data);
        toast.success("Category updated in database!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to update category in database");
      }
    } else {
      const tempId = `cat-${Date.now()}`;
      const newCat: Category = { id: tempId, ...data };
      setCategories((prev) => [...prev, newCat]);
      try {
        const res = await apiClient.post("/categories/", data);
        if (res.data?.id) {
          setCategories((prev) => prev.map((c) => (c.id === tempId ? { ...c, id: res.data.id } : c)));
        }
        toast.success("Category created in database!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to save category to database");
      }
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      await apiClient.delete(`/categories/${id}/`);
      toast.success("Category deleted from database!");
    } catch {
      toast.error("Failed to delete category from database");
    }
  }, []);

  // Income Source Actions
  const saveIncomeSource = useCallback(async (data: Omit<IncomeSource, "id">, existing: IncomeSource | null) => {
    if (existing) {
      setIncomeSources((prev) => prev.map((s) => (s.id === existing.id ? { ...s, ...data } : s)));
      try {
        await apiClient.put(`/income-sources/${existing.id}/`, data);
        toast.success("Income stream updated in database!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to update income stream in database");
      }
    } else {
      const tempId = `src-${Date.now()}`;
      const newSrc: IncomeSource = { id: tempId, ...data };
      setIncomeSources((prev) => [...prev, newSrc]);
      try {
        const res = await apiClient.post("/income-sources/", data);
        if (res.data?.id) {
          setIncomeSources((prev) => prev.map((s) => (s.id === tempId ? { ...s, id: res.data.id } : s)));
        }
        toast.success("Income stream created in database!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to save income stream to database");
      }
    }
  }, []);

  const deleteIncomeSource = useCallback(async (id: string) => {
    setIncomeSources((prev) => prev.filter((s) => s.id !== id));
    try {
      await apiClient.delete(`/income-sources/${id}/`);
      toast.success("Income stream deleted from database!");
    } catch {
      toast.error("Failed to delete income stream from database");
    }
  }, []);

  // Payment Method Actions
  const savePaymentMethod = useCallback(async (data: Omit<PaymentMethod, "id">, existing: PaymentMethod | null) => {
    if (existing) {
      setPaymentMethods((prev) => prev.map((m) => (m.id === existing.id ? { ...m, ...data } : m)));
      try {
        await apiClient.put(`/payment-methods/${existing.id}/`, data);
        toast.success("Payment account updated in database!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to update payment account in database");
      }
    } else {
      const tempId = `pm-${Date.now()}`;
      const newPm: PaymentMethod = { id: tempId, ...data };
      setPaymentMethods((prev) => [...prev, newPm]);
      try {
        const res = await apiClient.post("/payment-methods/", data);
        if (res.data?.id) {
          setPaymentMethods((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: res.data.id } : m)));
        }
        toast.success("Payment account created in database!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to save payment account to database");
      }
    }
  }, []);

  const deletePaymentMethod = useCallback(async (id: string) => {
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
    try {
      await apiClient.delete(`/payment-methods/${id}/`);
      toast.success("Payment account deleted from database!");
    } catch {
      toast.error("Failed to delete payment account from database");
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
