import { useState } from "react";
import type { Transaction, TransactionType } from "@/lib/mock-data.ts";
import type { NewTransaction } from "@/hooks/use-transactions.ts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { toast } from "sonner";
import { format } from "date-fns";
import ImageViewerModal from "@/components/image-viewer-modal.tsx";
import { ArrowRightLeft, Info, ArrowRight, ShieldCheck } from "lucide-react";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";
import { IconOrLogoDisplay } from "@/pages/categories/page.tsx";

type Props = {
  transaction?: Transaction | null;
  defaultType?: TransactionType;
  onSave: (data: NewTransaction, existing: Transaction | null) => void;
  onClose: () => void;
};

export default function TransactionFormModal({ transaction: t, defaultType, onSave, onClose }: Props) {
  const { categories: allCategories, incomeSources, paymentMethods } = useTransactions();
  const isEdit = !!t;

  const [type, setType] = useState<TransactionType>(t?.type ?? defaultType ?? "expense");
  const [title, setTitle] = useState(t?.title ?? "");
  const [amount, setAmount] = useState(t ? String(t.amount) : "");
  const [date, setDate] = useState(t?.date ?? format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState(t?.time ?? format(new Date(), "HH:mm"));
  const [categoryId, setCategoryId] = useState(t?.categoryId ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(t?.paymentMethodId ?? "");
  const [toPaymentMethodId, setToPaymentMethodId] = useState(
    t?.tags?.find((tag) => tag.startsWith("to:"))?.replace("to:", "") || paymentMethods[1]?.id || ""
  );
  const [sourceId, setSourceId] = useState(t?.sourceId ?? "");
  const [notes, setNotes] = useState(t?.notes ?? "");
  const [status, setStatus] = useState<Transaction["status"]>(t?.status ?? "completed");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast.error("Invalid file format. Please upload PNG, JPG or JPEG.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          let quality = 0.85;
          let compressed = canvas.toDataURL("image/jpeg", quality);

          // Ensure under 100 KB
          while (compressed.length * 0.75 > 100 * 1024 && quality > 0.3) {
            quality -= 0.1;
            compressed = canvas.toDataURL("image/jpeg", quality);
          }

          const finalSizeKb = Math.round((compressed.length * 0.75) / 1024);
          setReceiptUrl(compressed);
          toast.success(`Receipt attached & compressed (${finalSizeKb} KB ≤ 100 KB)!`);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleTypeChange = (v: TransactionType) => {
    setType(v);
    if (v === "transfer") {
      setCategoryId(allCategories.find((c) => c.type === "transfer")?.id || "cat-15");
      if (!title) setTitle("Account Transfer");
    } else if (v === "income") {
      setCategoryId(allCategories.find((c) => c.type === "income")?.id || "cat-1");
      if (!sourceId) setSourceId(incomeSources[0]?.id || "");
    } else {
      setCategoryId(allCategories.find((c) => c.type === "expense")?.id || "cat-6");
      setSourceId("");
    }
  };

  const handleSave = () => {
    const defaultTitle =
      type === "transfer"
        ? `Transfer to ${paymentMethods.find((p) => p.id === toPaymentMethodId)?.name || "Account"}`
        : type === "income"
        ? `${incomeSources.find((s) => s.id === sourceId)?.name || "Income"}`
        : "Expense";

    const finalTitle = title.trim() || defaultTitle;
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    if (!date) {
      toast.error("Please select a valid date");
      return;
    }

    const tags: string[] = [];
    if (type === "transfer" && toPaymentMethodId) {
      tags.push(`to:${toPaymentMethodId}`);
    }

    let effectiveCatId = categoryId;
    if (type === "income") {
      effectiveCatId = sourceId || categoryId || incomeSources[0]?.id || allCategories.find((c) => c.type === "income")?.id || "";
    } else if (type === "transfer") {
      effectiveCatId = categoryId || allCategories.find((c) => c.type === "transfer")?.id || "";
    } else {
      effectiveCatId = categoryId || allCategories.find((c) => c.type === "expense")?.id || "";
    }

    const effectiveMethodId = paymentMethodId || paymentMethods[0]?.id || "";

    const data: NewTransaction = {
      type,
      title: finalTitle,
      amount: parsedAmount,
      date,
      time,
      categoryId: effectiveCatId,
      paymentMethodId: effectiveMethodId,
      sourceId: type === "income" ? (sourceId || effectiveCatId) : undefined,
      notes: notes.trim() || undefined,
      status,
      tags,
    };

    onSave(data, t ?? null);
    toast.success(isEdit ? "Transaction updated in database!" : "Transaction saved successfully!");
    onClose();
  };

  const cats = allCategories.filter((c) => c.type === type || c.type === "all");

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isEdit ? "Edit Transaction Record" : "Add New Transaction Record"}
            </DialogTitle>
          </DialogHeader>

          {/* Type Selector Tabs */}
          {!isEdit && (
            <Tabs value={type} onValueChange={(v) => handleTypeChange(v as TransactionType)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="expense" className="text-xs">Expense (-)</TabsTrigger>
                <TabsTrigger value="income" className="text-xs">Income (+)</TabsTrigger>
                <TabsTrigger value="transfer" className="text-xs">Transfer (0)</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Transfer Info Box */}
          {type === "transfer" && (
            <div className="p-3 rounded-lg bg-[var(--color-transfer-bg)] text-[var(--color-transfer)] text-xs flex items-start gap-2 border border-[var(--color-transfer)]/20">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Sum Move:</strong> Reallocating money across accounts (e.g. Bank to eSewa) creates 0 net change to total balance.
              </span>
            </div>
          )}

          {/* Title / Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {type === "expense" ? "Expense Description *" : type === "income" ? "Income Description *" : "Transfer Description *"}
            </Label>
            <Input
              placeholder={
                type === "expense"
                  ? "e.g. College Semester Fees / Groceries"
                  : type === "income"
                  ? "e.g. August Salary / Math Coaching / Freelance Web"
                  : "e.g. Loaded eSewa from Bank Account"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs">Amount (₹) <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-base font-bold tabular-nums h-9"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          {/* EXPENSE SPECIFIC FIELDS */}
          {type === "expense" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Expense Category <span className="text-destructive">*</span></Label>
                <Select value={categoryId || cats[0]?.id} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <IconOrLogoDisplay icon={c.icon} className="w-4 h-4" />
                          <span>{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Payment Method / Paid From <span className="text-destructive">*</span></Label>
                <Select value={paymentMethodId || paymentMethods[0]?.id} onValueChange={setPaymentMethodId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select payment method" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <IconOrLogoDisplay icon={m.icon} className="w-4 h-4" />
                          <span>{m.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* INCOME SPECIFIC FIELDS */}
          {type === "income" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Source of Income <span className="text-destructive">*</span></Label>
                <Select value={sourceId || incomeSources[0]?.id} onValueChange={setSourceId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select income source" /></SelectTrigger>
                  <SelectContent>
                    {incomeSources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <IconOrLogoDisplay icon={s.icon} className="w-4 h-4" />
                          <span>{s.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Deposited In / Saved in Account <span className="text-destructive">*</span></Label>
                <Select value={paymentMethodId || paymentMethods[0]?.id} onValueChange={setPaymentMethodId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select deposit account" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <IconOrLogoDisplay icon={m.icon} className="w-4 h-4" />
                          <span>{m.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* TRANSFER SPECIFIC FIELDS */}
          {type === "transfer" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">From Source Account <span className="text-destructive">*</span></Label>
                <Select value={paymentMethodId || paymentMethods[0]?.id} onValueChange={setPaymentMethodId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="From account" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <IconOrLogoDisplay icon={m.icon} className="w-4 h-4" />
                          <span>{m.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">To Destination Account <span className="text-destructive">*</span></Label>
                <Select value={toPaymentMethodId || paymentMethods[1]?.id} onValueChange={setToPaymentMethodId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="To account" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <IconOrLogoDisplay icon={m.icon} className="w-4 h-4" />
                          <span>{m.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Receipt Image Upload (Max 100 KB) */}
          <div className="space-y-1.5">
            <Label className="flex items-center justify-between text-xs">
              <span>Receipt / Bill Image (Optional)</span>
              <span className="text-muted-foreground font-normal">PNG, JPG ≤ 100 KB</span>
            </Label>
            {receiptUrl ? (
              <div className="relative rounded-lg border p-2 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={receiptUrl}
                    alt="Receipt"
                    className="w-12 h-12 object-cover rounded-md border"
                  />
                  <div>
                    <p className="text-xs font-semibold">Receipt Attached</p>
                    <p className="text-[11px] text-muted-foreground">Optimized & ready</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setShowReceiptViewer(true)}
                  >
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive h-7"
                    onClick={() => setReceiptUrl("")}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-3 text-center hover:bg-muted/10 transition-colors">
                <input
                  type="file"
                  id="receipt-file-input"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <label
                  htmlFor="receipt-file-input"
                  className="cursor-pointer text-xs flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <span className="font-semibold text-primary">Upload Bill / Receipt</span>
                  <span className="text-[10px]">JPG, PNG under 100 KB (Auto-compressed)</span>
                </label>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes / Remarks (Optional)</Label>
            <Textarea
              placeholder="Additional transaction context, reference #, or details…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-16 text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="ghost" onClick={onClose} className="text-xs">Cancel</Button>
            <Button onClick={handleSave} className="text-xs">
              {isEdit ? "Update Transaction" : "Save Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-screen Receipt Image Viewer */}
      {receiptUrl && (
        <ImageViewerModal
          isOpen={showReceiptViewer}
          onClose={() => setShowReceiptViewer(false)}
          imageUrl={receiptUrl}
          title={`${title || "Receipt"} Attachment`}
        />
      )}
    </>
  );
}
