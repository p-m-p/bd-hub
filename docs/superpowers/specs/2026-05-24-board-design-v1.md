# Board Design v1

**Date:** 2026-05-24  
**Status:** Approved  
**Scope:** Layout, sticky headers, card styling, column tally, View Transitions, global CSS reset

---

## Goals

Deliver a polished, minimal kanban board that feels production-grade without being over-engineered. All styling uses modern CSS — no CSS frameworks, no external component libraries beyond what is already in the stack (Lit, Material Web tokens for colour). The design must degrade gracefully: View Transitions are an enhancement, not a requirement for correctness.

---

## Global CSS Reset

Applied once in `index.html` via a `<style>` tag (not a Lit component):

```css
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: system-ui, -apple-system, sans-serif;
  background: #1e1e2e;   /* --bd-mocha-base */
  color: #cdd6f4;         /* --bd-mocha-text */
}
```

No scrollbar on `body` — scrolling happens inside the board container.

---

## Layout Architecture

### Overall structure

```
bd-board (host fills viewport)
  ├── .column-header-row   ← position: sticky; top: 0; z-index: 20
  └── .board-scroll        ← flex-col, overflow-y: auto, flex: 1
        ├── bd-epic-lane
        │     ├── .epic-header  ← position: sticky; top: var(--col-header-h); z-index: 10
        │     └── .columns      ← display: grid; grid-template-columns: repeat(4, 1fr)
        │           ├── bd-column[column=open]
        │           ├── bd-column[column=ready]
        │           ├── bd-column[column=inProgress]
        │           └── bd-column[column=done]
        └── bd-epic-lane (next epic…)
```

### Column header row

- Single row rendered by `bd-board`, not repeated per lane.
- `position: sticky; top: 0; z-index: 20`
- Four equal cells with column labels: **Open**, **Ready**, **In Progress**, **Done**.
- "In Progress" cell uses accent blue (`--bd-mocha-blue: #89b4fa`); "Done" uses green (`--bd-mocha-green: #a6e3a1`); others use subtext (`--bd-mocha-subtext`).
- `bd-column` no longer renders a column header — that markup and style is removed.
- The header row height is exposed as a CSS custom property on `:host` so epic headers can reference it: `--col-header-h: 2rem`.

### Epic header

- Rendered inside `bd-epic-lane`, spans all four columns (full width, `grid-column: 1 / -1` or outside the grid).
- `position: sticky; top: var(--col-header-h); z-index: 10`
- Background matches the board base (`--bd-mocha-base`) so it occludes cards scrolling beneath it.
- Contains: epic title (left, `--bd-mocha-blue`, 0.875rem, weight 600). No per-column tally here.
- A `2px solid` top border (`--bd-mocha-surface`) provides visual separation between epic sections.

### Board scroll container

- `bd-board` sets itself to `height: 100dvh; display: flex; flex-direction: column`.
- `.board-scroll` takes `flex: 1; overflow-y: auto; overflow-x: hidden`.
- This confines scrolling to the board body; the column header row stays pinned.

---

## Column layout

Inside each epic lane, the four `bd-column` components sit in a CSS grid:

```css
.columns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
```

Vertical column separators are `1px solid var(--bd-mocha-surface)` right borders on the first three columns (last column has no right border). No horizontal padding on the grid itself — each `bd-column` owns its internal padding (`0.5rem 0.625rem`).

---

## Column tally

Rendered at the **bottom** of each `bd-column`, below the task cards, separated by a 1px top border:

```
┌─────────────────────┐
│ [card]              │
│ [card]              │
├─────────────────────┤
│ 2 tasks             │  ← 0.65rem, --bd-mocha-subtext, centered
└─────────────────────┘
```

- If the column is empty, shows `—`.
- Singular/plural: "1 task" / "2 tasks".
- Minimum column height `3rem` ensures the tally always anchors to the bottom even with zero cards (use `min-height: 3rem` + `display: flex; flex-direction: column; justify-content: flex-end` on the tally wrapper).

---

## Card design — Elevated (option B)

Background: `--bd-mocha-surface` (`#313244`)  
Border radius: `6px`  
Shadow: `0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)`  
Padding: `0.65rem 0.75rem`  
Margin-bottom between cards: `0.5rem`

### Card anatomy

```
┌──────────────────────────────────┐
│ Title text (0.825rem, wrap)  [P2]│  ← priority chip top-right
│ auth-3xk              2/5 subtask│  ← id monospace + subtask tally
└──────────────────────────────────┘
```

- **Title:** `0.825rem`, `--bd-mocha-text`, `line-height: 1.35`, `flex: 1`
- **Priority chip:** coloured background badge (`f9e2af`/`fab387`/`f38ba8`/`a6e3a1`/surface), `#1e1e2e` text, `0.6rem`, `font-weight: 700`. Done-column cards use a muted surface chip with a border.
- **Bead ID:** `0.625rem`, monospace, `--bd-mocha-subtext`
- **Subtask tally:** `0.625rem`, `--bd-mocha-subtext`, right-aligned on the meta row. Only shown when `subtaskTotal > 0`. Format: `N / M subtasks`.
- **Done cards:** `opacity: 0.5` on the entire card.
- **No assignee display** at this stage (field exists in data, not shown in v1 — YAGNI).

---

## View Transitions

### Trigger point

`board-store.ts` wraps state updates from SSE in `document.startViewTransition()`:

```ts
if ('startViewTransition' in document) {
  document.startViewTransition(() => { this.boardState = newState })
} else {
  this.boardState = newState   // graceful degradation
}
```

Initial load (from `loadInitialState`) does **not** use a transition — no "before" snapshot exists.

### Card identification

Each `bd-task-card` sets a unique `view-transition-name` in its shadow styles:

```ts
// computed in render()
const vtName = `card-${this.beadId.replace(/[^a-z0-9]/gi, '-')}`
```

Applied via inline style on the `.card` div:

```html
<div class="card" style="view-transition-name: ${vtName}">
```

This tells the browser to track this specific element across the transition and animate it moving from its old position (column A) to its new position (column B). Bead IDs are globally unique within a project so name collisions cannot occur.

### CSS animation

```css
/* In bd-board or index.html global styles */
::view-transition-group(*) {
  animation-duration: 300ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
::view-transition-old(*) {
  animation: none;  /* suppress fade-out — card slides, not fades */
}
::view-transition-new(*) {
  animation: none;
}
```

The `view-transition-group` handles the FLIP-style position animation automatically. Suppressing old/new fade keeps it feeling like a physical move rather than a cross-fade.

### Scope

- View Transitions are a progressive enhancement. If `startViewTransition` is unavailable the board updates instantly with no animation — data is never blocked.
- Cards that are off-screen at transition time animate as simple appear/disappear (browser default) — no custom handling needed.
- The `@view-transition { navigation: auto }` opt-in is **not** used — this is an SPA with no navigations.

---

## Component changes summary

| Component | Change |
|---|---|
| `index.html` | Add global CSS reset + `system-ui` font |
| `bd-board` | Add `.column-header-row` sticky row; add `.board-scroll` container; expose `--col-header-h`; remove per-board padding |
| `bd-epic-lane` | Make `.epic-header` sticky with `top: var(--col-header-h)`; remove per-column tally from header; add 2px top separator border |
| `bd-column` | Remove `.column-header` entirely; add bottom tally; add right-border separator; adjust padding |
| `bd-task-card` | Apply shadow + border-radius card style; add inline `view-transition-name`; done-card opacity; remove assignee display |
| `board-store.ts` | Wrap SSE state updates in `startViewTransition()` with feature detection |

---

## Out of scope (v1)

- Horizontal scrolling for narrow viewports
- Epic collapse/expand
- Drag-and-drop card reordering
- Assignee display on cards
- Blocked task visual indicator
- Dark/light theme toggle
- Responsive / mobile layout
