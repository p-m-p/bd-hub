import { ContextProvider } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  type BoardState,
  type BoardUIState,
  boardContext,
  emptyBoardState,
  type Task,
} from './context.js'

const LS_KEY = 'bd-collapsed-epics'

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    // ignore parse errors
  }
  return new Set()
}

function saveCollapsed(collapsed: Set<string>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...collapsed]))
  } catch {
    // ignore storage errors (e.g. private mode quota)
  }
}

/** Collect a sorted snapshot of {id, status} for all tasks belonging to an epic. */
export function epicTaskSnapshot(state: BoardState, epicId: string): string {
  const all: Task[] = [
    ...state.tasks.open,
    ...state.tasks.ready,
    ...state.tasks.inProgress,
    ...state.tasks.done,
  ].filter(
    (t) =>
      t.epicId === epicId ||
      (epicId === '__orphan__' && t.epicId === undefined),
  )

  return JSON.stringify(
    all
      .map((t) => ({ id: t.id, status: t.status }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  )
}

/** Diff old vs new state for collapsed epics; returns updated ui. */
export function diffUpdates(
  oldState: BoardState,
  newState: BoardState,
  ui: BoardUIState,
): BoardUIState {
  if (ui.collapsed.size === 0) return ui
  const updates = { ...ui.updates }
  for (const epicId of ui.collapsed) {
    if (
      epicTaskSnapshot(oldState, epicId) !== epicTaskSnapshot(newState, epicId)
    ) {
      updates[epicId] = (updates[epicId] ?? 0) + 1
    }
  }
  return { ...ui, updates }
}

/** Merge server-returned board data with existing client UI state. */
function mergeWithUI(
  serverState: Omit<BoardState, 'ui'>,
  ui: BoardUIState,
): BoardState {
  return { ...serverState, ui } as BoardState
}

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
    // Restore collapsed state before first fetch so it's ready when data arrives
    this.boardState = {
      ...this.boardState,
      ui: { collapsed: loadCollapsed(), updates: {} },
    }
    this.addEventListener('toggle-epic', this._onToggleEpic as EventListener)
    this.loadInitialState()
    this.connectSSE()
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.removeEventListener('toggle-epic', this._onToggleEpic as EventListener)
    this.eventSource?.close()
    this.eventSource = null
  }

  private async loadInitialState() {
    try {
      const response = await fetch('/api/board')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const serverState = (await response.json()) as Omit<BoardState, 'ui'>
      this.boardState = mergeWithUI(serverState, this.boardState.ui)
    } catch (err) {
      console.error('[bd-board-store] Failed to load board state:', err)
    }
  }

  private connectSSE() {
    this.eventSource = new EventSource('/events')
    this.eventSource.addEventListener('board-update', (e: MessageEvent) => {
      const serverState = JSON.parse(e.data as string) as Omit<BoardState, 'ui'>
      const updatedUI = diffUpdates(
        this.boardState,
        { ...serverState, ui: this.boardState.ui } as BoardState,
        this.boardState.ui,
      )
      const newState = mergeWithUI(serverState, updatedUI)
      applyStateUpdate(newState, (s) => {
        this.boardState = s
      })
    })
    this.eventSource.addEventListener('error', (e) => {
      console.error('[bd-board-store] SSE connection error:', e)
    })
  }

  private _onToggleEpic(
    e: CustomEvent<{ epicId: string; collapsed: boolean }>,
  ) {
    const { epicId, collapsed } = e.detail
    const ui = this.boardState.ui
    const next = new Set(ui.collapsed)
    const updates = { ...ui.updates }

    if (collapsed) {
      next.add(epicId)
    } else {
      next.delete(epicId)
      delete updates[epicId]
    }

    saveCollapsed(next)
    this.boardState = { ...this.boardState, ui: { collapsed: next, updates } }
  }

  override render() {
    return html`<slot></slot>`
  }
}
