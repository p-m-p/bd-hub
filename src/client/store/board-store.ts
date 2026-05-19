import { ContextProvider } from '@lit/context'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { type BoardState, boardContext, emptyBoardState } from './context.js'

@customElement('bd-board-store')
export class BoardStore extends LitElement {
  private provider = new ContextProvider(this, {
    context: boardContext,
    initialValue: emptyBoardState,
  })

  private eventSource: EventSource | null = null

  @property({ type: Object })
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
    const response = await fetch('/api/board')
    this.boardState = (await response.json()) as BoardState
  }

  private connectSSE() {
    this.eventSource = new EventSource('/events')
    this.eventSource.addEventListener('board-update', (e: MessageEvent) => {
      this.boardState = JSON.parse(e.data as string) as BoardState
    })
  }

  override render() {
    return html`<slot></slot>`
  }
}
