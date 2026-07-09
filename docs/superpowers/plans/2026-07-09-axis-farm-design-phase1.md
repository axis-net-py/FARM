# AXIS Farm — Fase 1: Fundação Visual Awwwards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace AURELIUS's raw corporate-green theme with the "Campo Verde Moderno" palette, Fraunces serif headings, Clinic-style micro-animations/button refinement, a new agro favicon, and rebrand the login/sidebar/dashboard to "AXIS Farm" — matching the polish level already shipped in AXIS Clinic.

**Architecture:** Pure presentation-layer change. No schema, no server actions, no new dependencies (Fraunces is already a Google font available via `next/font/google`, same package already used by CLINIC-repo). Every task edits one file. Verification is visual (dev server + `preview_*` tools) plus `tsc --noEmit`, since there is no CSS/visual-regression test suite in this repo — this replaces the usual failing-test step for tasks 1, 3, 4, 5, 6.

**Tech Stack:** Next.js App Router, Tailwind v4 (`@theme` CSS tokens), `next/font/google`, next-themes (dark mode via `.dark` class), lucide-react icons.

**Repo:** `C:\Users\User\Documents\AXIS\AURELIUS-repo` (GitHub `axis-net-py/FARM`, same repo renamed from AURELIUS — origin URL still resolves via GitHub redirect, no remote change needed).

---

### Task 1: Global color tokens, typography, animations, button refinement

**Files:**
- Modify: `src/app/globals.css:1-102` (tokens + `@theme` block + `@layer base`)

- [ ] **Step 1: Replace the `:root` token block**

Replace lines 5-27 (current light `:root` block) with:

```css
:root {
  --background: #faf8f4;
  --foreground: #22302c;
  --card: #ffffff;
  --card-foreground: #22302c;
  --popover: #ffffff;
  --popover-foreground: #22302c;
  --primary: #1f4d3a;
  --primary-foreground: #ffffff;
  --secondary: #f1efe9;
  --secondary-foreground: #22302c;
  --muted: #f5f3ed;
  --muted-foreground: #6b7671;
  --accent: #eef2ee;
  --accent-foreground: #22302c;
  --destructive: #c0392b;
  --destructive-foreground: #fafafa;
  --border: #e5e1d8;
  --input: #e5e1d8;
  --ring: #1f4d3a;
  /* AXIS Farm accents */
  --harvest-gold: #a98e5b;
  --harvest-gold-light: #c4ad7f;
  --sage: #5c7a6a;
  --badge-posted-bg: #e3f0e9;
  --badge-posted-text: #1f4d3a;
}
```

- [ ] **Step 2: Replace the `.dark` token block**

Replace lines 29-51 (current `.dark` block) with:

```css
.dark {
  --background: #0d1410;
  --foreground: #edf0ec;
  --card: #131a15;
  --card-foreground: #edf0ec;
  --popover: #131a15;
  --popover-foreground: #edf0ec;
  --primary: #2f6b4a;
  --primary-foreground: #eef7f0;
  --secondary: #1a221c;
  --secondary-foreground: #edf0ec;
  --muted: #1a221c;
  --muted-foreground: #9aa69e;
  --accent: #1c2620;
  --accent-foreground: #edf0ec;
  --destructive: #e05a4b;
  --destructive-foreground: #fafafa;
  --border: #26302a;
  --input: #26302a;
  --ring: #2f6b4a;
  /* AXIS Farm accents */
  --harvest-gold: #b8a068;
  --harvest-gold-light: #d0bc8c;
  --sage: #4a6b5a;
  --badge-posted-bg: rgba(47, 107, 74, 0.18);
  --badge-posted-text: #7bb894;
}
```

Note: dark `--primary` (`#2f6b4a`) is a mid-forest green — deliberately NOT a pale/sage-light tone, per explicit user correction. It must read as "dark green", not mint.

- [ ] **Step 3: Extend the `@theme` block with the new tokens**

In the existing `@theme { ... }` block (was lines 53-77, now shifted), add these three lines after `--color-ring: var(--ring);`:

```css
  --color-harvest-gold: var(--harvest-gold);
  --color-harvest-gold-light: var(--harvest-gold-light);
  --color-sage: var(--sage);
```

Leave `--radius-*` values unchanged.

- [ ] **Step 4: Add serif typography to `@layer base`**

Inside the existing `@layer base { ... }` block, after the `body { ... }` rule, add:

```css
  h1 {
    font-family: var(--font-serif), Georgia, serif;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  h2 {
    font-family: var(--font-serif), Georgia, serif;
    font-weight: 600;
    letter-spacing: -0.015em;
  }
  h3 {
    font-weight: 600;
    letter-spacing: -0.012em;
  }
```

- [ ] **Step 5: Add card elevation, micro-animations, and button refinement**

After the closing `}` of `@layer base`, insert (before any existing `.axis-btn-primary` rule):

```css
/* Custom premium elevations */
.rounded-xl.border.bg-card,
.rounded-lg.border.bg-card,
.border.bg-card {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border-color: var(--color-border);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dark .rounded-xl.border.bg-card,
.dark .rounded-lg.border.bg-card,
.dark .border.bg-card {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
  border-color: var(--color-border);
}

/* Micro-animações (AXIS Farm) */

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.hover-lift {
  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease, border-color 0.18s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(34, 48, 44, 0.14) !important;
  border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
}

.dark .hover-lift:hover {
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.6) !important;
}

@media (prefers-reduced-motion: reduce) {
  .animate-fade-up {
    animation: none;
  }
  .hover-lift,
  .hover-lift:hover {
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 6: Refine the existing `.axis-btn-primary` and global `.bg-primary` rules**

Find the current `.axis-btn-primary` block (originally lines 99-119) and replace it entirely with:

```css
.axis-btn-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom-color: rgba(0, 0, 0, 0.24);
  cursor: pointer;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.axis-btn-primary:hover {
  background-color: color-mix(in srgb, var(--color-primary) 92%, black);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.axis-btn-primary:active {
  background-color: color-mix(in srgb, var(--color-primary) 85%, black);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.axis-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Globally enhance all shadcn primary buttons to have a premium corporate look */
button.bg-primary,
.bg-primary {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.12) !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  border-bottom-color: rgba(0, 0, 0, 0.24) !important;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1) !important;
}

button.bg-primary:hover,
.bg-primary:hover {
  background-color: color-mix(in srgb, var(--color-primary) 92%, black) !important;
}

button.bg-primary:active,
.bg-primary:active {
  background-color: color-mix(in srgb, var(--color-primary) 85%, black) !important;
}
```

This replaces the old `:active { transform: scale(0.97); }` treatment with the Clinic-style pressed/hover states. Leave `.axis-btn-gold`, `.axis-glass-panel`, `.old-money-card`, `.glass-pop-up`, `.exchange-rate-*`, scrollbar rules, and the entire `@media print` block untouched — they are color-agnostic or already correct.

- [ ] **Step 7: Verify no syntax errors**

Run: `cd C:\Users\User\Documents\AXIS\AURELIUS-repo && npx tsc --noEmit`
Expected: no new errors (this is a CSS file, so this just confirms the rest of the project still typechecks — CSS itself is verified visually in Task 7).

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): paleta Campo Verde Moderno, tipografia serif, animações e refino de botão"
```

---

### Task 2: Fraunces font + metadata rebrand

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add the Fraunces import and font variable**

Replace line 2 (`import { Geist, Geist_Mono } from "next/font/google";`) with:

```tsx
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
```

After line with `geistMono` (line 7), add:

```tsx
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  axes: ["opsz"],
});
```

- [ ] **Step 2: Update metadata to AXIS Farm branding**

Replace the `metadata` object (lines 9-12):

```tsx
export const metadata: Metadata = {
  title: "AXIS Farm",
  description: "Gestão agrícola — safras, talhões, frota e faturamento",
};
```

- [ ] **Step 3: Add the font variable to the body className**

Replace the `<body>` className (line 21):

```tsx
      <body className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}>
```

- [ ] **Step 4: Verify**

Run: `cd C:\Users\User\Documents\AXIS\AURELIUS-repo && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(design): fonte Fraunces e rebrand de metadata para AXIS Farm"
```

---

### Task 3: New agro favicon

**Files:**
- Modify: `src/app/icon.svg` (currently the inherited Cooper gold-"C" icon)

- [ ] **Step 1: Replace the icon with a farm-themed mark**

Replace the entire file content with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <!-- Background Gradient (AXIS Farm deep campo green) -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f2b1e" />
      <stop offset="100%" stop-color="#04130c" />
    </linearGradient>
    <!-- Harvest Gold Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f3e098" />
      <stop offset="50%" stop-color="#c4ad7f" />
      <stop offset="100%" stop-color="#a98e5b" />
    </linearGradient>
  </defs>

  <!-- Base rounded background -->
  <rect width="32" height="32" rx="7" fill="url(#bgGrad)" />

  <!-- Stylized wheat blade -->
  <path d="M16 6 C20 10 21 17 17 24 C15.5 24 14.5 24 13 24 C15 18 15 12 16 6 Z" fill="url(#goldGrad)" />
  <path d="M16 10 C13.5 11.5 12 13 11.5 15.5" stroke="url(#goldGrad)" stroke-width="1.4" fill="none" stroke-linecap="round" />
  <path d="M16 15 C18.5 16 20 17.5 20.5 20" stroke="url(#goldGrad)" stroke-width="1.4" fill="none" stroke-linecap="round" />
  <path d="M16 20 C13.8 20.8 12.3 22 11.7 24" stroke="url(#goldGrad)" stroke-width="1.4" fill="none" stroke-linecap="round" />

  <!-- Sleek green leaf accent -->
  <path d="M16 6 C20 10 21 16 17 19 C15 16 14.5 11 16 6 Z" fill="#3daa78" opacity="0.35" />
</svg>
```

- [ ] **Step 2: Verify it renders**

Run: `cd C:\Users\User\Documents\AXIS\AURELIUS-repo && npx tsc --noEmit`
Expected: no errors (SVG isn't typechecked, this just confirms nothing else broke).
Visual check happens in Task 7 (browser tab favicon).

- [ ] **Step 3: Commit**

```bash
git add src/app/icon.svg
git commit -m "feat(design): favicon agrícola substitui o C dourado herdado do Cooper"
```

---

### Task 4: Login page rebrand + theme-aware background

**Files:**
- Modify: `src/app/(auth)/login/page.tsx:91-121`

- [ ] **Step 1: Replace the `LoginPage` component**

Replace lines 91-121 (the entire `export default function LoginPage()`) with:

```tsx
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
            A
          </div>
          <h1 className="text-3xl text-foreground">
            AXIS <span className="text-primary">Farm</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gestão agrícola — safras, talhões e frota
          </p>
        </div>

        {/* Login Card */}
        <div className="border border-border rounded-2xl p-8 bg-card shadow-sm">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6 uppercase tracking-wider">
          © {new Date().getFullYear()} AXIS - Soluciones Digitales. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
```

This drops the hardcoded `bg-[#0a0a0a]` (always-dark regardless of theme) in favor of `bg-background`, which follows the light/dark tokens from Task 1. `LoginForm` (lines 8-89) is unchanged.

- [ ] **Step 2: Verify**

Run: `cd C:\Users\User\Documents\AXIS\AURELIUS-repo && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(auth)/login/page.tsx"
git commit -m "feat(design): login AXIS Farm com fundo adaptável ao tema"
```

---

### Task 5: Sidebar rebrand

**Files:**
- Modify: `src/components/Sidebar.tsx:139-147`

- [ ] **Step 1: Replace the logo block**

Replace lines 139-147:

```tsx
      {/* Logo */}
      <div className={cn("flex h-14 items-center border-b border-border px-3", collapsed ? "justify-center" : "gap-2")}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
          A
        </div>
        {!collapsed && (
          <span className="font-serif text-sm font-semibold tracking-tight text-foreground">
            AXIS <span className="text-primary">Farm</span>
          </span>
        )}
      </div>
```

`font-serif` maps to the `--font-serif` variable registered in Task 2 (Tailwind v4 picks up CSS variables named `--font-*` automatically for the `font-*` utility).

- [ ] **Step 2: Verify**

Run: `cd C:\Users\User\Documents\AXIS\AURELIUS-repo && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat(design): sidebar rebrand AXIS Farm com Fraunces no branding"
```

---

### Task 6: Dashboard entrance animation

**Files:**
- Modify: `src/components/dashboard/StatsCards.tsx:88,108,128,148`

- [ ] **Step 1: Add staggered fade-up to each of the 4 `Card` elements**

Each of the 4 `<Card className="border border-border bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md cursor-default border-l-4 border-l-{color}-500/80 group">` needs `animate-fade-up` added to its className, plus an inline `style` for stagger delay. Apply this exact edit to all 4 cards (lines 88, 108, 128, 148), using index 0/1/2/3 respectively:

Card 1 (line 88, harvests, index 0):
```tsx
      <Card className="border border-border bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md cursor-default border-l-4 border-l-emerald-500/80 group animate-fade-up" style={{ animationDelay: '0ms' }}>
```

Card 2 (line 108, área, index 1):
```tsx
      <Card className="border border-border bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md cursor-default border-l-4 border-l-amber-500/80 group animate-fade-up" style={{ animationDelay: '60ms' }}>
```

Card 3 (line 128, frota, index 2):
```tsx
      <Card className="border border-border bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md cursor-default border-l-4 border-l-sky-500/80 group animate-fade-up" style={{ animationDelay: '120ms' }}>
```

Card 4 (line 148, equipe, index 3):
```tsx
      <Card className="border border-border bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md cursor-default border-l-4 border-l-indigo-500/80 group animate-fade-up" style={{ animationDelay: '180ms' }}>
```

Leave the colored `border-l-*` accents (emerald/amber/sky/indigo) as-is — they're semantic per-metric colors already appropriate for an agro dashboard, unrelated to the primary theme token.

- [ ] **Step 2: Verify**

Run: `cd C:\Users\User\Documents\AXIS\AURELIUS-repo && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/StatsCards.tsx
git commit -m "feat(design): entrada fade-up escalonada nos cards do dashboard"
```

---

### Task 7: End-to-end visual verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck and Prisma sanity check**

Run:
```bash
cd C:\Users\User\Documents\AXIS\AURELIUS-repo
npx prisma generate
npx tsc --noEmit
```
Expected: both exit 0.

- [ ] **Step 2: Start the dev server via the preview tool**

Use `mcp__Claude_Preview__preview_start` (add an AURELIUS/Farm entry to `.claude/launch.json` if one doesn't already exist, e.g. `{"name": "farm-dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": <port>}`).

- [ ] **Step 3: Check the login page in light mode**

`preview_screenshot` on `/login`. Confirm: cream background (`#faf8f4`), "AXIS Farm" title in Fraunces serif, deep green primary button, new favicon in the browser tab.

- [ ] **Step 4: Toggle dark mode and re-check**

Use `preview_eval` to set dark mode (or click the theme toggle once logged in, via `preview_click`), then `preview_screenshot`. Confirm: near-black green-tinted background (`#0d1410`), primary buttons are mid-forest-green (`#2f6b4a`) — NOT pale/mint — text remains legible (white/near-white on dark card).

- [ ] **Step 5: Log in and check sidebar + dashboard**

`preview_fill` credentials, `preview_click` submit, then `preview_snapshot` the dashboard. Confirm: sidebar shows "AXIS Farm" in serif, 4 stat cards fade in with a slight stagger (visible on reload), `hover-lift`/button refinements visible via `preview_inspect` on a `.bg-primary` button (border-bottom color, box-shadow).

- [ ] **Step 6: Check `prefers-reduced-motion`**

`preview_resize` supports `colorScheme` but not reduced-motion directly — use `preview_eval` to run:
```js
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```
is not settable from the page; instead confirm via code review (already done in Task 1 Step 5) that the `@media (prefers-reduced-motion: reduce)` block disables both animations — no runtime check needed beyond confirming the CSS rule exists (`grep` the built output if in doubt).

- [ ] **Step 7: Report results to the user**

Summarize pass/fail per screen with screenshots. If any contrast or layout issue appears, fix inline in the relevant Task's file before moving on — do not commit broken visuals.

---

## Self-Review Notes

- **Spec coverage:** palette (Task 1) ✓, dark-stays-green correction (Task 1 Step 2, explicit note) ✓, Fraunces (Task 2) ✓, animations/button refinement (Task 1 Steps 5-6) ✓, favicon (Task 3) ✓, login/sidebar/dashboard redesign (Tasks 4-6) ✓, "rest of modules inherit via shared tokens" (no task needed — verified by grep that all module pages use `bg-card`/`border-border`/`bg-primary` utility classes, not hardcoded colors) ✓, out-of-scope items (new modules, AI, i18n, `testes` folder, repo/folder rename) explicitly excluded ✓.
- **Placeholder scan:** none found — every step has literal file content.
- **Type consistency:** `--font-serif` variable name matches between Task 2 (font registration) and Task 5 (`font-serif` Tailwind utility consumption); `.animate-fade-up`/`.hover-lift` class names match between Task 1 (definition) and Tasks 4/6 (usage).
