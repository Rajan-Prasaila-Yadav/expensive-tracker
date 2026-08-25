import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import apiClient from "@/lib/api-client.ts";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const query = new URLSearchParams(window.location.search);
  const isReset = query.get("mode") === "reset";
  const userEmail = query.get("email") || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 5) refs[index + 1].current?.focus();
  };

  const handleKey = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) refs[index - 1].current?.focus();
  };

  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Please enter the complete 6-digit verification code from your email");
      return;
    }
    setLoading(true);

    try {
      const res = await apiClient.post("/auth/verify-otp/", {
        email: userEmail,
        otp: code,
      });

      toast.success(res.data?.message || "Code verified successfully!");
      if (isReset) {
        navigate(`/reset-password?email=${encodeURIComponent(userEmail)}&code=${encodeURIComponent(code)}`);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Invalid or expired verification code. Please check your email.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userEmail) {
      toast.error("Missing email address");
      return;
    }
    setResending(true);
    try {
      const res = await apiClient.post("/auth/forgot-password/", { email: userEmail });
      toast.success(res.data?.message || "A new 6-digit code has been dispatched to your email!");
      setOtp(["", "", "", "", "", ""]);
      refs[0].current?.focus();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to resend verification code.";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[380px] space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Wallet size={18} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">FinanceOS</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Verify your code</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Enter the 6-digit verification code sent to <strong>{userEmail || "your email"}</strong>
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={refs[i]}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none transition-colors"
            />
          ))}
        </div>

        <Button className="w-full cursor-pointer" onClick={handleSubmit} disabled={loading}>
          {loading ? "Verifying code…" : "Verify & Continue"}
        </Button>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Didn't receive the code?</span>
          <button
            type="button"
            className="text-primary font-medium hover:underline cursor-pointer disabled:opacity-50"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "Sending…" : "Resend Code"}
          </button>
        </div>

        <p className="text-center text-sm pt-2">
          <Link to="/sign-in" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
