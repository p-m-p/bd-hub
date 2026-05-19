import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  type Epic,
  emptyBoardState,
} from '../store/context.js'

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
      grid-column: 1 / -1;
    }
    .epic-lane {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      background: var(--bd-mocha-surface, #313244);
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .epic-header {
      grid-column: 1 / -1;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .epic-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--bd-mocha-blue, #89b4fa);
    }
    .epic-status {
      font-size: 0.75rem;
      color: var(--bd-mocha-subtext, #a6adc8);
    }
  `

  private get epic(): Epic | undefined {
    return this.boardState.epics.find((e) => e.id === this.epicId)
  }

  private get statusSummary(): string {
    const all = Object.values(this.boardState.tasks).flat()
    const epicTasks = all.filter((t) => t.epicId === this.epicId)
    if (epicTasks.length === 0) return 'no tasks'
    const counts: Record<string, number> = {}
    for (const task of epicTasks) {
      counts[task.status] = (counts[task.status] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([status, count]) => `${count} ${status}`)
      .join(', ')
  }

  override render() {
    const epic = this.epic
    if (!epic) return html``
    return html`
      <div class="epic-lane">
        <div class="epic-header">
          <span class="epic-title">${epic.title}</span>
          <span class="epic-status">${this.statusSummary}</span>
        </div>
        <slot></slot>
      </div>
    `
  }
}
