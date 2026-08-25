import { AuthProvider } from "./auth.tsx";
import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";
import { TransactionProvider } from "./transaction-provider.tsx";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryClientProvider>
        <TooltipProvider>
          <ThemeProvider>
            <TransactionProvider>
              <Toaster />
              {children}
            </TransactionProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
