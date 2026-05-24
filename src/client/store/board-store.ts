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
      applyStateUpdate(newState, (s) => {
        this.boardState = s
      })
    })
    this.eventSource.addEventListener('error', (e) => {
      console.error('[bd-board-store] SSE connection error:', e)
    })
  }

  override render() {
    return html`<slot></slot>`
  }
}
