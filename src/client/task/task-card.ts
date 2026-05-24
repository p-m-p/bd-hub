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
