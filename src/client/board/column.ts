import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  emptyBoardState,
  type EpicAge,
  type Task,
} from '../store/context.js'
import { epicAgeCutoff } from './board.js'

export type ColumnName = 'open' | 'ready' | 'inProgress' | 'done'

export const ORPHAN_EPIC_ID = '__orphan__'

export const COLUMN_LABELS: Record<ColumnName, string> = {
  open: 'Open',
  ready: 'Ready',
  inProgress: 'In Progress',
  done: 'Done',
}

export function filterTasksByEpic(
  tasks: Task[],
  epicId: string,
  epicAge?: EpicAge,
): Task[] {
  if (!epicId) return tasks
  if (epicId === ORPHAN_EPIC_ID) {
    const orphans = tasks.filter((t) => t.epicId === undefined)
    const cutoff = epicAge ? epicAgeCutoff(epicAge) : null
    return cutoff ? orphans.filter((t) => new Date(t.createdAt) >= cutoff) : orphans
  }
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
      padding: var(--bd-space-2) calc(0.625rem * var(--bd-space-scale));
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
      font-size: var(--bd-font-size-xs);
      color: var(--bd-color-text-muted);
      text-align: center;
      padding-top: var(--bd-space-1-5);
      margin-top: auto;
      border-top: 1px solid var(--bd-color-border);
    }
  `

  get tasks(): Task[] {
    const allTasks = this.boardState.tasks[this.column] ?? []
    return filterTasksByEpic(allTasks, this.epicId, this.boardState.ui.epicAge)
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
