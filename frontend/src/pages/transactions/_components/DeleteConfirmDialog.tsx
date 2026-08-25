import type { Transaction } from "@/lib/mock-data.ts";
import { formatCurrency } from "@/lib/mock-data.ts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { AlertTriangle } from "lucide-react";

type Props = {
  transaction: Transaction;
  onConfirm: () => void;
  onClose: () => void;
};

export default function DeleteConfirmDialog({ transaction: t, onConfirm, onClose }: Props) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Transaction</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center py-4 text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[var(--color-expense-bg)] flex items-center justify-center">
            <AlertTriangle size={28} className="text-[var(--color-expense)]" />
          </div>
          <p className="font-medium">Are you sure?</p>
          <p className="text-sm text-muted-foreground">
            You are about to delete <strong>{t.title}</strong> ({formatCurrency(t.amount)}). This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
