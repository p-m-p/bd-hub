import { ContextProvider } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { snapshotPositions } from './card-flip.js'
import {
  type BoardState,
  type BoardUIState,
  boardContext,
  type EpicAge,
  emptyBoardState,
} from './context.js'

const LS_KEY_COLLAPSED = 'bd-collapsed-epics'
const LS_KEY_EPIC_AGE = 'bd-epic-age'

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY_COLLAPSED)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    // ignore parse errors
  }
  return new Set()
}

function saveCollapsed(collapsed: Set<string>): void {
  try {
    localStorage.setItem(LS_KEY_COLLAPSED, JSON.stringify([...collapsed]))
  } catch {
    // ignore storage errors (e.g. private mode quota)
  }
}

const VALID_EPIC_AGES = new Set<EpicAge>([
  '1w',
  '2w',
  '1m',
  '3m',
  '6m',
  '12m',
  'all',
])

function loadEpicAge(): EpicAge {
  try {
    const raw = localStorage.getItem(LS_KEY_EPIC_AGE)
    if (raw && VALID_EPIC_AGES.has(raw as EpicAge)) return raw as EpicAge
  } catch {
    // ignore
  }
  return '1m'
}

function saveEpicAge(age: EpicAge): void {
  try {
    localStorage.setItem(LS_KEY_EPIC_AGE, age)
  } catch {
    // ignore
  }
}

/** Merge server-returned board data with existing client UI state. */
function mergeWithUI(
  serverState: Omit<BoardState, 'ui'>,
  ui: BoardUIState,
): BoardState {
  // Cast needed: server state has no 'ui' field; we provide it here
  return { ...(serverState as Omit<BoardState, 'ui'>), ui } as BoardState
}

let pendingTransition: ViewTransition | null = null

/** @internal Reset pending transition — for testing only */
export function _resetTransitionForTesting(): void {
  pendingTransition = null
}

export function applyStateUpdate(
  newState: BoardState,
  setter: (state: BoardState) => void,
): void {
  snapshotPositions()
  if (!('startViewTransition' in document) || pendingTransition) {
    setter(newState)
    return
  }
  pendingTransition = document.startViewTransition(() => setter(newState))
  pendingTransition.finished.finally(() => {
    pendingTransition = null
  })
}

/**
 * Creates paired error/open handlers for an EventSource that re-fetch board
 * state after a reconnect following an error (e.g. server restart).
 *
 * @param onReconnect - called once when the connection re-opens after an error
 */
export function createReconnectHandlers(onReconnect: () => void): {
  onError: () => void
  onOpen: () => void
} {
  let hadError = false
  return {
    onError() {
      hadError = true
    },
    onOpen() {
      if (hadError) {
        hadError = false
        onReconnect()
      }
    },
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
    if (value === this.provider.value) return
    this.provider.setValue(value)
  }

  override connectedCallback() {
    super.connectedCallback()
    // Restore persisted client UI state before first fetch
    this.boardState = {
      ...this.boardState,
      ui: {
        collapsed: loadCollapsed(),
        epicAge: loadEpicAge(),
        toggleEpic: this._toggleEpic,
        setEpicAge: this._setEpicAge,
      },
    }
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
      const [boardRes, infoRes] = await Promise.all([
        fetch('/api/board'),
        fetch('/api/info'),
      ])
      if (!boardRes.ok) throw new Error(`HTTP ${boardRes.status}`)
      const serverState = (await boardRes.json()) as Omit<
        BoardState,
        'ui' | 'projectName'
      >
      const projectName = infoRes.ok
        ? ((await infoRes.json()) as { name: string }).name
        : ''
      if (projectName) {
        document.title = `${projectName} — bd-hub`
      }
      this.boardState = mergeWithUI(
        { ...serverState, projectName },
        this.boardState.ui,
      )
    } catch (err) {
      console.error('[bd-board-store] Failed to load board state:', err)
    }
  }

  private connectSSE() {
    this.eventSource = new EventSource('/events')
    const { onError, onOpen } = createReconnectHandlers(
      () => void this.loadInitialState(),
    )

    this.eventSource.addEventListener('board-update', (e: MessageEvent) => {
      const serverState = JSON.parse(e.data as string) as Omit<
        BoardState,
        'ui' | 'projectName'
      >
      // Preserve projectName from client state — SSE events only carry board data
      const withName = {
        ...serverState,
        projectName: this.boardState.projectName,
      }
      const newState = mergeWithUI(withName, this.boardState.ui)
      applyStateUpdate(newState, (s) => {
        this.boardState = s
      })
    })
    // After a server restart EventSource auto-reconnects; re-fetch full state
    // so the board is not silently stale.
    this.eventSource.addEventListener('error', (e) => {
      console.error('[bd-board-store] SSE connection error:', e)
      onError()
    })
    this.eventSource.addEventListener('open', onOpen)
  }

  private readonly _toggleEpic = (epicId: string, collapsed: boolean) => {
    const ui = this.boardState.ui
    const next = new Set(ui.collapsed)

    if (collapsed) {
      next.add(epicId)
    } else {
      next.delete(epicId)
    }

    saveCollapsed(next)
    this.boardState = {
      ...this.boardState,
      ui: { ...ui, collapsed: next },
    }
  }

  private readonly _setEpicAge = (age: EpicAge) => {
    saveEpicAge(age)
    this.boardState = {
      ...this.boardState,
      ui: { ...this.boardState.ui, epicAge: age },
    }
  }

  override render() {
    return html`<slot></slot>`
  }
}
