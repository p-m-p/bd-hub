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
