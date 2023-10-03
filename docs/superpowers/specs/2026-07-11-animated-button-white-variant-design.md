# AnimatedButton: white variant

## Context

The homepage hero (`app/(store)/page.tsx`) has a hand-rolled white-border/white-text CTA link layered over the hero photo. It doesn't use the shared `AnimatedButton` component (`components/ui/animated-button.tsx`), so it lacks the hover-fill animation every other CTA on the site has, and it's a one-off styling job that isn't reusable elsewhere a white-on-dark button might be needed.

`AnimatedButton` already supports variants (`default`, `outline`) through a small config object (`variantConfig`) — not `cva`, but the same idea: each variant declares a `container` (bg/border classes), `fill` (hover-fill bg class), and `textInitial`/`textHover` (raw color strings, since framer-motion animates literal color values, not Tailwind classes). Adding a third variant is a natural extension of this existing pattern rather than a new component.

## Design

### 1. Add a `white` variant to `variantConfig`

In `components/ui/animated-button.tsx`:

```tsx
white: {
  container: "bg-transparent border-white!",
  fill: "bg-white",
  textInitial: "white",
  textHover: "hsl(var(--foreground))",
},
```

- `border-white!` (important) is required because the component's base class hardcodes `border-primary!` (line 126) — without `!` on the variant, the base would win.
- `textHover` uses `hsl(var(--foreground))`, the theme's existing near-black token (`222.2 84% 4.9%` in `app/globals.css`), rather than a hardcoded neutral hex, keeping it consistent with how `default`/`outline` reference theme tokens.

Update the `variant` prop type from `"default" | "outline"` to `"default" | "outline" | "white"`.

### 2. Swap the hero CTA to use it

In `app/(store)/page.tsx`, replace:

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
<AnimatedButton asChild variant="white" className="px-8 py-4 text-sm uppercase tracking-wider">
  <Link href="/freediving">Lihat Koleksi</Link>
</AnimatedButton>
```

**Accepted visual change:** the base `AnimatedButton` class applies `border-2` and `rounded-[6px]`, versus the old link's thinner 1px `border-white/50` and sharp corners. This is intentional — the hero CTA should match the border weight/radius of every other animated button on the site rather than keep a bespoke look. Confirmed with user.

## Out of scope

- No changes to `components/ui/button.tsx` (the `cva`-based base button) — this is purely about `AnimatedButton`.
- No other current `AnimatedButton` usages (product-section, PDP) need the white variant; they stay on `outline`/`default`.
