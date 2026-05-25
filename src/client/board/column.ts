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
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--bd-color-border);
    }
    :host(:last-child) {
      border-right: none;
    }
    .column {
      flex: 1 0 auto;
      display: flex;
      flex-direction: column;
      min-height: 3rem;
      padding: 0.5rem 0.625rem;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    li {
      display: block;
    }
    .tally {
      font-size: 0.65rem;
      color: var(--bd-color-text-muted);
      text-align: center;
      padding-top: 0.4rem;
      margin-top: auto;
      border-top: 1px solid var(--bd-color-border);
    }
  `

  get tasks(): Task[] {
    const allTasks = this.boardState.tasks[this.column] ?? []
    return filterTasksByEpic(allTasks, this.epicId)
  }

  override render() {
    return html`
      <section class="column" aria-label=${COLUMN_LABELS[this.column]}>
        <ul>
          ${this.tasks.map(
            (task) =>
              html`<li><bd-task-card bead-id=${task.id}></bd-task-card></li>`,
          )}
        </ul>
        <footer class="tally">${tallyText(this.tasks.length)}</footer>
      </section>
    `
  }
}
