import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth.ts";

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    const success = await signIn(form.email, form.password);
    setLoading(false);
    if (success) {
      navigate("/");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-[var(--color-sidebar)] p-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-sidebar-primary)] flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">FinanceOS</span>
        </div>
        <div>
          <p className="text-4xl font-bold text-white leading-tight mb-4">
            Your money,<br />fully in control.
          </p>
          <p className="text-[var(--color-sidebar-foreground)] opacity-60 text-sm">
            Track income, expenses, budgets, and get powerful financial insights — powered by Django, Supabase & PostgreSQL.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Architecture", value: "Django 5" },
            { label: "Database", value: "PostgreSQL" },
            { label: "Authentication", value: "Google & JWT" },
            { label: "Security", value: "Bcrypt & Audit" },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--color-sidebar-accent)] rounded-xl p-4">
              <p className="text-white font-bold text-xl">{s.value}</p>
              <p className="text-[var(--color-sidebar-foreground)] opacity-60 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Wallet size={18} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">FinanceOS</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in with your Google account or email</p>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 py-5 rounded-xl border border-border bg-card hover:bg-muted/50 cursor-pointer font-medium shadow-sm transition-all text-sm"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {googleLoading ? "Connecting to Google…" : "Continue with Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2 cursor-pointer" disabled={loading}>
              {loading ? "Signing in…" : <><span>Sign In</span><ArrowRight size={16} /></>}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don{"'"}t have an account?{" "}
            <Link to="/sign-up" className="text-primary font-medium hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
