import { createContext, useContext, type ReactNode } from "react";
import { useTransactionStore, type TransactionStore } from "@/hooks/use-transactions.ts";
import { useAuth } from "@/hooks/use-auth.ts";

const TransactionContext = createContext<TransactionStore | null>(null);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Reload from PostgreSQL whenever the signed-in account changes.  The store
  // must not fetch before auth and then retain an anonymous device cache.
  const store = useTransactionStore(user?.id);
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
