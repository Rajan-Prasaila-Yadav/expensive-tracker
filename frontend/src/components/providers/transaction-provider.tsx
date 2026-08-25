import { createContext, useContext, type ReactNode } from "react";
import { useTransactionStore, type TransactionStore } from "@/hooks/use-transactions.ts";

const TransactionContext = createContext<TransactionStore | null>(null);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const store = useTransactionStore();
  return (
    <TransactionContext.Provider value={store}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions(): TransactionStore {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionProvider");
  return ctx;
}
