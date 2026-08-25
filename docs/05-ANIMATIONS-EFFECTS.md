# ✨ Animations & Effects — Complete Analysis

> Every animation, transition, hover effect, and micro-interaction in the application.

---

## 1. Animation Library

**Motion (Framer Motion)** v12.43.0 — Used for declarative animations via `motion/react` import.

---

## 2. Page-Level Entrance Animations

### 2.1 Staggered Card Animations (Home, Budget, Analytics)

```tsx
// Each card has increasing delay
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" }}
/>
```

| Page | Animation | Duration | Stagger Delay |
|------|----------|----------|---------------|
| Home summary cards | Fade up (y: 16→0) | 0.4s | `i * 0.07s` |
| Home header | Fade up (y: -8→0) | 0.4s | none |
| Home charts row | Fade in | 0.5s | 0.3s delay |
| Home budget section | Fade up (y: 12→0) | 0.5s | 0.45s delay |
| Budget summary cards | Fade up (y: 12→0) | 0.3s | `i * 0.05s` |
| Budget grid cards | Fade up (y: 12→0) | 0.25s | `i * 0.04s` |
| Analytics KPIs | Fade up (y: 14→0) | 0.35s | `i * 0.06s` |
| Analytics controls | Fade up (y: -8→0) | 0.35s | none |
| Analytics chart | Fade up (y: 12→0) | 0.4s | 0.25s delay |
| Reports summary | Fade up (y: 12→0) | 0.3s | `i * 0.05s` |
| Profile sections | Fade up (y: 12→0) | 0.35s | 0.05–0.25s increasing |
| Categories cards | Fade + Scale (scale: 0.95→1) | 0.2s | `i * 0.03s` |
| Sources/Methods | Fade up (y: 10→0) | 0.2s | `i * 0.04s` |
| Audit Logs sections | Various fade-up | 0.3–0.35s | 0.05–0.15s |

### 2.2 Page Header Animation (Notifications, Audit Logs, Settings)

```tsx
<motion.h1
  initial={{ opacity: 0, y: -8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
/>
```

---

## 3. Navigation Animations

### 3.1 Sidebar Active Indicator (Shared Layout Animation)

```tsx
<motion.span
  layoutId="sidebar-active-indicator"
  className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary"
  transition={{ type: "spring", stiffness: 350, damping: 30 }}
/>
```

**Behavior:** The active dot slides between nav items using Framer Motion's `layoutId` — creating a smooth spring animation when navigating between pages.

### 3.2 Bottom Nav Active Pill (Shared Layout Animation)

```tsx
<motion.div
  layoutId="bottom-nav-active-pill"
  className="absolute inset-0 bg-primary/10 rounded-xl"
  transition={{ type: "spring", stiffness: 400, damping: 30 }}
/>
```

**Behavior:** The background pill slides between active bottom nav items.

### 3.3 Bottom Nav Icon Scale

```tsx
<motion.div
  animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -1 : 0 }}
  transition={{ type: "spring", stiffness: 350, damping: 25 }}
/>
```

---

## 4. Theme Toggle Animation

```tsx
<AnimatePresence mode="wait" initial={false}>
  {isDark ? (
    <motion.div key="moon"
      initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
      transition={{ duration: 0.2 }}
    />
  ) : (
    <motion.div key="sun"
      initial={{ scale: 0.5, rotate: 90, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      exit={{ scale: 0.5, rotate: -90, opacity: 0 }}
      transition={{ duration: 0.2 }}
    />
  )}
</AnimatePresence>
```

**Behavior:** Sun and Moon icons swap with a 90° rotation + scale animation. Exit rotates in opposite direction.

---

## 5. CSS Hover Effects & Micro-Interactions

### 5.1 Card Hover (`.card-hover`)

```css
.card-hover {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.12),
              0 0 15px -2px color-mix(in srgb, var(--color-primary) 15%, transparent);
}
```

**Used on:** Budget cards, Category cards, Payment Method cards, Income Source cards, Transfer method cards.

### 5.2 Interactive Scale (`.interactive-scale`)

```css
.interactive-scale {
  transition: transform 0.12s ease-out, filter 0.15s ease;
}
.interactive-scale:hover { transform: translateY(-1px); }
.interactive-scale:active { transform: scale(0.97); }
```

### 5.3 Glow Hover (`.glow-hover`)

```css
.glow-hover {
  transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.2s ease;
}
.glow-hover:hover {
  border-color: color-mix(in srgb, var(--color-primary) 50%, transparent);
  box-shadow: 0 0 20px -4px color-mix(in srgb, var(--color-primary) 30%, transparent);
}
```

### 5.4 Glass Panel (`.glass-panel`)

```css
.glass-panel {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: color-mix(in srgb, var(--color-card) 88%, transparent);
  border: 1px solid var(--color-border);
}
```

---

## 6. Transaction Row Interactions

```tsx
<div className="
  hover:bg-muted/60 
  transition-all duration-200 
  cursor-pointer group 
  rounded-xl 
  border border-transparent 
  hover:border-border/60 
  hover:shadow-xs 
  active:scale-[0.995]
">
  {/* Icon scales on hover */}
  <div className="transition-transform duration-200 group-hover:scale-105">
    <TypeBadge />
  </div>
  
  {/* Actions appear on hover (desktop) */}
  <Button className="opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
</div>
```

**Effects:**
1. Background lightens on hover (`bg-muted/60`)
2. Border appears on hover (`border-border/60`)
3. Subtle shadow on hover (`shadow-xs`)
4. Type badge icon scales up 5%
5. Action buttons fade in (desktop only)
6. Slight scale down on active press (`scale-[0.995]`)

---

## 7. Sidebar Icon Interactions

```tsx
<Icon className="transition-transform duration-200 group-hover:scale-110" />
```

All sidebar navigation icons scale up 10% on hover.

### Sidebar Nav Item Hover
```tsx
className="hover:opacity-100 hover:bg-sidebar-accent hover:translate-x-0.5"
```

Items shift 2px right on hover, creating a "sliding in" effect.

---

## 8. Button Interactions

### 8.1 Logo Button
```tsx
<motion.div whileHover={{ scale: 1.08, rotate: 5 }} whileTap={{ scale: 0.95 }}>
```

### 8.2 "Add" Dashed Cards (Budget, Categories)
```tsx
<motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
```

### 8.3 Theme Toggle Button
```tsx
className="active:scale-95 transition-all"
```

### 8.4 Category/Source Edit/Delete Buttons
```tsx
className="hover:scale-105 active:scale-95 transition-transform"
```

---

## 9. AnimatePresence (Enter/Exit Animations)

### 9.1 Custom Date Range (Transactions, Transfers)
```tsx
<AnimatePresence>
  {showCustomRange && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    />
  )}
</AnimatePresence>
```

### 9.2 Budget Cards Grid
```tsx
<AnimatePresence>
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96 }}
    transition={{ duration: 0.25, delay: i * 0.04 }}
  />
</AnimatePresence>
```

### 9.3 Category Cards
```tsx
exit={{ opacity: 0, scale: 0.92 }}  // Categories shrink slightly on exit
```

### 9.4 Notification Items
```tsx
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: "auto" }}
exit={{ opacity: 0, height: 0, overflow: "hidden" }}
```

### 9.5 Profile Edit Form
```tsx
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: "auto" }}
/>
```

---

## 10. Continuous Animations

### 10.1 Notification Badge Pulse
```css
animate-pulse  /* Tailwind's built-in pulse animation */
```

Applied to:
- Sidebar notification count badge
- Home page notification dot
- Both use `bg-[var(--color-expense)]` red color

### 10.2 Notification Unread Indicator
```tsx
<span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
```
Static blue dot (no animation) for unread notifications in the notification list.

---

## 11. Toast Notification Animations

Powered by **Sonner** library:
- Slide in from bottom-right
- Auto-dismiss after configured duration (1.5s for theme toggle)
- Success: Green accent
- Error: Red accent
- Info: Blue accent

---

## 12. Chart Animations

### 12.1 Recharts Built-in
- Area charts have smooth `monotone` curve interpolation
- Active dots appear on hover (`activeDot={{ r: 4 }}`)
- Bar charts have rounded corners (`radius={[4,4,0,0]}`)
- Pie charts have `paddingAngle={2}` for gaps between segments

### 12.2 Budget Progress Bar
The budget progress bar width is set dynamically:
```tsx
<div className="h-full rounded-full" style={{ width: `${pct}%` }} />
```
No explicit CSS transition, but the percentage changes trigger re-renders.

---

## 13. Animation Performance Considerations

| Technique | Purpose |
|----------|---------|
| `will-change: transform` (via Framer Motion) | GPU-accelerated transforms |
| `cubic-bezier(0.16, 1, 0.3, 1)` | Smooth deceleration curve |
| `transition-all duration-200` | Quick, responsive feedback |
| `overflow-hidden` on AnimatePresence containers | Prevents layout shift during exit |
| `layoutId` for shared animations | Efficient layout transitions |
| Spring physics | Natural-feeling navigation transitions |
