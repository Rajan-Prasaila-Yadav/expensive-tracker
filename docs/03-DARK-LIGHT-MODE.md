# 🌗 Dark Mode & Light Mode — Complete Analysis

> Detailed analysis of the theme switching system, FOUC prevention, and per-token color mappings.

---

## 1. Theme Architecture

### 1.1 Theme Detection & FOUC Prevention

The application prevents Flash of Unstyled Content (FOUC) using an inline `<script>` in `index.html` that runs **before** any CSS or React loads:

```html
<script>
  try {
    let theme = localStorage.getItem("theme");
    if (theme === "system" || !theme) {
      let prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      theme = prefersDark ? "dark" : "light";
    }
    document.documentElement.classList.add(theme);
  } catch (e) {}
</script>
```

**Flow:**
1. Check `localStorage` for stored preference
2. If "system" or not set → check `prefers-color-scheme` media query
3. Add `.dark` or `.light` class to `<html>` element immediately
4. CSS variables respond to the class change instantly

### 1.2 Theme Toggle Component (`theme-toggle.tsx`)

**Mechanism:**
- Uses React `useState` initialized from `localStorage` + DOM class + media query
- Toggles `document.documentElement.classList` directly
- Persists choice to `localStorage` under key `"theme"`
- Shows toast notification on toggle ("Dark mode activated 🌙" / "Light mode activated ☀️")

**Animation:**
- Uses `motion/react` (Framer Motion) `AnimatePresence` with `mode="wait"`
- Sun/Moon icons rotate 90° with scale animation on swap
- Transition duration: `0.2s`
- Moon icon: `text-amber-400`
- Sun icon: `text-amber-500`

### 1.3 Settings Page Theme Selector

The Settings page provides a 3-option theme picker:

| Option | Icon | Preview | Behavior |
|--------|------|---------|----------|
| **Light** | `Sun` | White card | Removes `.dark` class |
| **Dark** | `Moon` | Dark zinc card | Adds `.dark` class |
| **System** | `Monitor` | Gradient card | Checks `prefers-color-scheme` |

---

## 2. CSS Variable Architecture

All theme-dependent colors use CSS custom properties on `:root` (light) and `.dark` (dark):

```css
@custom-variant dark (&:is(.dark *));  /* Tailwind v4 dark mode variant */
```

### 2.1 Core Surfaces

| Token | Light Mode | Dark Mode | Visual Shift |
|-------|-----------|-----------|-------------|
| `--background` | Near-white `0.98` | Near-black `0.13` | Full inversion |
| `--card` | Pure white `1.0` | Dark blue-gray `0.18` | Cards get dark tint |
| `--popover` | Pure white | Dark blue-gray | Matches cards |
| `--muted` | Very light gray `0.95` | Dark gray `0.22` | Subtle surface |

### 2.2 Text Colors

| Token | Light Mode | Dark Mode | Contrast Ratio |
|-------|-----------|-----------|---------------|
| `--foreground` | Very dark `0.14` | Very light `0.93` | High against bg |
| `--muted-foreground` | Medium gray `0.52` | Light gray `0.60` | Moderate |
| `--card-foreground` | Same as foreground | Same as foreground | High |

### 2.3 Interactive Elements

| Token | Light Mode | Dark Mode | Notes |
|-------|-----------|-----------|-------|
| `--primary` | Deep blue `0.45 chroma 0.18` | Brighter blue `0.6 chroma 0.2` | +33% lightness in dark |
| `--accent` | Faint blue tint `0.95` | Rich dark blue `0.25` | Surface behind accents |
| `--secondary` | Light gray `0.95` | Dark blue `0.22` | Secondary buttons |
| `--destructive` | Red `0.57` | Brighter red `0.65` | +14% lightness in dark |

### 2.4 Finance Semantic Colors (Most Critical)

| Token | Light → Dark Shift | Strategy |
|-------|-------------------|----------|
| `--income` (green) | `0.52 → 0.60` | Increase lightness 15% |
| `--income-bg` | `0.96 → 0.22` | Light bg → Dark subtle bg |
| `--expense` (red) | `0.55 → 0.65` | Increase lightness 18% |
| `--expense-bg` | `0.97 → 0.22` | Light bg → Dark subtle bg |
| `--transfer` (blue) | `0.52 → 0.60` | Increase lightness 15% |
| `--transfer-bg` | `0.96 → 0.22` | Light bg → Dark subtle bg |
| `--warning` (amber) | `0.65 → 0.72` | Increase lightness 11% |
| `--warning-bg` | `0.97 → 0.22` | Light bg → Dark subtle bg |

**Pattern:** In dark mode, text colors get **brighter** (increased OKLCH lightness) while background colors get **darker** (decreased to ~0.22 lightness).

### 2.5 Border & Input Handling

| Token | Light Mode | Dark Mode | Strategy |
|-------|-----------|-----------|----------|
| `--border` | `oklch(0.91 0.005 240)` solid | `oklch(1 0 0 / 8%)` translucent | Translucent borders in dark mode for depth |
| `--input` | Same as border | `oklch(1 0 0 / 10%)` | Slightly more visible than borders |
| `--ring` | Matches primary | Matches primary | Focus ring stays consistent |

### 2.6 Sidebar Dark Mode

| Token | Light | Dark | Notes |
|-------|-------|------|-------|
| `--sidebar` | `0.14` (very dark) | `0.10` (even darker) | Sidebar is always dark, gets darker in dark mode |
| `--sidebar-border` | Solid dark line | `oklch(1 0 0 / 8%)` translucent | Softened in dark |

---

## 3. Chart Theme Adaptation

Charts use CSS custom properties for theming, ensuring they automatically adapt:

```tsx
// Area chart gradients reference CSS variables
<stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.25} />
<stop offset="95%" stopColor="var(--color-income)" stopOpacity={0} />

// Grid lines use border color
<CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />

// Tooltip styled with card colors
contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
```

---

## 4. Glassmorphism in Dark Mode

```css
.glass-panel {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: color-mix(in srgb, var(--color-card) 88%, transparent);
  border: 1px solid var(--color-border);
}
```

This creates a frosted glass effect that works in both modes because it uses the card token.

---

## 5. Glow Effects in Dark Mode

```css
.glow-hover:hover {
  border-color: color-mix(in srgb, var(--color-primary) 50%, transparent);
  box-shadow: 0 0 20px -4px color-mix(in srgb, var(--color-primary) 30%, transparent);
}
```

The glow effect is **more visible in dark mode** because the primary color is brighter and the surrounding background is darker, creating stronger contrast.

---

## 6. Notification Badge Dark Mode

The notification badge uses `animate-pulse` on expense-colored dot:
```html
<span class="w-2 h-2 bg-[var(--color-expense)] rounded-full animate-pulse" />
```
In dark mode, the expense red shifts from `0.55 → 0.65` lightness, making the pulsing dot more visible.

---

## 7. Theme Transition Behavior

There are **no global transition animations** for theme switching — colors change instantly. However:
- The toggle button itself has a `0.2s` icon rotation animation
- Individual components with `transition-colors` in their classes will smoothly transition
- The sidebar maintains its always-dark aesthetic in both modes
