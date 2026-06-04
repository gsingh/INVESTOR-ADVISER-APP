---
status: final
created: 2026-06-03
updated: 2026-06-03
colors:
  primary: '#1B3A5C'
  primary-foreground: '#FFFFFF'
  accent: '#2E8B57'
  accent-foreground: '#FFFFFF'
  primary-dark: '#4A7FB5'
  primary-foreground-dark: '#0F1F30'
  accent-dark: '#5DAE7D'
  accent-foreground-dark: '#0F1F30'
  muted: '#F5F7FA'
  muted-foreground: '#6B7280'
  card: '#FFFFFF'
  card-foreground: '#1F2937'
  border: '#E5E7EB'
  input: '#D1D5DB'
  ring: '#1B3A5C'
  destructive: '#DC2626'
  destructive-foreground: '#FFFFFF'
  sidebar-bg: '#1B3A5C'
  sidebar-fg: '#FFFFFF'
  sidebar-active: '#2E8B57'
  sidebar-hover: '#2A4F7A'
  positive: '#2E8B57'
  negative: '#DC2626'
  warning: '#F59E0B'
typography:
  display:
    fontFamily: 'Inter'
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.25'
  display-sm:
    fontFamily: 'Inter'
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: 'Inter'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: 'Inter'
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: '0.01em'
  small:
    fontFamily: 'Inter'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  mono:
    fontFamily: 'JetBrains Mono'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  sidebar-width: 260px
  content-max-width: 1200px
  section-gap: 24px
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  button-success:
    background: '{colors.accent}'
    foreground: '{colors.accent-foreground}'
    radius: '{rounded.md}'
  button-danger:
    background: '{colors.destructive}'
    foreground: '{colors.destructive-foreground}'
    radius: '{rounded.md}'
  card:
    background: '{colors.card}'
    foreground: '{colors.card-foreground}'
    border: '1px solid {colors.border}'
    radius: '{rounded.md}'
  sidebar:
    background: '{colors.sidebar-bg}'
    foreground: '{colors.sidebar-fg}'
    width: '{spacing.sidebar-width}'
  sidebar-item:
    padding: '8px 16px'
    radius: '{rounded.md}'
  sidebar-item-active:
    background: '{colors.sidebar-active}'
  sidebar-item-hover:
    background: '{colors.sidebar-hover}'
  input:
    border: '1px solid {colors.input}'
    radius: '{rounded.md}'
    padding: '8px 12px'
  table-header:
    background: '{colors.muted}'
    foreground: '{colors.muted-foreground}'
  table-row-hover:
    background: '{colors.muted}'
  badge:
    radius: '{rounded.full}'
    padding: '2px 8px'
  progress-bar:
    background: '{colors.border}'
    fill: '{colors.accent}'
  drift-indicator:
    within-threshold: '{colors.muted}'
    exceeded: '{colors.warning}'
    critical: '{colors.destructive}'
---

## Brand & Style

Investor Adviser App is a personal financial decision-support tool for a self-directed Indian investor new to the stock market. The brand is **professional, calm, and trustworthy** — like a well-organized desk rather than a trading floor. Navy blue anchors authority; green accent signals growth and positive action. The visual language is clean, low-chrome, and information-dense where it needs to be, with generous whitespace around decision points (goal setup, review screens).

**Core principles embedded in the visual identity:**
- **Transparency over prediction** — scoring logic is always visible (sliders, weights explained). No black-box UI.
- **Category-first thinking** — fund browsing groups by AMFI category prominently; scheme-level data is one click deeper.
- **Goal orientation** — every fund shown in context of a goal; unassigned holdings visually distinguished.
- **Review discipline** — review screens have a distinct visual treatment (card state with checklist layout) vs. browsing screens.
- **Personal-use simplicity** — no multi-user chrome (avatars, collaborator indicators, team names). Single-profile interface.

The app inherits shadcn/ui defaults as the base layer. This DESIGN.md specifies only the brand-layer deltas — color palette, typography ramp, component overrides, and sidebar-specific tokens. 80% of components ship from shadcn (Button, Card, Dialog, Sheet, Popover, DropdownMenu, Toast, Tabs, Separator, Table, Badge, Input, Select) and keep their default visual specs.

## Colors

The palette has three layers: brand primary, growth accent, and semantic indicators.

- **Primary Navy (`#1B3A5C` light / `#4A7FB5` dark)** — The anchor. Sidebar background, primary buttons, active nav indicators, link underlines. Replaces shadcn's default primary.
- **Growth Green (`#2E8B57` light / `#5DAE7D` dark)** — The accent. Used exclusively for positive financial indicators: goal progress fill, XIRR positive values, "on track" status, success toasts. Never decorative.
- **Semantic tokens** — Red (`#DC2626`) for negative drift, losses, destructive actions. Amber (`#F59E0B`) for warnings, drift warnings, near-term flags. Inherited from shadcn.
- **All other tokens** (`background`, `foreground`, `muted`, `muted-foreground`, `border`, `input`, `ring`, `card`, `popover`, `destructive`) inherit shadcn defaults, adjusted for the professional financial context.
- **Sidebar-specific** — Dark navy sidebar (`#1B3A5C` background) with white text, green active indicator, lighter navy hover state.

Avoid: chromatic flourishes, gradient surfaces, decorative color blocks, emoji in financial data displays. The discipline is three-color-plus-semantic-and-stop.

**Dark mode:** The frontmatter includes `-dark` token variants for future use. No dark mode toggle in v1 — light mode only. Dark mode tokens are predefined to simplify future implementation. When dark mode is added, invert `primary` and `primary-foreground` for sidebar, and swap `card`/`background` to dark shades.

## Typography

All type inherits shadcn's Inter ramp by default. No display serif — the app is data-forward, not editorial.

- **Display (28px, 600 weight)** — Page titles (Dashboard, Screener, Portfolio). Never used for body text.
- **Display-sm (20px, 600 weight)** — Section headers, goal names.
- **Body (14px, 400 weight)** — All reading text, table cells, card body content.
- **Label (13px, 500 weight, 0.01em letter-spacing)** — Form labels, sidebar items, column headers.
- **Small (12px, 400 weight)** — Helper text, metrics, badges, secondary data.
- **Mono (13px, JetBrains Mono)** — NAV values, fund codes, percentages, XIRR figures. Distinguishes financial data from prose.

Avoid: font-weight below 400 for readability. Avoid all-caps for body text — labels may use sparingly.

## Layout & Spacing

Inherits the shadcn/Tailwind spacing scale (4-based: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64).

- **Sidebar**: Fixed 260px on `lg+` (1024px+). Collapses to icon-only on `md` (768-1023px). Becomes a Sheet on `sm` (< 768px).
- **Content max-width**: 1200px for data-dense screens (dashboard, screener results, holdings).
- **Section gap**: 24px between major content blocks.
- **Card padding**: 16px inner padding, 24px for focus/summary cards.

## Elevation & Depth

Inherited from shadcn — subtle shadow on hover/active states. No elevation as a primary hierarchy device. Cards have a thin 1px border (`#E5E7EB`) rather than shadow for structure — reads cleaner for financial data. Elevated cards (dialogs, sheets) use shadcn shadow defaults.

## Shapes

- `rounded/sm` (4px) — Inputs, table cells, badges.
- `rounded/md` (6px) — Cards, buttons, dialogs.
- `rounded/lg` (8px) — Large dialogs, sheet panels.
- `rounded/full` (pill) — Status badges, progress indicators.

## Components

Uses the following shadcn components as-is, unchanged: `Button`, `Card`, `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Toast`, `Tabs`, `Separator`, `Avatar`, `Table`, `Badge`, `Input`, `Select`, `Progress`.

Brand-layer-overridden components:

- **Button (primary)** — `{colors.primary}` fill, `{colors.primary-foreground}` text, `{rounded.md}`. Other variants (secondary, outline, ghost, destructive) inherit shadcn defaults.
- **Button (success)** — `{colors.accent}` fill, `{colors.accent-foreground}` text. Used for "Add SIP", "Confirm allocation", "Mark on track".
- **Button (danger)** — `{colors.destructive}` fill, white text. Destructive confirmations.
- **Sidebar** — Full-height fixed column. `{colors.sidebar-bg}` background, white text. Items have 8px vertical padding, 16px horizontal. Active item gets green background pill. Hover gets lighter navy background.
- **Card** — White background, 1px `{colors.border}` stroke, `{rounded.md}`. Used throughout for dashboard widgets, fund details, goal summaries.
- **Input / Select** — 1px `{colors.input}` border, `{rounded.md}`, 8px 12px inner padding.
- **Table header** — `{colors.muted}` background, `{colors.muted-foreground}` text. No border-bottom separation — rows use alternating subtle background (`#F9FAFB`).
- **Badge** — Pill shape, small padding. Green for "on track", amber for "watch", red for "off track", gray for neutral.
- **Progress bar** — Gray track (`{colors.border}`), green fill (`{colors.accent}`). Drift-indicator overlay: small dot or inline tag.
- **Drift indicator** — Three states: green (within 5%), amber (5-10%), red (>10%). Inline pill shown next to allocation percentages.
- **Scorecard factor row** — Factor name, weight badge, raw score, weighted contribution bar (green/amber based on score range), 1-line explanation text. Alternating row backgrounds for readability.
- **Scorecard total** — Large composite score number (mono, 32px) at top. Below: mini donut or stacked bar showing weight distribution across factors.
- **Overlap indicator** — Single progress bar with two segments: new exposure (green) and overlap (neutral gray). Percentage label in center. Context line below.
- **Alert card** — Accent-left-border style (amber for warning, red for critical). Icon (info/warning/error) at top-left. Alert title, description, timestamp, and "Start Review" action button. Dismissible via close icon.
- **SIP projection chart** (used by `EXPERIENCE.md` SIP Calculator) — Line chart with 3 projection lines (conservative, moderate, optimistic). Horizontal dashed target line. Gap area highlighted in amber if shortfall exists. Legend below chart.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Inherit shadcn defaults for everything not in the brand layer | Override shadcn's core tokens beyond primary and accent |
| Use green accent only for positive financial indicators | Use green for chrome, navigation, or decorative elements |
| Monospace for financial figures (NAV, percentages, XIRR) | Mixed fonts in table cells — keep financial data in mono |
| Information-dense layouts with clear visual hierarchy | Dense layouts without section gaps or card borders |
| Sidebar as primary navigation on desktop | Tab bars or bottom nav for primary navigation |
| Professional, sober visual tone | Gamification elements, celebratory animations, emoji |
| Show scoring logic and inputs inline | Black-box scores with no explanation of factors |
| Distinguish review screens visually from browsing screens | Same layout for decision and monitoring views |
