# 📱 Mobile Responsiveness & Sidebar — Complete Analysis

> Analysis of every responsive breakpoint, mobile-first patterns, sidebar behavior, and bottom navigation.

---

## 1. Breakpoint System

The project uses Tailwind CSS v4 default breakpoints:

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| Default (mobile-first) | `0px+` | Base styles |
| `sm` | `640px+` | Small tablets, larger phones |
| `md` | `768px+` | Tablets — **Primary desktop/mobile split** |
| `lg` | `1024px+` | Desktop layouts |
| `xl` | `1280px+` | Large desktops (unused directly) |

### Critical Breakpoint: `md` (768px)
- **Below 768px**: Mobile layout (bottom nav visible, sidebar hidden)
- **At/above 768px**: Desktop layout (sidebar visible, bottom nav hidden)

---

## 2. Mobile Detection Hook

```typescript
// src/hooks/use-mobile.ts
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,  // Listens to matchMedia change events
    () => window.innerWidth < MOBILE_BREAKPOINT,  // Client snapshot
    () => false,  // Server snapshot (SSR fallback)
  );
}
```

Uses `useSyncExternalStore` for tear-free reads of window width, avoiding hydration mismatches.

---

## 3. Layout Architecture

### 3.1 `AppLayout` — Master Layout Component

```tsx
<div className="flex h-screen w-full overflow-hidden bg-[var(--color-background)]">
  <AppSidebar />        {/* hidden md:flex — Desktop only */}
  <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full pb-20 md:pb-6">
    {children}
  </main>
  <BottomNav />          {/* md:hidden — Mobile only */}
</div>
```

**Key behaviors:**
- `h-screen` — Full viewport height
- `overflow-hidden` on wrapper — Prevents double scrollbars
- `pb-20` on mobile — Prevents content being hidden behind bottom nav
- `pb-6` on desktop (md:) — Normal bottom padding
- `overflow-y-auto` on main — Content scrolls independently
- `min-w-0 max-w-full` — Prevents flex overflow

---

## 4. Desktop Sidebar (`AppSidebar`)

### 4.1 Structure

```
┌──────────────────────┐
│  Logo + FinanceOS     │  ← Brand area (collapsible)
├──────────────────────┤
│  Home                 │
│  Transactions         │
│  Income               │  ← Main navigation (9 items)
│  Expenses             │
│  Transfers            │
│  Budget               │
│  Categories           │
│  Analytics            │
│  Reports              │
├──────────────────────┤
│  Notifications (🔴)   │
│  Profile              │  ← Bottom navigation (4 items)
│  Settings             │
│  Audit Logs           │
│  Collapse sidebar ◀   │  ← Toggle button
└──────────────────────┘
```

### 4.2 Dimensions & States

| Property | Expanded | Collapsed |
|----------|----------|-----------|
| Width | `w-[224px]` (224px) | `w-[68px]` (68px) |
| Label visibility | Visible | Hidden |
| Icon alignment | Left-aligned | Centered |
| Logo text | "FinanceOS / Personal Finance" | Icon only |
| Active indicator dot | Visible | Hidden |
| Tooltip on hover | None | Title attribute shown |

### 4.3 Sidebar Styling

```css
/* Always dark sidebar regardless of theme */
background: var(--sidebar);           /* oklch(0.14...) */
border-right: 1px solid var(--sidebar-border);
position: sticky; top: 0;
height: 100vh;
transition: all 300ms;               /* Smooth collapse animation */
user-select: none;
```

### 4.4 Active Nav Item States

| State | Styling |
|-------|---------|
| **Active** | `bg-primary/15 text-primary font-semibold shadow-xs border border-primary/20` |
| **Inactive** | `text-sidebar-foreground opacity-75` |
| **Hover** | `opacity-100 bg-sidebar-accent translate-x-0.5` |
| **Active indicator** | `motion.span` — Animated dot with `layoutId="sidebar-active-indicator"` |

### 4.5 Logo Animation

```tsx
<motion.div
  whileHover={{ scale: 1.08, rotate: 5 }}
  whileTap={{ scale: 0.95 }}
  className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-blue-500 shadow-md shadow-primary/25"
>
  <Wallet size={17} className="text-white" />
</motion.div>
```

### 4.6 Notification Badge in Sidebar

```tsx
<span className="absolute -top-1 -right-1 w-4 h-4 bg-expense text-white text-[9px] 
  font-bold rounded-full flex items-center justify-center animate-pulse">
  {unread}
</span>
```

---

## 5. Mobile Bottom Navigation (`BottomNav`)

### 5.1 Visibility
- `md:hidden` — Only visible below 768px
- `fixed bottom-0 left-0 right-0 z-50` — Fixed to bottom

### 5.2 Navigation Items (5 of 14 pages)

| Icon | Label | Route |
|------|-------|-------|
| `LayoutDashboard` | Home | `/` |
| `ArrowLeftRight` | Txns | `/transactions` |
| `Target` | Budget | `/budget` |
| `BarChart3` | Analytics | `/analytics` |
| `User` | Profile | `/profile` |

### 5.3 Styling

```css
/* Container */
border-top: 1px solid border/80;
background: card/90;
backdrop-filter: blur(medium);    /* Frosted glass effect */
padding: 4px 4px;
safe-area-inset-bottom;          /* iPhone notch area */
```

### 5.4 Active Item Animation

```tsx
{isActive && (
  <motion.div
    layoutId="bottom-nav-active-pill"
    className="absolute inset-0 bg-primary/10 rounded-xl"
    transition={{ type: "spring", stiffness: 400, damping: 30 }}
  />
)}
<motion.div
  animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -1 : 0 }}
  transition={{ type: "spring", stiffness: 350, damping: 25 }}
>
  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
</motion.div>
```

**Features:**
- `layoutId` creates a shared layout animation (pill slides between items)
- Active icon scales up 15% and lifts 1px
- Active icon gets thicker stroke width (2.5 vs 2)
- Spring physics: stiffness 400, damping 30

---

## 6. Responsive Patterns Per Page

### 6.1 Home Page
| Element | Mobile | Desktop |
|---------|--------|---------|
| Summary cards | 2-column grid | 4-column grid |
| Charts | Stacked (full width) | 5-column grid (3+2 split) |
| Budget + Recent | Stacked | 5-column grid (2+3 split) |
| Greeting text | `text-2xl` | `text-2xl` |
| Card values | `text-base` | `text-xl` |
| "Add" button | Icon + text | Same |

### 6.2 Transactions Page
| Element | Mobile | Desktop |
|---------|--------|---------|
| Search + Filters | 2-column grid | Flex row (inline) |
| Search input | Full width (col-span-2) | `max-w-[260px]` |
| Filter dropdowns | Full width each | `w-[130px]` fixed |
| KPI cards | 3-column grid | Same |
| Transaction amounts | `text-xs` | `text-sm` |
| Payment method column | Hidden | Visible (`hidden md:block`) |
| Status pill | Hidden on small | Visible (`hidden sm:inline-flex`) |

### 6.3 Categories Page
| Element | Mobile | Desktop |
|---------|--------|---------|
| Category cards | 2-column grid | Up to 5-column grid |
| Action buttons | Always visible | Opacity 0 → 100 on hover |
| Tab bar | 3-column grid | Auto width |

### 6.4 Audit Logs Page
| Element | Mobile | Desktop |
|---------|--------|---------|
| Data display | Card-based list | Full data table |
| Visibility | `md:hidden` cards | `hidden md:block` table |
| Summary cards | Compact (w-7) | Normal (w-9) |

### 6.5 Profile Page
| Element | Mobile | Desktop |
|---------|--------|---------|
| Avatar + Info | Column (centered) | Row (left-aligned) |
| Stats grid | 2-column | 4-column |
| Quick access | 2-column | 3-column |
| Account info | 2-column | 4-column |
| Edit button | Shows mobile settings too | Desktop settings in header |

---

## 7. Responsive Interaction Patterns

### 7.1 Dropdown Actions on Transaction Rows
- Mobile: `opacity-50` (always partially visible)
- Desktop: `sm:opacity-0 group-hover:opacity-100` (appear on row hover)

### 7.2 Category Card Actions
- Mobile: Always visible (`flex`)
- Desktop: `sm:opacity-0 group-hover:opacity-100`

### 7.3 Touch Targets
- All interactive elements have minimum `h-7 w-7` touch targets (28px)
- Buttons use `h-9` (36px) for comfortable touch
- Bottom nav items are `flex-1` (equal width distribution)

### 7.4 Text Truncation
- Extensive use of `truncate` class on all text that might overflow
- `min-w-0` on flex containers to allow truncation to work
- `max-w-[90px] sm:max-w-none` for conditional truncation
