import { consume } from '@lit/context'
import { css, html, LitElement, nothing } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  emptyBoardState,
  type Task,
} from '../store/context.js'
import { buttonBase } from '../styles/button-base.js'

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

  static override styles = [
    buttonBase,
    css`
      :host { display: block; }
      .card {
        background: var(--bd-color-bg-surface);
        border-radius: var(--bd-radius-md);
        padding: calc(0.65rem * var(--bd-space-scale)) var(--bd-space-3);
        margin-bottom: var(--bd-space-2);
        display: flex;
        flex-direction: column;
        gap: var(--bd-space-1-5);
        box-shadow: var(--bd-shadow-card);
      }
      .card--done {
        opacity: 0.5;
      }
      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--bd-space-2);
      }
      .title {
        color: var(--bd-color-text-primary);
        font-size: var(--bd-font-size-base);
        line-height: var(--bd-line-height-tight);
        flex: 1;
      }
      .title:hover {
        text-decoration: underline;
      }
      .priority-chip {
        font-size: var(--bd-font-size-2xs);
        font-weight: var(--bd-font-weight-bold);
        padding: var(--bd-space-0-5) var(--bd-space-1-5);
        border-radius: var(--bd-radius-sm);
        color: var(--bd-color-text-on-accent);
        flex-shrink: 0;
      }
      .priority-chip[data-priority="0"] { background: var(--bd-color-priority-p0); }
      .priority-chip[data-priority="1"] { background: var(--bd-color-priority-p1); }
      .priority-chip[data-priority="2"] { background: var(--bd-color-priority-p2); }
      .priority-chip[data-priority="3"] { background: var(--bd-color-priority-p3); }
      .priority-chip[data-muted] {
        background: transparent;
        color: var(--bd-color-text-muted);
        border: 1px solid var(--bd-color-border-muted);
      }
      .card-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .bead-id {
        font-size: var(--bd-font-size-2xs);
        color: var(--bd-color-text-muted);
        font-family: var(--bd-font-family-mono);
      }
      .subtask-count {
        font-size: var(--bd-font-size-2xs);
        color: var(--bd-color-text-muted);
      }
    `,
  ]

  private _openDialog() {
    this.dispatchEvent(
      new CustomEvent('open-bead', {
        detail: { beadId: this.beadId },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private get task(): Task | undefined {
    const all = Object.values(this.boardState.tasks).flat()
    return all.find((t) => t.id === this.beadId)
  }

  override render() {
    const task = this.task
    if (!task) return html``
    const done = isDoneTask(task.status)
    const vtName = cardViewTransitionName(this.beadId)
    const muted = task.priority === 4 || done

    return html`
      <article
        class="card ${done ? 'card--done' : ''}"
        style="view-transition-name: ${vtName}"
        aria-label="${task.title}${done ? ' (complete)' : ''}"
      >
        <header class="card-header">
          <button type="button" class="title" @click=${this._openDialog}>${task.title}</button>
          <span
            class="priority-chip"
            ?data-muted="${muted}"
            data-priority="${muted ? nothing : task.priority}"
            aria-label="Priority ${task.priority}"
          >P${task.priority}</span>
        </header>
        <footer class="card-meta">
          <span class="bead-id" aria-label="ID: ${task.id}">${task.id}</span>
          ${
            task.subtaskTotal > 0
              ? html`<span class="subtask-count" aria-label="${task.subtaskDone} of ${task.subtaskTotal} subtasks complete">${task.subtaskDone} / ${task.subtaskTotal} subtasks</span>`
              : ''
          }
        </footer>
      </article>
    `
  }
}
