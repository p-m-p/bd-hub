import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  emptyBoardState,
  type Task,
} from '../store/context.js'
import './subtask-tally.js'

const PRIORITY_COLOURS: Record<number, string> = {
  0: '#f38ba8',
  1: '#fab387',
  2: '#f9e2af',
  3: '#a6e3a1',
  4: '#313244',
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
      border-radius: 0.375rem;
      padding: 0.625rem;
      margin-bottom: 0.375rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .title {
      font-size: 0.875rem;
      color: var(--bd-mocha-text, #cdd6f4);
      flex: 1;
    }
    .priority-chip {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 0.2rem;
      color: #1e1e2e;
      flex-shrink: 0;
    }
    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .bead-id {
      font-size: 0.65rem;
      color: var(--bd-mocha-subtext, #a6adc8);
      font-family: monospace;
    }
    .assignee {
      font-size: 0.7rem;
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
    const priorityColour =
      PRIORITY_COLOURS[task.priority] ?? PRIORITY_COLOURS[4]
    return html`
      <div class="card">
        <div class="card-header">
          <span class="title">${task.title}</span>
          <span class="priority-chip" style="background:${priorityColour}">P${task.priority}</span>
        </div>
        <div class="card-meta">
          <span class="bead-id">${task.id}</span>
          ${task.assignee ? html`<span class="assignee">${task.assignee}</span>` : ''}
        </div>
        ${
          task.subtaskTotal > 0
            ? html`
          <bd-subtask-tally .total=${task.subtaskTotal} .done=${task.subtaskDone}></bd-subtask-tally>
        `
            : ''
        }
      </div>
    `
  }
}
