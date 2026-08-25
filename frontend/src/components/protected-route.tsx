import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading FinanceOS…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading FinanceOS…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
