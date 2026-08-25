import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Download, X, ZoomIn } from "lucide-react";
import { motion } from "motion/react";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

export default function ImageViewerModal({
  isOpen,
  onClose,
  imageUrl,
  title = "Receipt Preview",
  subtitle,
}: ImageViewerModalProps) {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `receipt-${new Date().toISOString().slice(0, 10)}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[680px] p-0 overflow-hidden bg-background border shadow-2xl rounded-2xl">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ZoomIn size={16} className="text-primary" /> {title}
            </DialogTitle>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X size={16} />
          </Button>
        </DialogHeader>

        <div className="p-4 flex items-center justify-center bg-muted/20 min-h-[300px] max-h-[70vh] overflow-auto">
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            src={imageUrl}
            alt={title}
            className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg shadow-md border"
          />
        </div>

        <DialogFooter className="p-3 border-t bg-muted/10 flex items-center justify-between sm:justify-between w-full">
          <span className="text-xs text-muted-foreground">Max File Size: 100 KB • Validated</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownload}>
              <Download size={13} /> Download Receipt
            </Button>
            <Button variant="secondary" size="sm" className="text-xs" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
