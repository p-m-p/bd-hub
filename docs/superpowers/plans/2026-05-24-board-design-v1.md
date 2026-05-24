# Board Design v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the board design v1 spec — sticky column headers, sticky epic headers, elevated card style, column tallies, View Transitions on state change.

**Architecture:** Six focused changes across five files and index.html. Layout changes (tasks 1–3) refactor how the board renders its structure. Card and transition changes (tasks 4–5) are independent and can run in parallel with tasks 2–3. Task 6 depends on task 5.

**Tech Stack:** Lit 3 web components, CSS custom properties, View Transitions API, Vitest for unit tests, Playwright for E2E.

**Spec:** `docs/superpowers/specs/2026-05-24-board-design-v1.md`

**Dependency order:**
```
Task 1 (CSS reset)  ──────────────────────────────► Task 2 (board layout)
                                                          │
                                              ┌───────────┴────────────┐
                                              ▼                        ▼
                                     Task 3 (epic lane)      Task 4 (column tally)
Task 5 (card style) ────────────────────────────────────────────► Task 6 (view transitions)
```

---

## File Map

| File | Task | What changes |
|---|---|---|
| `index.html` | 1 | Add CSS reset + system-ui font in `<style>` tag |
| `src/client/board/board.ts` | 2 | Add `.column-header-row` + `.board-scroll`, expose `--col-header-h` |
| `src/client/board/column.ts` | 2 | Remove `.column-header` markup and styles |
| `src/client/epic/epic-lane.ts` | 3 | Simplify header (remove status summary), make sticky |
| `src/client/board/column.ts` | 4 | Add bottom tally, right-border separator, min-height |
| `src/client/task/task-card.ts` | 5 | Elevated card, done opacity, remove assignee |
| `src/client/board/board.ts` | 5 | Export `cardViewTransitionName` helper |
| `src/client/store/board-store.ts` | 6 | Wrap SSE updates in `startViewTransition` |
| `tests/unit/board.test.ts` | 2+4 | Tests for `tallyText`, `COLUMN_LABELS` |
| `tests/unit/task-card.test.ts` | 5 | Tests for `cardViewTransitionName`, `isDoneTask` |
| `tests/unit/board-store.test.ts` | 6 | Tests for `applyStateUpdate` with `startViewTransition` |

---

## Task 1: Global CSS reset

**Files:**
- Modify: `index.html`

No unit tests needed — visual correctness is confirmed by E2E and by reading the file.

- [ ] **Open `index.html` and replace its contents:**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>bd-hub</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        font-family: system-ui, -apple-system, sans-serif;
        background: #1e1e2e;
        color: #cdd6f4;
      }
    </style>
  </head>
  <body>
    <script type="module" src="/src/client/main.ts"></script>
  </body>
</html>
```

- [ ] **Commit:**
```bash
git add index.html
git commit -m "feat(ui): global CSS reset, system-ui font, body/html padding removed"
```

---

## Task 2: Board layout — sticky column header row

Moves column labels from `bd-column` to `bd-board` as a single sticky header. Removes the now-redundant `.column-header` from `bd-column`. These two changes must land in one commit to avoid a broken state where labels either appear twice or not at all.

**Files:**
- Modify: `src/client/board/board.ts`
- Modify: `src/client/board/column.ts`
- Modify: `tests/unit/board.test.ts`

- [ ] **Write the failing tests in `tests/unit/board.test.ts`** — add below the existing `filterTasksByEpic` tests:

```typescript
// Add this import at the top of the file alongside existing imports:
// import { COLUMN_LABELS, filterTasksByEpic } from '../../src/client/board/column.js'

describe('COLUMN_LABELS', () => {
  it('has exactly four entries', () => {
    expect(Object.keys(COLUMN_LABELS)).toHaveLength(4)
  })

  it('labels are Open, Ready, In Progress, Done', () => {
    expect(COLUMN_LABELS.open).toBe('Open')
    expect(COLUMN_LABELS.ready).toBe('Ready')
    expect(COLUMN_LABELS.inProgress).toBe('In Progress')
    expect(COLUMN_LABELS.done).toBe('Done')
  })
})
```

- [ ] **Run to confirm tests already pass** (COLUMN_LABELS is already exported):
```bash
pnpm test -- --reporter=verbose tests/unit/board.test.ts
```
Expected: the new `COLUMN_LABELS` tests pass — they test an already-exported constant.

- [ ] **Rewrite `src/client/board/board.ts`:**

```typescript
import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  emptyBoardState,
} from '../store/context.js'

@customElement('bd-board')
export class BdBoard extends LitElement {
  @consume({ context: boardContext, subscribe: true })
  @state()
  boardState: BoardState = emptyBoardState

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      --col-header-h: 2rem;
      --bd-mocha-base: #1e1e2e;
      --bd-mocha-surface: #313244;
      --bd-mocha-text: #cdd6f4;
      --bd-mocha-subtext: #a6adc8;
      --bd-mocha-blue: #89b4fa;
      --bd-mocha-green: #a6e3a1;
      --bd-mocha-yellow: #f9e2af;
      --bd-mocha-red: #f38ba8;
      --bd-mocha-peach: #fab387;
    }
    .column-header-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      position: sticky;
      top: 0;
      z-index: 20;
      background: var(--bd-mocha-base);
      border-bottom: 1px solid var(--bd-mocha-surface);
      height: var(--col-header-h);
    }
    .column-label {
      display: flex;
      align-items: center;
      padding: 0 0.75rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--bd-mocha-subtext);
    }
    .column-label--inprogress { color: var(--bd-mocha-blue); }
    .column-label--done { color: var(--bd-mocha-green); }
    .board-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }
  `

  override render() {
    return html`
      <div class="column-header-row">
        <div class="column-label">Open</div>
        <div class="column-label">Ready</div>
        <div class="column-label column-label--inprogress">In Progress</div>
        <div class="column-label column-label--done">Done</div>
      </div>
      <div class="board-scroll">
        ${this.boardState.epics.map(
          (epic) => html`<bd-epic-lane epic-id=${epic.id}></bd-epic-lane>`,
        )}
      </div>
    `
  }
}
```

- [ ] **Remove `.column-header` from `src/client/board/column.ts`** — replace the entire file:

```typescript
import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  emptyBoardState,
  type Task,
} from '../store/context.js'

export type ColumnName = 'open' | 'ready' | 'inProgress' | 'done'

export const COLUMN_LABELS: Record<ColumnName, string> = {
  open: 'Open',
  ready: 'Ready',
  inProgress: 'In Progress',
  done: 'Done',
}

export function filterTasksByEpic(tasks: Task[], epicId: string): Task[] {
  if (!epicId) return tasks
  return tasks.filter((t) => t.epicId === epicId)
}

@customElement('bd-column')
export class BdColumn extends LitElement {
  @property({ type: String, attribute: 'column' })
  column: ColumnName = 'open'

  @property({ type: String, attribute: 'epic-id' })
  epicId = ''

  @consume({ context: boardContext, subscribe: true })
  @state()
  boardState: BoardState = emptyBoardState

  static override styles = css`
    :host { display: block; }
    .column {
      display: flex;
      flex-direction: column;
      padding: 0.5rem 0.625rem;
    }
    .cards { flex: 1; }
  `

  get tasks(): Task[] {
    const allTasks = this.boardState.tasks[this.column] ?? []
    return filterTasksByEpic(allTasks, this.epicId)
  }

  override render() {
    return html`
      <div class="column">
        <div class="cards">
          ${this.tasks.map(
            (task) => html`<bd-task-card bead-id=${task.id}></bd-task-card>`,
          )}
        </div>
      </div>
    `
  }
}
```

- [ ] **Run tests:**
```bash
pnpm test
```
Expected: all 83 tests pass.

- [ ] **Commit:**
```bash
git add src/client/board/board.ts src/client/board/column.ts tests/unit/board.test.ts
git commit -m "feat(ui): sticky column header row in bd-board, remove per-column headers"
```

---

## Task 3: Sticky epic headers

Simplifies `bd-epic-lane` — removes the status summary from the epic header and makes the header sticky below the column header row using `var(--col-header-h)` (set on `bd-board`'s `:host` and inherited through the shadow DOM tree).

**Files:**
- Modify: `src/client/epic/epic-lane.ts`
- Modify: `tests/unit/epic-lane.test.ts`

**Depends on:** Task 2 (needs `--col-header-h` custom property to be defined on `bd-board`).

- [ ] **Update `tests/unit/epic-lane.test.ts`** — the `computeStatusSummary` tests are now dead code since that function is being removed. Replace the entire file:

```typescript
import { describe, expect, it } from 'vitest'

describe('epic-lane module', () => {
  it('source file exists at src/client/epic/epic-lane.ts', async () => {
    const { existsSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const modulePath = resolve(
      import.meta.dirname,
      '../../src/client/epic/epic-lane.ts',
    )
    expect(existsSync(modulePath)).toBe(true)
  })
})
```

- [ ] **Run tests to confirm removed tests no longer block:**
```bash
pnpm test -- --reporter=verbose tests/unit/epic-lane.test.ts
```
Expected: 1 test passes.

- [ ] **Rewrite `src/client/epic/epic-lane.ts`:**

```typescript
import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  type Epic,
  emptyBoardState,
} from '../store/context.js'
import '../board/column.js'

@customElement('bd-epic-lane')
export class BdEpicLane extends LitElement {
  @property({ type: String, attribute: 'epic-id' })
  epicId = ''

  @consume({ context: boardContext, subscribe: true })
  @state()
  boardState: BoardState = emptyBoardState

  static override styles = css`
    :host {
      display: block;
    }
    .epic-header {
      padding: 0.45rem 0.75rem;
      display: flex;
      align-items: center;
      position: sticky;
      top: var(--col-header-h, 2rem);
      z-index: 10;
      background: var(--bd-mocha-base, #1e1e2e);
      border-top: 2px solid var(--bd-mocha-surface, #313244);
      border-bottom: 1px solid var(--bd-mocha-surface, #313244);
    }
    .epic-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--bd-mocha-blue, #89b4fa);
    }
    .columns {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }
  `

  private get epic(): Epic | undefined {
    return this.boardState.epics.find((e) => e.id === this.epicId)
  }

  override render() {
    const epic = this.epic
    if (!epic) return html``
    return html`
      <div class="epic-header">
        <span class="epic-title">${epic.title}</span>
      </div>
      <div class="columns">
        <bd-column column="open" epic-id=${this.epicId}></bd-column>
        <bd-column column="ready" epic-id=${this.epicId}></bd-column>
        <bd-column column="inProgress" epic-id=${this.epicId}></bd-column>
        <bd-column column="done" epic-id=${this.epicId}></bd-column>
      </div>
    `
  }
}
```

- [ ] **Run tests:**
```bash
pnpm test
```
Expected: all tests pass.

- [ ] **Commit:**
```bash
git add src/client/epic/epic-lane.ts tests/unit/epic-lane.test.ts
git commit -m "feat(ui): sticky epic headers below column header row"
```

---

## Task 4: Column tally and separators

Adds the per-column task count at the bottom of each `bd-column`, with a 1px top border separator. Adds right-border column separators (last column excluded). Adds a `min-height` so empty columns still show the tally.

**Files:**
- Modify: `src/client/board/column.ts`
- Modify: `tests/unit/board.test.ts`

**Depends on:** Task 2 (builds on the column.ts left after header removal).

- [ ] **Write the failing tests** — add to `tests/unit/board.test.ts` below the `COLUMN_LABELS` tests:

```typescript
// Add this import if not already present:
// import { COLUMN_LABELS, filterTasksByEpic, tallyText } from '../../src/client/board/column.js'

describe('tallyText()', () => {
  it('returns "—" for zero tasks', () => {
    expect(tallyText(0)).toBe('—')
  })

  it('returns "1 task" for a single task', () => {
    expect(tallyText(1)).toBe('1 task')
  })

  it('returns "2 tasks" for two tasks', () => {
    expect(tallyText(2)).toBe('2 tasks')
  })

  it('returns "10 tasks" for ten tasks', () => {
    expect(tallyText(10)).toBe('10 tasks')
  })
})
```

- [ ] **Run to confirm the new tests fail:**
```bash
pnpm test -- --reporter=verbose tests/unit/board.test.ts
```
Expected: `tallyText` tests fail with "tallyText is not a function".

- [ ] **Update `src/client/board/column.ts`** — add `tallyText` export and update styles and template. Replace the entire file:

```typescript
import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  emptyBoardState,
  type Task,
} from '../store/context.js'

export type ColumnName = 'open' | 'ready' | 'inProgress' | 'done'

export const COLUMN_LABELS: Record<ColumnName, string> = {
  open: 'Open',
  ready: 'Ready',
  inProgress: 'In Progress',
  done: 'Done',
}

export function filterTasksByEpic(tasks: Task[], epicId: string): Task[] {
  if (!epicId) return tasks
  return tasks.filter((t) => t.epicId === epicId)
}

export function tallyText(count: number): string {
  if (count === 0) return '—'
  return count === 1 ? '1 task' : `${count} tasks`
}

@customElement('bd-column')
export class BdColumn extends LitElement {
  @property({ type: String, attribute: 'column' })
  column: ColumnName = 'open'

  @property({ type: String, attribute: 'epic-id' })
  epicId = ''

  @consume({ context: boardContext, subscribe: true })
  @state()
  boardState: BoardState = emptyBoardState

  static override styles = css`
    :host {
      display: block;
      border-right: 1px solid var(--bd-mocha-surface, #313244);
    }
    :host(:last-child) {
      border-right: none;
    }
    .column {
      display: flex;
      flex-direction: column;
      min-height: 3rem;
      padding: 0.5rem 0.625rem;
    }
    .cards {
      flex: 1;
    }
    .tally {
      font-size: 0.65rem;
      color: var(--bd-mocha-subtext, #a6adc8);
      text-align: center;
      padding-top: 0.4rem;
      margin-top: 0.5rem;
      border-top: 1px solid var(--bd-mocha-surface, #313244);
    }
  `

  get tasks(): Task[] {
    const allTasks = this.boardState.tasks[this.column] ?? []
    return filterTasksByEpic(allTasks, this.epicId)
  }

  override render() {
    return html`
      <div class="column">
        <div class="cards">
          ${this.tasks.map(
            (task) => html`<bd-task-card bead-id=${task.id}></bd-task-card>`,
          )}
        </div>
        <div class="tally">${tallyText(this.tasks.length)}</div>
      </div>
    `
  }
}
```

- [ ] **Update import in `tests/unit/board.test.ts`** — add `tallyText` to the import:

```typescript
import { COLUMN_LABELS, filterTasksByEpic, tallyText } from '../../src/client/board/column.js'
```

- [ ] **Run tests:**
```bash
pnpm test
```
Expected: all tests pass including the 4 new `tallyText` tests.

- [ ] **Commit:**
```bash
git add src/client/board/column.ts tests/unit/board.test.ts
git commit -m "feat(ui): column task tally, right-border separators, min-height"
```

---

## Task 5: Card styling — elevated, done opacity, view-transition-name

Redesigns `bd-task-card` to match the spec: elevated card (shadow), reduced opacity for done tasks, inline `view-transition-name` keyed to the bead ID. Removes assignee display. Replaces the `bd-subtask-tally` component usage with inline text.

Exports two pure functions for testing.

**Files:**
- Modify: `src/client/task/task-card.ts`
- Modify: `tests/unit/task-card.test.ts`

**No dependency** — can be done in parallel with tasks 2–4.

- [ ] **Write the failing tests** — add to `tests/unit/task-card.test.ts` below the existing `context module imports` describe block:

```typescript
// Add these imports at the top alongside existing imports:
// import { cardViewTransitionName, isDoneTask } from '../../src/client/task/task-card.js'
// Note: these will fail to import until task-card.ts exports them

describe('cardViewTransitionName()', () => {
  it('prefixes with "card-"', () => {
    expect(cardViewTransitionName('abc')).toBe('card-abc')
  })

  it('replaces non-alphanumeric characters with hyphens', () => {
    expect(cardViewTransitionName('bd-hub_3xk')).toBe('card-bd-hub-3xk')
  })

  it('handles typical bead ID format', () => {
    expect(cardViewTransitionName('beads-dashboard-1oq')).toBe('card-beads-dashboard-1oq')
  })

  it('replaces dots and special chars', () => {
    expect(cardViewTransitionName('abc.def')).toBe('card-abc-def')
  })
})

describe('isDoneTask()', () => {
  it('returns true for status "closed"', () => {
    expect(isDoneTask('closed')).toBe(true)
  })

  it('returns false for status "open"', () => {
    expect(isDoneTask('open')).toBe(false)
  })

  it('returns false for status "in_progress"', () => {
    expect(isDoneTask('in_progress')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isDoneTask('')).toBe(false)
  })
})
```

- [ ] **Run to confirm the new tests fail:**
```bash
pnpm test -- --reporter=verbose tests/unit/task-card.test.ts
```
Expected: `cardViewTransitionName` and `isDoneTask` tests fail with import errors.

- [ ] **Rewrite `src/client/task/task-card.ts`:**

```typescript
import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  emptyBoardState,
  type Task,
} from '../store/context.js'

const PRIORITY_COLOURS: Record<number, string> = {
  0: '#f38ba8',
  1: '#fab387',
  2: '#f9e2af',
  3: '#a6e3a1',
  4: '#313244',
}

export function cardViewTransitionName(beadId: string): string {
  return `card-${beadId.replace(/[^a-z0-9]/gi, '-')}`
}

export function isDoneTask(status: string): boolean {
  return status === 'closed'
}

@customElement('bd-task-card')
export class BdTaskCard extends LitElement {
  @property({ type: String, attribute: 'bead-id' })
  beadId = ''

  @consume({ context: boardContext, subscribe: true })
  @state()
  boardState: BoardState = emptyBoardState

  static override styles = css`
    :host { display: block; }
    .card {
      background: var(--bd-mocha-surface, #313244);
      border-radius: 6px;
      padding: 0.65rem 0.75rem;
      margin-bottom: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
    }
    .card--done {
      opacity: 0.5;
    }
    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .title {
      font-size: 0.825rem;
      line-height: 1.35;
      color: var(--bd-mocha-text, #cdd6f4);
      flex: 1;
    }
    .priority-chip {
      font-size: 0.6rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      color: #1e1e2e;
      flex-shrink: 0;
    }
    .priority-chip--muted {
      background: transparent;
      color: var(--bd-mocha-subtext, #a6adc8);
      border: 1px solid #45475a;
    }
    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .bead-id {
      font-size: 0.625rem;
      color: var(--bd-mocha-subtext, #a6adc8);
      font-family: monospace;
    }
    .subtask-count {
      font-size: 0.625rem;
      color: var(--bd-mocha-subtext, #a6adc8);
    }
  `

  private get task(): Task | undefined {
    const all = Object.values(this.boardState.tasks).flat()
    return all.find((t) => t.id === this.beadId)
  }

  override render() {
    const task = this.task
    if (!task) return html``
    const done = isDoneTask(task.status)
    const vtName = cardViewTransitionName(this.beadId)
    const useMutedChip = task.priority === 4 || done
    const chipColour = PRIORITY_COLOURS[task.priority] ?? PRIORITY_COLOURS[4]

    return html`
      <div
        class="card ${done ? 'card--done' : ''}"
        style="view-transition-name: ${vtName}"
      >
        <div class="card-header">
          <span class="title">${task.title}</span>
          <span
            class="priority-chip ${useMutedChip ? 'priority-chip--muted' : ''}"
            style="${useMutedChip ? '' : `background: ${chipColour}`}"
          >P${task.priority}</span>
        </div>
        <div class="card-meta">
          <span class="bead-id">${task.id}</span>
          ${task.subtaskTotal > 0
            ? html`<span class="subtask-count">${task.subtaskDone} / ${task.subtaskTotal} subtasks</span>`
            : ''}
        </div>
      </div>
    `
  }
}
```

- [ ] **Update `tests/unit/task-card.test.ts`** — add the two new imports at the top of the file:

```typescript
import { cardViewTransitionName, isDoneTask } from '../../src/client/task/task-card.js'
```

The rest of the file stays as-is.

- [ ] **Run tests:**
```bash
pnpm test
```
Expected: all tests pass including the 8 new card tests.

- [ ] **Commit:**
```bash
git add src/client/task/task-card.ts tests/unit/task-card.test.ts
git commit -m "feat(ui): elevated card style, view-transition-name, done opacity"
```

---

## Task 6: View Transitions on SSE update

Wraps board state updates from SSE in `document.startViewTransition()` when the API is available. Extracts the update logic into a testable exported function `applyStateUpdate`. Initial load (`loadInitialState`) continues to use direct assignment — no snapshot exists before first load, so a transition makes no sense there.

**Files:**
- Modify: `src/client/store/board-store.ts`
- Modify: `tests/unit/board-store.test.ts`

**Depends on:** Task 5 (cards must have `view-transition-name` set for the browser to animate them).

- [ ] **Write the failing tests** — add to `tests/unit/board-store.test.ts` below the existing `BoardState type` describe block:

```typescript
// Add these imports at the top of the file:
// import { applyStateUpdate } from '../../src/client/store/board-store.js'
// import { vi } from 'vitest'
// import { emptyBoardState, type BoardState } from '../../src/client/store/context.js'

describe('applyStateUpdate()', () => {
  const newState: BoardState = {
    epics: [{ id: 'e1', title: 'Epic', status: 'open', priority: 1 }],
    tasks: { open: [], ready: [], inProgress: [], done: [] },
  }

  it('calls setter directly when startViewTransition is unavailable', () => {
    const setter = vi.fn()
    // Simulate environment without View Transitions API
    const originalVT = (document as Record<string, unknown>).startViewTransition
    delete (document as Record<string, unknown>).startViewTransition

    applyStateUpdate(newState, setter)

    expect(setter).toHaveBeenCalledOnce()
    expect(setter).toHaveBeenCalledWith(newState)

    // Restore
    if (originalVT !== undefined) {
      (document as Record<string, unknown>).startViewTransition = originalVT
    }
  })

  it('calls startViewTransition when available', () => {
    const setter = vi.fn()
    const mockTransition = vi.fn((cb: () => void) => { cb(); return {} })
    ;(document as Record<string, unknown>).startViewTransition = mockTransition

    applyStateUpdate(newState, setter)

    expect(mockTransition).toHaveBeenCalledOnce()
    expect(setter).toHaveBeenCalledWith(newState)

    delete (document as Record<string, unknown>).startViewTransition
  })

  it('setter receives the exact state object passed in', () => {
    const setter = vi.fn()
    delete (document as Record<string, unknown>).startViewTransition

    applyStateUpdate(newState, setter)

    expect(setter.mock.calls[0][0]).toBe(newState)
  })
})
```

- [ ] **Run to confirm the new tests fail:**
```bash
pnpm test -- --reporter=verbose tests/unit/board-store.test.ts
```
Expected: `applyStateUpdate` tests fail with import error.

- [ ] **Rewrite `src/client/store/board-store.ts`:**

```typescript
import { ContextProvider } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { type BoardState, boardContext, emptyBoardState } from './context.js'

export function applyStateUpdate(
  newState: BoardState,
  setter: (state: BoardState) => void,
): void {
  if ('startViewTransition' in document) {
    document.startViewTransition(() => setter(newState))
  } else {
    setter(newState)
  }
}

@customElement('bd-board-store')
export class BoardStore extends LitElement {
  private provider = new ContextProvider(this, {
    context: boardContext,
    initialValue: emptyBoardState,
  })

  private eventSource: EventSource | null = null

  @state()
  get boardState(): BoardState {
    return this.provider.value
  }

  set boardState(value: BoardState) {
    this.provider.setValue(value)
  }

  override connectedCallback() {
    super.connectedCallback()
    this.loadInitialState()
    this.connectSSE()
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.eventSource?.close()
    this.eventSource = null
  }

  private async loadInitialState() {
    try {
      const response = await fetch('/api/board')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      // Direct assignment — no "before" snapshot exists on first load
      this.boardState = (await response.json()) as BoardState
    } catch (err) {
      console.error('[bd-board-store] Failed to load board state:', err)
    }
  }

  private connectSSE() {
    this.eventSource = new EventSource('/events')
    this.eventSource.addEventListener('board-update', (e: MessageEvent) => {
      const newState = JSON.parse(e.data as string) as BoardState
      applyStateUpdate(newState, (s) => { this.boardState = s })
    })
    this.eventSource.addEventListener('error', (e) => {
      console.error('[bd-board-store] SSE connection error:', e)
    })
  }

  override render() {
    return html`<slot></slot>`
  }
}
```

- [ ] **Update `tests/unit/board-store.test.ts`** — add import at the top:

```typescript
import { vi } from 'vitest'
import { applyStateUpdate } from '../../src/client/store/board-store.js'
```

- [ ] **Run tests:**
```bash
pnpm test
```
Expected: all tests pass including the 3 new `applyStateUpdate` tests.

- [ ] **Run E2E tests to confirm end-to-end behaviour:**
```bash
pnpm test:e2e
```
Expected: all E2E tests pass.

- [ ] **Commit:**
```bash
git add src/client/store/board-store.ts tests/unit/board-store.test.ts
git commit -m "feat(ui): View Transitions on SSE board state updates"
```

- [ ] **Push:**
```bash
git push
```

---

## Self-review

**Spec coverage:**
- ✅ Global CSS reset, system-ui font, no body/html padding — Task 1
- ✅ Single sticky column header row — Task 2
- ✅ Board scroll container (`height: 100dvh`, `overflow-y: auto`) — Task 2
- ✅ `--col-header-h` CSS custom property — Task 2
- ✅ Sticky epic headers at `top: var(--col-header-h)` — Task 3
- ✅ Epic header background occludes scrolling cards — Task 3 (background: `--bd-mocha-base`)
- ✅ 2px border-top on epic sections — Task 3
- ✅ Column separators (1px right border, last child excluded) — Task 4
- ✅ Column tally beneath cards, singular/plural — Task 4
- ✅ Min-height 3rem on columns — Task 4
- ✅ Elevated card (shadow, border-radius 6px) — Task 5
- ✅ Done card opacity 0.5 — Task 5
- ✅ `view-transition-name` on each card — Task 5
- ✅ Priority chip colours + muted for P4 and done — Task 5
- ✅ Subtask tally inline text (N / M subtasks) — Task 5
- ✅ Assignee removed from card — Task 5
- ✅ `startViewTransition` wraps SSE updates — Task 6
- ✅ Feature-detect with graceful degradation — Task 6
- ✅ Initial load skips transition — Task 6

**No gaps found.**
