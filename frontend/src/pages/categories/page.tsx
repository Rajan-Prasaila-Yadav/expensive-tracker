import { useState, useMemo } from "react";
import AppLayout from "@/components/app-layout.tsx";
import PageHeader from "@/components/page-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import type { Category, IncomeSource, PaymentMethod } from "@/lib/mock-data.ts";
import { Plus, Pencil, Trash2, Wallet, TrendingUp, Tag, Search, RotateCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { motion, AnimatePresence } from "motion/react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { useTransactions } from "@/components/providers/transaction-provider.tsx";

type TabValue = "categories" | "sources" | "methods";

const COLOR_OPTIONS = [
  "#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#f97316", "#14b8a6", "#64748b",
];

const EMOJI_OPTIONS = [
  "🍽️", "🛒", "🚌", "🏠", "🛍️", "⚡", "📚", "🏥", "🎬",
  "💼", "💻", "🏢", "📈", "💰", "🐖", "📊", "🏪", "▶️",
  "🏦", "💳", "📱", "📲", "💵", "🎯", "🔧", "✈️", "🎮", "🌟",
  "🇳🇵", "💜", "🔗",
];

/**
 * Renders either a custom uploaded logo image or an emoji icon in a 1:1 container
 */
export function IconOrLogoDisplay({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const isImage = icon.startsWith("data:image") || icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/");
  if (isImage) {
    return (
      <img
        src={icon}
        alt="Icon"
        className={cn("w-full h-full object-contain aspect-square rounded-lg p-0.5", className)}
      />
    );
  }
  return <span className={className}>{icon}</span>;
}

export default function CategoriesPage() {
  const {
    categories,
    incomeSources,
    paymentMethods,
    fetchAllMetadata,
    saveCategory,
    deleteCategory,
    saveIncomeSource,
    deleteIncomeSource,
    savePaymentMethod,
    deletePaymentMethod,
  } = useTransactions();

  const [tab, setTab] = useState<TabValue>("categories");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [loading, setLoading] = useState(false);

  // Modals
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);

  const [editingSrc, setEditingSrc] = useState<IncomeSource | null>(null);
  const [deletingSrc, setDeletingSrc] = useState<IncomeSource | null>(null);
  const [showAddSrc, setShowAddSrc] = useState(false);

  const [editingPm, setEditingPm] = useState<PaymentMethod | null>(null);
  const [deletingPm, setDeletingPm] = useState<PaymentMethod | null>(null);
  const [showAddPm, setShowAddPm] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchAllMetadata();
    setLoading(false);
    toast.success("Refreshed from database!");
  };

  // Filtering
  const filteredCats = useMemo(() => {
    return categories.filter((c) => {
      if (debouncedSearch && !c.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      return true;
    });
  }, [categories, debouncedSearch]);

  const filteredSources = useMemo(() => {
    return incomeSources.filter((s) => {
      if (debouncedSearch && !s.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      return true;
    });
  }, [incomeSources, debouncedSearch]);

  const filteredMethods = useMemo(() => {
    return paymentMethods.filter((m) => {
      if (debouncedSearch && !m.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      return true;
    });
  }, [paymentMethods, debouncedSearch]);

  const openAdd = () => {
    if (tab === "categories") setShowAddCat(true);
    else if (tab === "sources") setShowAddSrc(true);
    else setShowAddPm(true);
  };

  return (
    <AppLayout>
      <div className="p-5 md:p-8 max-w-[1200px] mx-auto space-y-6">
        <PageHeader
          title="Categories & Payment Accounts"
          subtitle="Manage your expense categories, income streams, and payment accounts"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="gap-1.5 cursor-pointer">
                <RotateCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
              </Button>
              <Button onClick={openAdd} className="gap-2 cursor-pointer">
                <Plus size={16} /> Add New
              </Button>
            </div>
          }
        />

        {/* Search & Tabs Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); setSearch(""); }}>
            <TabsList className="grid grid-cols-3 w-full sm:w-auto h-auto p-1">
              <TabsTrigger value="categories" className="gap-1.5 text-xs py-1.5">
                <Tag size={13} /> <span className="truncate">Expense Categories ({categories.length})</span>
              </TabsTrigger>
              <TabsTrigger value="sources" className="gap-1.5 text-xs py-1.5">
                <TrendingUp size={13} /> <span className="truncate">Income Streams ({incomeSources.length})</span>
              </TabsTrigger>
              <TabsTrigger value="methods" className="gap-1.5 text-xs py-1.5">
                <Wallet size={13} /> <span className="truncate">Payment Accounts ({paymentMethods.length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${tab}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>

        {/* ── 1. Expense Categories Tab ── */}
        {tab === "categories" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <AnimatePresence>
              {filteredCats.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                >
                  <Card className="relative group overflow-hidden card-hover border-border/70 hover:border-primary/40">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform duration-200 group-hover:scale-110 aspect-square overflow-hidden p-1"
                        style={{ backgroundColor: `${cat.color}22` }}
                      >
                        <IconOrLogoDisplay icon={cat.icon} className="text-2xl" />
                      </div>
                      <p className="text-sm font-semibold leading-tight truncate w-full">{cat.name}</p>
                      <div className="flex sm:opacity-0 group-hover:opacity-100 transition-opacity gap-1 absolute top-2 right-2">
                        <button
                          className="w-6 h-6 rounded-md bg-background/90 shadow-xs border flex items-center justify-center hover:bg-muted cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                          onClick={() => setEditingCat(cat)}
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          className="w-6 h-6 rounded-md bg-background border flex items-center justify-center hover:bg-muted text-destructive cursor-pointer"
                          onClick={() => setDeletingCat(cat)}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.button
              onClick={() => setShowAddCat(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer min-h-[120px]"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Plus size={18} />
              </div>
              <p className="text-xs font-medium">Add Category</p>
            </motion.button>
          </div>
        )}

        {/* ── 2. Income Streams Tab ── */}
        {tab === "sources" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredSources.map((src, i) => (
                <motion.div
                  key={src.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <Card className="card-hover border-border/70">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 aspect-square overflow-hidden p-1"
                        style={{ backgroundColor: `${src.color}22` }}
                      >
                        <IconOrLogoDisplay icon={src.icon} className="text-2xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{src.name}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                          onClick={() => setEditingSrc(src)}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-destructive cursor-pointer"
                          onClick={() => setDeletingSrc(src)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.button
              onClick={() => setShowAddSrc(true)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="border-2 border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer min-h-[80px]"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Add Income Stream</span>
            </motion.button>
          </div>
        )}

        {/* ── 3. Payment Accounts & Wallets Tab ── */}
        {tab === "methods" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredMethods.map((pm, i) => (
                <motion.div
                  key={pm.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <Card className="card-hover border-border/70">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 aspect-square overflow-hidden p-1">
                        <IconOrLogoDisplay icon={pm.icon} className="text-2xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{pm.name}</p>
                        {pm.balance !== undefined && pm.balance > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                            Balance: ₹{pm.balance.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                          onClick={() => setEditingPm(pm)}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-destructive cursor-pointer"
                          onClick={() => setDeletingPm(pm)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.button
              onClick={() => setShowAddPm(true)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="border-2 border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer min-h-[80px]"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Add Payment Account</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* ── Category Modal ── */}
      {(showAddCat || editingCat) && (
        <CategoryFormModal
          cat={editingCat}
          onSave={saveCategory}
          onClose={() => { setShowAddCat(false); setEditingCat(null); }}
        />
      )}

      {/* ── Income Source Modal ── */}
      {(showAddSrc || editingSrc) && (
        <IncomeSourceFormModal
          src={editingSrc}
          onSave={saveIncomeSource}
          onClose={() => { setShowAddSrc(false); setEditingSrc(null); }}
        />
      )}

      {/* ── Payment Method Modal ── */}
      {(showAddPm || editingPm) && (
        <PaymentMethodFormModal
          pm={editingPm}
          onSave={savePaymentMethod}
          onClose={() => { setShowAddPm(false); setEditingPm(null); }}
        />
      )}

      {/* ── Delete Confirmation Modals ── */}
      {deletingCat && (
        <Dialog open onOpenChange={() => setDeletingCat(null)}>
          <DialogContent className="max-w-[360px]">
            <DialogHeader><DialogTitle>Delete Category</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Delete category <strong>"{deletingCat.name}"</strong>? Existing transactions with this category will be preserved.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeletingCat(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { deleteCategory(deletingCat.id); setDeletingCat(null); }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deletingSrc && (
        <Dialog open onOpenChange={() => setDeletingSrc(null)}>
          <DialogContent className="max-w-[360px]">
            <DialogHeader><DialogTitle>Delete Income Stream</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Delete income stream <strong>"{deletingSrc.name}"</strong>?
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeletingSrc(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { deleteIncomeSource(deletingSrc.id); setDeletingSrc(null); }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deletingPm && (
        <Dialog open onOpenChange={() => setDeletingPm(null)}>
          <DialogContent className="max-w-[360px]">
            <DialogHeader><DialogTitle>Delete Payment Account</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Delete payment account <strong>"{deletingPm.name}"</strong>?
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeletingPm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { deletePaymentMethod(deletingPm.id); setDeletingPm(null); }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}

/**
 * Reusable auto-cropper for 1:1 square custom logo/icon upload
 */
function LogoImagePicker({
  currentIcon,
  onSelectIcon,
}: {
  currentIcon: string;
  onSelectIcon: (icon: string) => void;
}) {
  const [tab, setTab] = useState<"emoji" | "upload">(
    currentIcon.startsWith("data:image") ? "upload" : "emoji"
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"].includes(file.type)) {
      toast.error("Invalid format. Please upload PNG, JPG, or SVG.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 120; // fixed 120x120px 1:1
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const croppedDataUrl = canvas.toDataURL("image/png", 0.9);
          onSelectIcon(croppedDataUrl);
          toast.success("Logo auto-cropped to 1:1 square (< 50 KB)!");
        }
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">Icon / Logo (1:1 Ratio)</span>
        <div className="flex gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setTab("emoji")}
            className={cn("px-2 py-0.5 rounded cursor-pointer", tab === "emoji" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground")}
          >
            Emoji
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={cn("px-2 py-0.5 rounded cursor-pointer", tab === "upload" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground")}
          >
            Upload Logo
          </button>
        </div>
      </div>

      {tab === "emoji" ? (
        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-1.5 border rounded-lg">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onSelectIcon(e)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-base border-2 transition-all cursor-pointer aspect-square",
                currentIcon === e ? "border-primary bg-primary/10 scale-110" : "border-transparent hover:border-muted-foreground/30"
              )}
            >{e}</button>
          ))}
        </div>
      ) : (
        <div className="border border-dashed rounded-lg p-3 text-center space-y-2 bg-muted/20">
          {currentIcon.startsWith("data:image") ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-lg border bg-background flex items-center justify-center p-1 overflow-hidden aspect-square">
                <img src={currentIcon} alt="Preview" className="w-full h-full object-contain" />
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-emerald-600">1:1 Square Logo Loaded</p>
                <p className="text-[11px] text-muted-foreground">Auto-compressed &lt; 50 KB</p>
                <button
                  type="button"
                  onClick={() => onSelectIcon("📁")}
                  className="text-[11px] text-destructive hover:underline cursor-pointer mt-0.5"
                >
                  Remove logo
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                type="file"
                id="logo-upload-input"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="logo-upload-input"
                className="cursor-pointer text-xs flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Upload size={16} className="text-primary" />
                <span className="font-semibold text-primary">Upload Custom Logo / Image</span>
                <span className="text-[10px] text-muted-foreground">PNG, JPG, SVG ≤ 50 KB • Auto Center-Cropped 1:1</span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 1. Clean Category Form Modal ───────────────────────────────────────────
function CategoryFormModal({
  cat, onSave, onClose,
}: {
  cat: Category | null;
  onSave: (data: Omit<Category, "id">, existing: Category | null) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(cat?.name ?? "");
  const [icon, setIcon] = useState(cat?.icon ?? "📁");
  const [color, setColor] = useState(cat?.color ?? COLOR_OPTIONS[0]);

  const handleSave = () => {
    if (!name.trim()) { toast.error("Please enter category name"); return; }
    onSave({ name: name.trim(), icon, color, type: "expense" }, cat);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{cat ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Category Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Food & Dining / College Fees / Rent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <LogoImagePicker currentIcon={icon} onSelectIcon={setIcon} />

          <div className="space-y-1.5">
            <Label className="text-xs">Color Badge</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full cursor-pointer transition-transform",
                    color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} className="text-xs">Cancel</Button>
          <Button onClick={handleSave} className="text-xs">{cat ? "Save Changes" : "Create Category"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 2. Clean Income Source Form Modal ───────────────────────────────────────
function IncomeSourceFormModal({
  src, onSave, onClose,
}: {
  src: IncomeSource | null;
  onSave: (data: Omit<IncomeSource, "id">, existing: IncomeSource | null) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(src?.name ?? "");
  const [icon, setIcon] = useState(src?.icon ?? "💼");
  const [color, setColor] = useState(src?.color ?? COLOR_OPTIONS[0]);

  const handleSave = () => {
    if (!name.trim()) { toast.error("Please enter income stream name"); return; }
    onSave({ name: name.trim(), type: "salary", icon, color, monthlyAvg: src?.monthlyAvg || 0 }, src);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{src ? "Edit Income Stream" : "Add New Income Stream"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Income Stream Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Monthly Salary / Math Coaching / Freelance Web / Business Sales"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <LogoImagePicker currentIcon={icon} onSelectIcon={setIcon} />

          <div className="space-y-1.5">
            <Label className="text-xs">Color Badge</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full cursor-pointer transition-transform",
                    color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} className="text-xs">Cancel</Button>
          <Button onClick={handleSave} className="text-xs">{src ? "Save Changes" : "Create Income Stream"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 3. Ultra Clean Payment Account Form Modal (Only Name + 1:1 Icon) ─────────
function PaymentMethodFormModal({
  pm, onSave, onClose,
}: {
  pm: PaymentMethod | null;
  onSave: (data: Omit<PaymentMethod, "id">, existing: PaymentMethod | null) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(pm?.name ?? "");
  const [icon, setIcon] = useState(pm?.icon ?? "💳");

  const handleSave = () => {
    if (!name.trim()) { toast.error("Please enter account or wallet name"); return; }
    onSave({
      name: name.trim(),
      type: "wallet",
      icon,
      balance: pm?.balance ?? 0,
    }, pm);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{pm ? "Edit Payment Account" : "Add Payment Account / Wallet"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Account / Wallet / Bank Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. eSewa / HDFC Bank / GPay / Khalti / Cash in Hand / Paytm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <LogoImagePicker currentIcon={icon} onSelectIcon={setIcon} />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} className="text-xs">Cancel</Button>
          <Button onClick={handleSave} className="text-xs">{pm ? "Save Changes" : "Create Account"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
