import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { toast } from "sonner";
import apiClient from "@/lib/api-client.ts";
import { supabase } from "@/lib/supabase.ts";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email address");
      return;
    }
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    let supabaseSent = false;
    // 1. Supabase Auth reset dispatch (Direct cloud email service)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (!error) {
        supabaseSent = true;
      }
    } catch {
      // Supabase error
    }

    // 2. Django REST Framework backend reset dispatch
    try {
      const res = await apiClient.post("/auth/forgot-password/", {
        email: cleanEmail,
      });

      toast.success(res.data?.message || "Password reset instructions sent to your email!");
      setSubmitted(true);
    } catch (err: any) {
      if (supabaseSent) {
        toast.success("Password reset link sent to your email via Supabase!");
        setSubmitted(true);
      } else {
        const msg = err.response?.data?.error || "Failed to send reset email. Please verify your email address.";
        toast.error(msg);
      }
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
          {!submitted ? (
            <>
              <div>
                <h1 className="text-2xl font-bold">Forgot password?</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Enter your registered email and we will send you a 6-digit verification code to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2 cursor-pointer" disabled={loading}>
                  {loading ? "Sending verification code…" : <><span>Send Verification Code</span><ArrowRight size={16} /></>}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Check your inbox</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>
                </p>
              </div>

              <Button
                onClick={() => navigate(`/verify-otp?mode=reset&email=${encodeURIComponent(email)}`)}
                className="w-full gap-2 cursor-pointer"
              >
                <span>Enter Verification Code</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          )}

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
