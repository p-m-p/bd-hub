# Beads Dashboard — Design Spec

**Date:** 2026-05-19
**Status:** Approved

## Overview

`beads-dashboard` is an npm package that provides a kanban-style UI for visualising tasks tracked in beads (`bd`). Run via `npx beads-dashboard` from any project using beads. The server auto-discovers the `.beads/` database in the current working directory, serves a Lit frontend, and pushes realtime updates to connected clients via SSE.

---

## 1. Package Structure & Build

### Repository Layout

```
beads-dashboard/
├── index.html                  # Vite entry point, references src/client/main.ts
├── src/
│   ├── server/
│   │   ├── index.ts            # bin entrypoint: --open flag, server start, URL log
│   │   ├── app.ts              # Hono app: routes, static file serving
│   │   ├── sse.ts              # SSE endpoint and client registry
│   │   ├── watcher.ts          # chokidar watcher + debounce (300ms)
│   │   └── query.ts            # bd CLI wrappers via execa, returns typed objects
│   └── client/
│       ├── main.ts             # app entry: mounts context provider, root component
│       ├── store/
│       │   ├── board-store.ts  # fetches /api/board, manages SSE, holds state
│       │   └── context.ts      # Lit context key + board state types
│       ├── board/
│       │   ├── board.ts        # layout shell, no state ownership
│       │   └── column.ts       # single kanban column (open/ready/in-progress/done)
│       ├── epic/
│       │   └── epic-lane.ts    # full-width swim lane row per epic
│       ├── task/
│       │   ├── task-card.ts    # task card: title, ID, priority, assignee
│       │   └── subtask-tally.ts # "2 of 10 complete" indicator
│       └── ui/                 # custom Lit components not covered by Material Web
├── dist/                       # build output (gitignored)
│   ├── public/                 # Vite output — served as static files
│   └── server/                 # tsup output
├── tests/
│   ├── unit/                   # Vitest unit tests
│   └── e2e/                    # Playwright tests
│       └── setup/              # global setup: bd init, seed, server start
├── vite.config.ts
├── biome.json
└── package.json
```

### Build Pipeline

- **`pnpm build`** — runs `vite build` and `tsup src/server/index.ts --format esm` in parallel
- **`pnpm dev`** — `concurrently` starts:
  - Vite dev server on port 5173 (proxies `/api` and `/events` to Hono)
  - `tsx watch src/server/index.ts` on port 3003
- In production, Hono serves `dist/public/` as static files including `index.html`

### Future Consideration

A Vite plugin variant is a viable future path once the core package stabilises. The clean server/client boundary in this design keeps that option open.

---

## 2. Server & Realtime

### Startup (`index.ts`)

- Parses `--open` flag (opens browser) and optional `--port` override
- Auto-discovers `.beads/` DB path via `bd where`, falling back to `CWD`
- Default port: **3003**
- Logs server URL on start; opens browser if `--open` passed

### Data Querying (`query.ts`)

- Thin wrappers around `bd` CLI using `execa` — e.g. `bd list --json`, `bd sql --json`
- Returns typed TypeScript objects
- No direct Dolt/SQLite access — beads manages the Dolt server lifecycle transparently

### Realtime (`watcher.ts` + `sse.ts`)

- `chokidar` watches the `.beads/` directory for file changes
- Changes are debounced at **300ms** to avoid spawning multiple `bd` processes on rapid writes
- On flush: `query.ts` fetches full current board state; `sse.ts` broadcasts a `board-update` event to all connected clients
- Server sends full payload on each update — no delta diffing

### Routes (`app.ts`)

| Route | Purpose |
|---|---|
| `GET /api/board` | Initial board state on page load |
| `GET /events` | SSE stream |
| `GET /*` | Static files from `dist/public/` |

---

## 3. Frontend & Components

### Data Flow

State lives entirely outside the component tree:

- **`board-store.ts`** — fetches `/api/board` on init, opens SSE connection, updates state on `board-update` events. Acts as the Lit Context provider, mounted once in `main.ts`.
- **`context.ts`** — defines the context key and board state TypeScript types.
- **Components are display-only.** No component owns or mutates state.
- Components receive **bead IDs as attributes/properties** and look up their own data slice from the context store. Example: `<bd-task-card bead-id="bd-123">` selects its task from context by ID.

### Component Tree

```
<bd-board>                      # layout shell
  <bd-epic-lane>                # one per epic — full-width swim lane row
    <bd-column>                 # four columns: open / ready / in-progress / done
      <bd-task-card>            # title, ID, priority, assignee
        <bd-subtask-tally>      # "2 of 10 complete"
```

### Columns

Four fixed columns:

| Column | Content |
|---|---|
| Open | Blocked tasks only |
| Ready | Unblocked, not yet started |
| In Progress | Active tasks |
| Done | Completed tasks |

### Epics

Rendered as a full-width swim lane row above their child tasks. Shows epic title and a brief status summary (e.g. "3 in progress, 7 done"). Subtasks do not appear on the board — subtask progress shows as a tally on the parent task card.

### Styling

- Material Web Components (`@material/web`) for UI primitives
- Custom properties for theming; CSS grid for kanban layout
- No CSS-in-JS
- Catppuccin Mocha colour palette

---

## 4. Testing

### Unit Tests (Vitest)

- Store logic, SSE event handling, `query.ts` bd CLI wrappers
- `execa` mocked for bd calls
- Coverage: **v8**, minimum **85%** threshold across lines, functions, branches, statements

### Component Tests (Vitest + Lit test utilities)

- Components render correctly given context values
- Attribute/property changes trigger correct re-renders

### E2E Tests (Playwright)

Global setup bootstraps a standalone repeatable environment:

1. Create a temp directory
2. Run `bd init` in it
3. Seed known epics, tasks, subtasks via `bd create` commands
4. Start the beads-dashboard server pointed at the temp directory
5. Tests assert against known seed data
6. Teardown: kill server, delete temp directory

### Linting

- Biome: lint + format
- 2-space indent, single quotes, no semicolons

---

## 5. npm Package & Distribution

### `package.json` Key Fields

```json
{
  "name": "beads-dashboard",
  "bin": { "beads-dashboard": "dist/server/index.js" },
  "files": ["dist/"],
  "engines": { "node": ">=20" }
}
```

`bd` must be available in `PATH` — documented as a prerequisite, not enforced as a dependency.

### Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Vite (5173) + tsx watch server (3003), Vite proxies `/api` and `/events` |
| `pnpm build` | `vite build && tsup src/server/index.ts --format esm` |
| `pnpm test` | Vitest (unit + component), fails below 85% coverage |
| `pnpm test:e2e` | Playwright |
| `pnpm lint` | Biome check |

### Bin Entrypoint

`dist/server/index.js` has a `#!/usr/bin/env node` shebang and is marked executable. Behaviour:

- Auto-discovers `.beads/` in `CWD`
- Starts Hono on port 3003 (default)
- Logs server URL
- Opens browser if `--open` flag passed
