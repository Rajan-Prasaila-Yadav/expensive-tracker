import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Download, Smartphone, Laptop, CheckCircle2, Share, PlusSquare, X } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          toast.success("FinanceOS is installing on your device!");
          onOpenChange(false);
        }
      } catch {
        toast.error("Installation prompt could not be launched.");
      }
    } else if (isIOS) {
      toast.info("Follow the on-screen steps below to add FinanceOS to your iPhone / iPad home screen.");
    } else {
      toast.success("FinanceOS is ready to install! Look for the install icon in your browser's address bar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-5 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">Install FinanceOS App</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center text-center py-3 space-y-4">
          {/* App Icon Banner */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 shadow-xl shadow-primary/25 flex items-center justify-center p-3">
              <img src="/icon.svg" alt="FinanceOS" className="w-full h-full object-contain" />
            </div>
            <span className="absolute -bottom-2 -right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              PWA v1.0
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground">FinanceOS</h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-[280px]">
              Personal Finance, Expense Tracker & Dynamic Money Manager
            </p>
          </div>

          {isStandalone ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 font-medium flex items-center gap-2">
              <CheckCircle2 size={16} /> FinanceOS is already installed and running as a native app!
            </div>
          ) : isIOS ? (
            <div className="w-full text-left p-3.5 bg-muted/50 rounded-xl border space-y-2 text-xs">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Smartphone size={14} className="text-primary" /> Install on iOS / Safari:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
                <li>Tap the <Share size={12} className="inline text-primary mx-0.5" /> <strong>Share</strong> button in Safari toolbar</li>
                <li>Scroll down and tap <PlusSquare size={12} className="inline text-primary mx-0.5" /> <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong> in the top right corner</li>
              </ol>
            </div>
          ) : (
            <div className="w-full space-y-2.5">
              <Button
                onClick={handleInstallClick}
                className="w-full gap-2 h-10 text-xs font-semibold cursor-pointer shadow-md"
              >
                <Download size={15} /> Download & Install App
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Installs instantly with zero storage footprint. Works offline and in full-screen.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
