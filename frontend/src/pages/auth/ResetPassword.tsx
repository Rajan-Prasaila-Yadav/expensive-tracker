import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, Eye, EyeOff, Check, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { toast } from "sonner";
import apiClient from "@/lib/api-client.ts";

export default function ResetPassword() {
  const navigate = useNavigate();
  const query = new URLSearchParams(window.location.search);
  const email = query.get("email") || "";
  const code = query.get("code") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasLength = password.length >= 6;
  const passwordsMatch = password && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter a new password");
      return;
    }
    if (!hasLength) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }
    if (!email || !code) {
      toast.error("Missing verification token. Please start from the forgot password page.");
      navigate("/forgot-password");
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post("/auth/reset-password/", {
        email,
        otp: code,
        newPassword: password,
      });

      toast.success(res.data?.message || "Password successfully updated! Please sign in.");
      navigate("/sign-in");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to reset password. Please request a new verification code.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <Wallet size={20} />
          </div>
          <span className="font-bold text-xl">FinanceOS</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Set new password</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Please choose a secure password with at least 6 characters for <strong className="text-foreground">{email}</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Validation indicators */}
            <div className="text-xs space-y-1.5 pt-1 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasLength ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  <Check size={10} />
                </div>
                <span>At least 6 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passwordsMatch ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  <Check size={10} />
                </div>
                <span>Passwords match</span>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2 cursor-pointer mt-2" disabled={loading}>
              {loading ? "Updating password in PostgreSQL…" : (
                <>
                  <span>Save Password & Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center">
            <Link
              to="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
