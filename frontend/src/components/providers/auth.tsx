import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client.ts";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase.ts";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  browser: string;
  lastActive: string;
  current: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  currency: string;
  timezone?: string;
  language?: string;
  dateFormat?: string;
  joinedAt?: string;
  devices?: DeviceInfo[];
}

interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUser: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync Google user with Django backend
  const syncGoogleUserWithBackend = async (sbUser: SupabaseUser) => {
    try {
      const email = sbUser.email || "";
      const meta = sbUser.user_metadata || {};
      const name = meta.full_name || meta.name || email.split("@")[0];
      const avatar = meta.avatar_url || meta.picture || "";

      const res = await apiClient.post("/auth/google/", {
        email,
        name,
        avatar,
      });

      const { user: userData, tokens } = res.data;
      if (tokens) {
        localStorage.setItem("access_token", tokens.access);
        localStorage.setItem("refresh_token", tokens.refresh);
      }
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.error("Google user backend sync error:", err);
      throw err;
    }
  };

  useEffect(() => {
    // 1. Check local session
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser && !user) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }

    // The OAuth redirect reloads the application.  Supabase restores that
    // session here; we then exchange the Google identity for the app's Django
    // JWT and user record.  Without this listener Google succeeds but the app
    // never becomes signed in.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setSupabaseUser(currentSession?.user ?? null);

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && currentSession?.user) {
        void syncGoogleUserWithBackend(currentSession.user).catch(() => {
          toast.error("Google sign-in completed, but the account could not be connected to the server.");
        });
      }

      if (event === "SIGNED_OUT") {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Direct Django PostgreSQL Backend Auth (Primary)
    try {
      const res = await apiClient.post("/auth/login/", { email: cleanEmail, password });
      const { user: userData, tokens } = res.data;
      if (tokens) {
        localStorage.setItem("access_token", tokens.access);
        localStorage.setItem("refresh_token", tokens.refresh);
      }
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      toast.success(`Welcome back, ${userData.name || "User"}!`);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Invalid email or password. Please check your credentials.";
      toast.error(msg);
      return false;
    }
  };

  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // 1. Direct Django PostgreSQL Backend Auth (Primary)
    try {
      const res = await apiClient.post("/auth/register/", {
        name: cleanName,
        email: cleanEmail,
        password,
      });
      const { user: userData, tokens } = res.data;
      if (tokens) {
        localStorage.setItem("access_token", tokens.access);
        localStorage.setItem("refresh_token", tokens.refresh);
      }
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      toast.success("Account created successfully!");
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Registration failed. Please check your details.";
      toast.error(msg);
      return false;
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      const redirectUrl = window.location.origin + "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        toast.error(error.message || "Failed to launch Google Sign-In");
        return false;
      }
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Google Sign-In error occurred");
      return false;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    toast.success("Signed out successfully.");
  };

  const updateUser = useCallback((updated: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function useUser() {
  const { user } = useAuth();
  return user;
}
