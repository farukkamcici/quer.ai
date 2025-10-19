# Querai Design System v1

Lightweight, token-driven system for consistent UI across marketing and app.

— Stack: Next.js App Router, Tailwind CSS v4, Radix UI primitives, lucide-react icons, framer-motion.

## Tokens Overview

Authoritative tokens live in two places and are wired together:

- Brand tokens: `app/globals.css` under “Querai Design System v1 — CSS Variables” (`--qr-*`).
- JS tokens: `lib/brand/tokens.js` for programmatic use (charts, animations).

Tailwind theme tokens (`--background`, `--foreground`, `--primary`, etc.) are mapped to the brand tokens in `app/globals.css`, so utilities like `bg-background` and `text-foreground` reflect the Querai palette.

Dark mode is attribute-based with `[data-theme="dark"]` and uses Tailwind’s `dark:` variant (a `.dark` class is also applied for compatibility).

## Color System

CSS variables (light) defined in `app/globals.css`:

- `--qr-bg`: app background
- `--qr-surface`: elevated surface (opaque in light, translucent in dark)
- `--qr-border`: subtle outline color
- `--qr-text`: primary text color
- `--qr-subtle`: secondary text
- `--qr-primary`: brand primary (actions, highlights)
- `--qr-accent`: accent hue for highlights
- `--qr-hover`: low-contrast hover fill

These are mapped to Tailwind’s theme tokens:

- `--background` ← `--qr-bg`
- `--foreground` ← `--qr-text`
- `--card`, `--popover` ← `--qr-surface`
- `--primary` ← `--qr-primary`, `--primary-foreground` is white in light
- `--secondary`, `--muted`, `--accent` tuned for subtle fills
- `--border`, `--input` ← `--qr-border`
- `--ring` tuned for visible focus on both themes

Light mode primary is `#0b111f` (applies to buttons and `--primary`).

Dark mode uses a navy-forward scheme:
- `--qr-primary`: `#1b2a4b` (dark navy for primary/buttons)
- `--qr-hover`: `rgba(27, 42, 75, 0.45)` unified hover fill for dark surfaces
- Accents adjusted to navy family (`#3b4f7d`)

Dark mode overrides all of the above under `[data-theme="dark"]` with higher contrast text, translucent surfaces, and softened hover fills.

Charts use `lib/brand/charts.js` palettes (`getChartTheme(theme)`) aligned to the brand hues.

## Typography

- UI font: Geist Sans via `next/font` (`--font-geist-sans`), applied on `<body>`.
- Mono: Geist Mono (`--font-geist-mono`) for code/metrics.
- Recommended sizes (from `tokens.typography`): `h1/h2` are clamp-based, body `16px`, small `14px`.

Note: `lib/brand/tokens.js` references Plus Jakarta as a fallback; Geist is the canonical UI font in this app.

## Radius and Elevation

- Radius tokens: `--qr-radius-sm|md|lg|xl` (8/12/16/20px). Components generally use `rounded-md|lg|xl` matching these.
- Shadows: `--qr-shadow-sm|md|lg` used via arbitrary values, e.g. `shadow-[var(--qr-shadow-md)]` for consistent depth.

## Motion

- Framer wrappers in `components/brand/Motion.jsx`:
  - `FadeIn`: subtle translate+fade on enter
  - `Stagger`: sequence children with small gaps
  - `InViewSection`: reveal on scroll
- Durations in `lib/brand/tokens.js` → `motion` (`fast/base/slow`) with easing presets.

## Surfaces

`components/brand/Surface.jsx`

- `plain`: transparent container
- `card`: surface + border + shadow
- `glass`: surface + border + backdrop blur + shadow

Use `Surface` for any panel, sidebar, or card to inherit brand elevation and borders.

## Theme Behavior

- Initial theme is decided in `app/layout.js` before hydration: localStorage `theme` or system preference. It sets `data-theme` and toggles `.dark` for Tailwind’s `dark:`.
- Manual toggle: `components/brand/ThemeToggle.jsx` (inline or floating button). Persists to localStorage.

## Popups (Dialogs)

- Component: `components/ui/dialog.jsx`.
- Surface: white in light mode (`#ffffff`), navy in dark mode (`#0b1529`).
- Border/shadow: tokenized (`border-[var(--qr-border)]`, `shadow-[var(--qr-shadow-lg)]`).
- Text: `text-neutral-900` light, `dark:text-[color:var(--qr-text)]` dark.

## UI Components (Radix wrappers)

Located in `components/ui/*` and styled with Tailwind + tokens:

- `button.jsx`: variants `default|primary|gradient|destructive|outline|secondary|ghost|link`; sizes `sm|default|lg|icon(-sm|-lg)`. Uses `--qr-primary`, border/ring tokens, and consistent focus states. In dark mode, buttons adopt the navy primary and hover using `--qr-hover` for a unified feel.
- `input.jsx`: surface/border/text tokens, tailored selection color, clear focus ring.
- `card.jsx`: `plain|glass|elevated` variants with surface and shadow tokens; header/content/footer slots.
- `dialog.jsx`, `dropdown-menu.jsx`, `select.jsx`, `radio-group.jsx`, `accordion.jsx`, `avatar.jsx`, `label.jsx`: Radix primitives with consistent borders, radii, and focus.

Guideline: prefer tokenized classes (e.g., `bg-[var(--qr-surface)]`, `border-[var(--qr-border)]`, `text-[var(--qr-text)]`) over hard-coded colors.

### Forms: Radio and File Input

- Radio: `components/ui/radio-group.jsx` uses tokenized border and focus; selected dot is `bg-[color:var(--qr-primary)]`.
- File input: `components/connections/AddConnectionButton.jsx` maps the control to tokens; file button uses primary background with correct foreground and hover.

## Layout Patterns

- Dual sidebars (`components/layout/Sidebar.jsx`, `ChatSidebar.jsx`) with collapse toggles. Width transitions (`w-80` ↔ `w-20`) and state persisted in localStorage. Each sidebar wraps content in `Surface variant="glass"` and uses tokenized borders and `--qr-hover` for hover states.
- Selection: data source items show a green outline when selected (`border-green-500` in both themes). Icons also shift to green to confirm selection.
- Marketing sections use `components/brand/Gradient.jsx` for soft gradient backgrounds and CTA accents.

## Tailwind v4 Notes

- `@import "tailwindcss"` and `@theme inline` in `app/globals.css` expose CSS custom properties to Tailwind utilities.
- `@custom-variant dark` binds the `.dark` variant for attribute-based theming.
- Use utilities like `bg-background`, `text-foreground`, `ring-ring`, and `border-border` to stay aligned with theme mapping.

## Accessibility

- Maintain color contrast ≥ 4.5:1 for text; tokens are tuned to meet contrast on both themes.
- Preserve visible focus using `focus-visible:ring-2` and `ring-ring` mappings.
- Consider `prefers-reduced-motion` by keeping motion subtle; avoid essential content depending on animation.

## Implementation Notes (Current App)

- Light primary: `#0b111f` unified across buttons and `--primary`.
- Dark primary: navy (`#1b2a4b`) with unified hover fill in dark.
- Popups: `#ffffff` light, `#0b1529` dark.
- Selected data source: green outline (`border-green-500`) and icon tint.
- Chat and connection lists: neutral grays removed in favor of tokens; hover uses `--qr-hover` consistently.

## Usage Example

```tsx
import { Surface } from "@/components/brand/Surface";
import { FadeIn } from "@/components/brand/Motion";

export function ExampleCard() {
  return (
    <FadeIn>
      <Surface variant="glass" className="p-6">
        <h3 className="text-lg font-semibold">Title</h3>
        <p className="text-sm text-[color:var(--qr-subtle)]">Body copy...</p>
      </Surface>
    </FadeIn>
  );
}
```

## Developer Guidelines

- Use brand tokens and Tailwind theme aliases; avoid hard-coded color values.
- Reuse `Surface`, `Card`, and UI primitives; don’t restyle from scratch.
- Keep animations in the 200–600ms window; use `Motion` helpers for consistency.
- Icons: lucide-react across the app.
- When adding components, expose a minimal set of `variant`/`size` options via `cva` for consistency.
