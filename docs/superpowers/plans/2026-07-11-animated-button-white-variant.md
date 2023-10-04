# AnimatedButton White Variant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `white` visual variant to the shared `AnimatedButton` component and use it for the homepage hero CTA, replacing that CTA's hand-rolled white-border/white-text link with the shared animated component.

**Architecture:** `AnimatedButton` (`components/ui/animated-button.tsx`) already selects its colors from a `variantConfig` object keyed by variant name (`default`, `outline`). Add a third `white` key to that object following the exact same shape, then swap the hero's raw `<Link>` for `<AnimatedButton asChild variant="white">` in `app/(store)/page.tsx`.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, framer-motion (already used by `AnimatedButton` — no new dependency).

## Global Constraints

- No test runner is configured in this repo — verification is `pnpm lint`, `pnpm build`, and manual browser checks, not automated tests.
- All UI copy must stay in Bahasa Indonesia (unaffected here — no copy changes, only styling/markup).
- Package manager is `pnpm` — don't invoke `npm`/`yarn`.
- Money-as-cents, ISR/Server-Component, and other storefront architecture rules from `docs/sandwich/technical-notes.md` are not implicated by this change.

---

### Task 1: Add `white` variant to `AnimatedButton`

**Files:**
- Modify: `components/ui/animated-button.tsx:12-32` (prop type + `variantConfig`)

**Interfaces:**
- Consumes: nothing new — uses existing `hsl(var(--foreground))` CSS variable already defined in `app/globals.css:5` (`--foreground: 222.2 84% 4.9%`).
- Produces: `AnimatedButton` now accepts `variant="white"` in addition to `"default"` and `"outline"`. Later tasks (Task 2) rely on this exact string value.

- [ ] **Step 1: Update the `variant` prop type**

In `components/ui/animated-button.tsx`, change:

```tsx
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  variant?: "default" | "outline";
}
```

to:

```tsx
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  variant?: "default" | "outline" | "white";
}
```

- [ ] **Step 2: Add the `white` entry to `variantConfig`**

Change:

```tsx
const variantConfig = {
  default: {
    container: "bg-primary border-primary",
    fill: "bg-primary-foreground",
    textInitial: "hsl(var(--primary-foreground))",
    textHover: "hsl(var(--primary))",
  },
  outline: {
    container: "bg-transparent border-primary",
    fill: "bg-primary",
    textInitial: "hsl(var(--primary))",
    textHover: "hsl(var(--primary-foreground))",
  },
} as const;
```

to:

```tsx
const variantConfig = {
  default: {
    container: "bg-primary border-primary",
    fill: "bg-primary-foreground",
    textInitial: "hsl(var(--primary-foreground))",
    textHover: "hsl(var(--primary))",
  },
  outline: {
    container: "bg-transparent border-primary",
    fill: "bg-primary",
    textInitial: "hsl(var(--primary))",
    textHover: "hsl(var(--primary-foreground))",
  },
  white: {
    container: "bg-transparent border-white!",
    fill: "bg-white",
    textInitial: "white",
    textHover: "hsl(var(--foreground))",
  },
} as const;
```

Note: `border-white!` (trailing `!` = Tailwind important modifier) is required — the component's `baseClassName` hardcodes `border-primary!` (line ~126), and without `!` on the variant's own border color, the base class's important modifier would win and the border would stay the primary color instead of white.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: no new errors from `animated-button.tsx`.

- [ ] **Step 4: Manual visual check**

Run: `pnpm dev`, then temporarily add `<AnimatedButton variant="white" className="bg-neutral-800">Test</AnimatedButton>` to any page rendered on a dark background (or just check it renders without crashing on a light page — full visual check against the real dark hero background happens in Task 2). Confirm in the browser:
- Border renders white, not the default gray/primary color.
- Text is white at rest.
- On hover, the fill animates in white and the text crossfades to a dark near-black color.

Remove the temporary test snippet before moving to Task 2 (Task 2 provides the real usage).

- [ ] **Step 5: Commit**

```bash
git add components/ui/animated-button.tsx
git commit -m "feat: add white variant to AnimatedButton"
```

---

### Task 2: Swap homepage hero CTA to use the `white` variant

**Files:**
- Modify: `app/(store)/page.tsx` (hero CTA link, originally reported at lines 12–52 by exploration — re-locate by searching for `Lihat Koleksi` since exact line numbers may have shifted)
- Test: manual browser check only (no automated test for this page)

**Interfaces:**
- Consumes: `AnimatedButton` with `variant="white"` from Task 1 (`components/ui/animated-button.tsx`).
- Produces: nothing consumed by later tasks — this is the final task in the plan.

- [ ] **Step 1: Locate and read the current hero CTA**

```bash
grep -n "Lihat Koleksi" "app/(store)/page.tsx"
```

Confirm the surrounding JSX matches:

```tsx
<Link
  href="/freediving"
  className="border border-white/50 text-white px-8 py-4 text-sm uppercase tracking-wider hover:bg-white/10 transition-colors"
>
  Lihat Koleksi
</Link>
```

If the className or wrapper differs from this (e.g. someone edited it since this plan was written), stop and reconcile before proceeding — don't blindly overwrite.

- [ ] **Step 2: Add the `AnimatedButton` import if not already present**

Check the top of `app/(store)/page.tsx` for:

```tsx
import { AnimatedButton } from "@/components/ui/animated-button";
```

Add it if missing.

- [ ] **Step 3: Replace the hardcoded link with `AnimatedButton`**

Replace:

```tsx
<Link
  href="/freediving"
  className="border border-white/50 text-white px-8 py-4 text-sm uppercase tracking-wider hover:bg-white/10 transition-colors"
>
  Lihat Koleksi
</Link>
```

with:

```tsx
<AnimatedButton
  asChild
  variant="white"
  className="px-8 py-4 text-sm uppercase tracking-wider"
>
  <Link href="/freediving">Lihat Koleksi</Link>
</AnimatedButton>
```

This intentionally picks up the base `AnimatedButton` classes (`border-2`, `rounded-[6px]`) instead of the old link's thinner `border` + sharp corners — confirmed as the desired outcome during design (see `docs/superpowers/specs/2026-07-11-animated-button-white-variant-design.md`).

- [ ] **Step 4: Run lint and build**

Run: `pnpm lint`
Expected: no new errors.

Run: `pnpm build`
Expected: build succeeds (confirms no type errors from the `asChild`/`Link`-as-child pattern, which is already used elsewhere in this codebase for `AnimatedButton`, e.g. `components/product-section.tsx`).

- [ ] **Step 5: Manual visual check in browser**

Run: `pnpm dev`, open `http://localhost:3000` (the homepage).

Confirm:
- The hero CTA "Lihat Koleksi" button has a white border and white text at rest, over the hero photo.
- On hover, a white fill animates in from below and the text crossfades to a dark near-black color.
- The button is still a working link to `/freediving` (click it or check `href` in devtools).
- Layout/spacing around the button in the hero section looks unchanged (no overflow or shift from the border-width/radius change).

- [ ] **Step 6: Commit**

```bash
git add "app/(store)/page.tsx"
git commit -m "refactor: use AnimatedButton white variant for hero CTA"
```
