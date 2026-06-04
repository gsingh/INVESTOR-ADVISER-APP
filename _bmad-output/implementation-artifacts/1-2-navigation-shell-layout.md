---
baseline_commit: c608092a06936ab1cd78d430b0366c1fed4fe685
---

# Story 1.2: Navigation Shell & Layout

Status: done

## Story

As Boss,
I want a sidebar navigation that lets me move between sections of the app,
So that I can access goals, fund research, portfolio, reviews, and settings easily.

## Acceptance Criteria

### AC1: AppShell renders with Sidebar, Topbar, and content area
**Given** Story 1.1 is complete,
**When** I log in and see the app,
**Then** an AppShell renders with a Sidebar (left), Topbar (top), and content area
**And** the sidebar is fixed 260px wide on lg+ viewports (1024px+).

### AC2: Sidebar collapses to icon-only on medium viewports
**Given** I am on a medium viewport (768-1023px),
**When** the sidebar renders,
**Then** it collapses to icon-only with tooltips on hover.

### AC3: Sidebar opens as Sheet overlay on small viewports
**Given** I am on a small viewport (<768px),
**When** I tap the hamburger icon,
**Then** the sidebar opens as a Sheet overlay.

### AC4: Sidebar items highlight with green accent pill on navy
**Given** I click a sidebar item,
**When** the section becomes active,
**Then** it highlights with a green (#2E8B57) accent pill on navy (#1B3A5C) background
**And** hover state uses lighter navy (#2A4F7A) background.

### AC5: All routes render placeholder pages with type-safe lazy loading
**Given** the route tree is configured,
**When** I navigate between sections,
**Then** each route (Dashboard, Goals, Goal Detail, Profiling, Universe Browser, Scorecard, Fund Detail, Portfolio, Reviews, Journal, Settings) renders a placeholder page
**And** routes are type-safe and lazy-loaded via TanStack Router.

## Tasks / Subtasks (Implementation Order)

### 1. Create layout components
- [x] Create `src/components/layout/AppShell.tsx` — wraps Sidebar + Topbar + `<Outlet />` content area
- [x] Create `src/components/layout/Sidebar.tsx` — responsive sidebar with nav items, active state, icon-only mode, Sheet mode
- [x] Create `src/components/layout/Topbar.tsx` — top bar with hamburger (mobile), page title placeholder
- [x] Create `src/hooks/useSidebar.ts` — manages sidebar open/close state, responsive breakpoint detection

### 2. Configure route tree with all 11 surfaces
- [x] Update `src/routeTree.gen.ts` with all routes (Dashboard, Goals, Goal Detail, Profiling, Universe Browser, Scorecard, Fund Detail, Portfolio, Reviews, Journal, Settings)
- [x] Create placeholder route files for each surface under `src/routes/`
- [x] Wire AppShell as root layout in `__root.tsx`
- [x] Configure lazy loading via React.lazy + TanStack Router code splitting

### 3. Implement responsive sidebar behavior
- [x] Fixed 260px on lg+ (1024px+) with full nav labels + icons
- [x] Icon-only on md (768-1023px) with tooltip on hover
- [x] Sheet overlay on sm (<768px) triggered by hamburger in Topbar
- [x] Use `window.matchMedia` for breakpoint detection in `useSidebar` hook

### 4. Style sidebar per DESIGN.md
- [x] Navy (#1B3A5C) background, white text via `bg-sidebar-bg`/`text-white` classes
- [x] Active item: green (#2E8B57) accent pill via `bg-sidebar-active` CSS variable
- [x] Hover state: lighter navy (#2A4F7A) background via `hover:bg-sidebar-hover`
- [x] Nav items: 8px vertical padding, 16px horizontal padding (responsive to collapsed state)
- [x] Icon sizing consistent at `h-4 w-4` with `lucide-react` icons

### 5. Verify end-to-end
- [x] `tsc -b` passes — zero type errors
- [x] `vite build` succeeds — proper code-split chunks per route
- [x] All routes render placeholder pages with icon + title + description
- [x] Sidebar responsive behavior works (3 breakpoints via matchMedia)
- [x] Active nav item highlights green via TanStack Router `activeProps`
- [x] Navigation works between all 11 surfaces via `<Link>` components

## Dev Notes

### Architecture Requirements
- **Layout structure**: `src/components/layout/AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx` — [Source: architecture.md#L289-L295]
- **Route structure**: TanStack Router with lazy-loaded file-based routes — [Source: architecture.md#L261-L288]
- **Sidebar hook**: `src/hooks/useSidebar.ts` — [Source: architecture.md#L338]
- **Naming**: PascalCase for components, kebab-case for route paths, camelCase for hooks — [Source: architecture.md#L199-L206]

### UX Design Requirements
- UX-DR3: Sidebar navigation — fixed 260px (lg+), icon-only (md), Sheet (sm) — navy bg, green active pill, lighter navy hover — [Source: DESIGN.md#L89-L99]
- UX-DR17: Responsive sidebar — fixed on lg, icon-only on md, Sheet on sm — [Source: DESIGN.md#L165]
- UX-DR18: WCAG AA — screen reader announces page surface on navigation, visible focus rings — [Source: EXPERIENCE.md#L130-L141]

### Brand Tokens (from DESIGN.md)
- Sidebar bg: `#1B3A5C`, fg: `#FFFFFF`
- Sidebar active: `#2E8B57` (green pill)
- Sidebar hover: `#2A4F7A` (lighter navy)
- Sidebar width: 260px
- Typography: Label (13px, 500 weight, 0.01em letter-spacing) for sidebar items
- Rounded: md (6px) for sidebar items

### Route Table (from architecture.md#L364-L375)
| IA Surface | Route path | File |
|---|---|---|
| Dashboard | `/` | `src/routes/index.tsx` |
| Profiling | `/profiling` | `src/routes/profiling/index.tsx` |
| Goals List | `/goals` | `src/routes/goals/index.tsx` |
| Goal Detail | `/goals/$goalId` | `src/routes/goals/$goalId.tsx` |
| Universe Browser | `/universe-browser` | `src/routes/universe-browser/index.tsx` |
| Scorecard | `/scorecard` | `src/routes/scorecard/index.tsx` |
| Fund Detail | `/scorecard/$schemeCode` | `src/routes/scorecard/$schemeCode.tsx` |
| Portfolio | `/portfolio` | `src/routes/portfolio/index.tsx` |
| Reviews | `/reviews` | `src/routes/reviews/index.tsx` |
| Journal | `/journal` | `src/routes/journal/index.tsx` |
| Settings | `/settings` | `src/routes/settings/index.tsx` |

### Key Implementation Details
- Use `@tanstack/react-router` `createLazyRoute` / `lazy` for code-splitting
- Import existing shadcn Sheet component from `src/components/ui/sheet.tsx` for mobile sidebar
- Use lucide-react icons for sidebar nav items (already available via shadcn deps)
- Sidebar items: Dashboard (LayoutDashboard), Goals (Target), Profiling (UserCheck), Universe Browser (Search), Scorecard (BarChart3), Portfolio (PieChart), Reviews (ClipboardCheck), Journal (BookOpen), Settings (Settings)
- Topbar shows page title based on current route
- `useSidebar` hook manages: `isOpen` (boolean for mobile Sheet), `isCollapsed` (boolean for icon-only state), responds to window resize
- Tailwind responsive prefixes: `lg:`, `md:` for breakpoints

### Previous Story Learnings (Story 1.1)
- shadcn init used Radix base with Nova preset — all components manually created
- Tailwind v4 uses `@import "tailwindcss"` with `@theme inline` — no tailwind.config.js
- `npm` symlink broken on this machine — use `node /usr/local/lib/node_modules/npm/bin/npm-cli.js` or the shell function wrapper
- `@/` alias resolves to `/src`
- Build verification: `tsc -b && vite build`

### Files to Create
- `src/components/layout/AppShell.tsx` (NEW)
- `src/components/layout/Sidebar.tsx` (NEW)
- `src/components/layout/Topbar.tsx` (NEW)
- `src/hooks/useSidebar.ts` (NEW)
- `src/routes/index.tsx` (NEW — Dashboard placeholder)
- `src/routes/profiling/index.tsx` (NEW)
- `src/routes/goals/index.tsx` (NEW)
- `src/routes/goals/$goalId.tsx` (NEW)
- `src/routes/universe-browser/index.tsx` (NEW)
- `src/routes/scorecard/index.tsx` (NEW)
- `src/routes/scorecard/$schemeCode.tsx` (NEW)
- `src/routes/portfolio/index.tsx` (NEW)
- `src/routes/reviews/index.tsx` (NEW)
- `src/routes/journal/index.tsx` (NEW)
- `src/routes/settings/index.tsx` (NEW)

### Files to Modify
- `src/routeTree.gen.ts` — add all 11 routes with lazy loading under root layout
- `src/routes/__root.tsx` — wrap with AppShell layout

### Testing Standards
- No automated tests required for this story (layout/navigation infrastructure)
- Verify manually: `npm run dev` starts, all routes render, sidebar responsive behavior works
- Verify: `tsc -b` passes, `vite build` succeeds

## Dev Agent Record

### Completion Notes
- Created `AppShell.tsx` as root layout with Sidebar (left), Topbar (top), and `<Outlet />` content area
- Created `Sidebar.tsx` with 3 responsive modes: fixed 260px (lg+), icon-only 64px w/ tooltips (md), Sheet overlay (sm)
- Created `Topbar.tsx` with hamburger trigger (visible on mobile) and dynamic page title
- Created `useSidebar.ts` hook using `window.matchMedia` for breakpoint detection
- Created 11 placeholder route files (Dashboard, Profiling, Goals, Goal Detail, Universe Browser, Scorecard, Fund Detail, Portfolio, Reviews, Journal, Settings)
- Updated `routeTree.gen.ts` with all 11 routes as rootRoute children using React.lazy code splitting
- Updated `__root.tsx` to use AppShell as root layout
- Sidebar styling per DESIGN.md: navy sidebar-bg, green sidebar-active pill, lighter navy sidebar-hover
- Used lucide-react for nav item icons, shadcn Sheet for mobile sidebar, shadcn Tooltip for icon-only labels
- Brand text "Investor Adviser" in sidebar header, "IA" abbreviated when collapsed
- Dynamic page titles via `useLocation` pathname matching in AppShell

### Build Verification
- `tsc -b` passes — zero type errors
- `vite build` succeeds with proper code-split chunks: 11 route chunks + vendor chunk
- `docker build` succeeds (cached)

### File List
- `src/components/layout/AppShell.tsx` (NEW)
- `src/components/layout/Sidebar.tsx` (NEW)
- `src/components/layout/Topbar.tsx` (NEW)
- `src/hooks/useSidebar.ts` (NEW)
- `src/routes/index.tsx` (NEW — Dashboard placeholder)
- `src/routes/profiling/index.tsx` (NEW)
- `src/routes/goals/index.tsx` (NEW)
- `src/routes/goals/$goalId.tsx` (NEW)
- `src/routes/universe-browser/index.tsx` (NEW)
- `src/routes/scorecard/index.tsx` (NEW)
- `src/routes/scorecard/$schemeCode.tsx` (NEW)
- `src/routes/portfolio/index.tsx` (NEW)
- `src/routes/reviews/index.tsx` (NEW)
- `src/routes/journal/index.tsx` (NEW)
- `src/routes/settings/index.tsx` (NEW)
- `src/routeTree.gen.ts` (MODIFIED)
- `src/routes/__root.tsx` (MODIFIED)
- `src/App.tsx` (MODIFIED)

## Review Findings

### Patch
- [x] [Review][Patch] Duplicate @tanstack/react-router imports [src/components/layout/AppShell.tsx:1,5] — combined into single import
- [x] [Review][Patch] Dead App.tsx component [src/App.tsx] — removed unused component
- [x] [Review][Patch] Page title missing truncate [src/components/layout/Topbar.tsx:21] — added `truncate` class

### Deferred
- [x] [Review][Defer] No error boundaries for lazy-loaded routes [src/routes/*] — pre-existing; will be addressed when routes have real content
