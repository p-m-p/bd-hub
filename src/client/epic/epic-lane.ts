import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  type Epic,
  emptyBoardState,
} from '../store/context.js'
import { buttonBase } from '../styles/button-base.js'
import '../board/column.js'

export function sanitiseId(id: string): string {
  return id.replace(/[^a-z0-9]/gi, '-')
}

/** Returns done and total task counts for an epic (or orphan lane). */
export function epicTally(
  state: BoardState,
  epicId: string,
): { done: number; total: number } {
  const isOrphan = epicId === '__orphan__'
  const matchesEpic = (taskEpicId: string | undefined) =>
    isOrphan ? taskEpicId === undefined : taskEpicId === epicId

  const { open, ready, inProgress, done } = state.tasks
  const total = [...open, ...ready, ...inProgress, ...done].filter((t) =>
    matchesEpic(t.epicId),
  ).length
  const doneCount = done.filter((t) => matchesEpic(t.epicId)).length

  return { done: doneCount, total }
}

@customElement('bd-epic-lane')
export class BdEpicLane extends LitElement {
  @property({ type: String, attribute: 'epic-id' })
  epicId = ''

  @consume({ context: boardContext, subscribe: true })
  @state()
  boardState: BoardState = emptyBoardState

  static override styles = [
    buttonBase,
    css`
    :host {
      display: block;
    }
    .epic-header {
      padding: 0.45rem var(--bd-space-3);
      display: flex;
      align-items: center;
      gap: var(--bd-space-2);
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bd-color-bg-mantle);
      border-bottom: 1px solid var(--bd-color-border);
    }
    .epic-toggle {
      display: flex;
      align-items: center;
      gap: var(--bd-space-2);
      flex: 1;
      min-width: 0;
    }
    .chevron {
      font-size: var(--bd-font-size-2xs);
      color: var(--bd-color-text-muted);
      transition: transform 200ms ease;
      flex-shrink: 0;
    }
    .chevron--expanded {
      transform: rotate(90deg);
    }
    .epic-title {
      font-size: var(--bd-font-size-base);
      font-weight: var(--bd-font-weight-semibold);
      color: var(--bd-color-text-primary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .epic-tally {
      font-size: var(--bd-font-size-xs);
      color: var(--bd-color-text-muted);
      flex-shrink: 0;
      white-space: nowrap;
    }
    .epic-tally-done {
      color: var(--bd-color-accent-done);
      font-weight: var(--bd-font-weight-semibold);
    }
    .columns {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }
    .columns[hidden] {
      display: none;
    }
  `,
  ]

  private get epic(): Epic | undefined {
    return this.boardState.epics.find((e) => e.id === this.epicId)
  }

  private get collapsed(): boolean {
    return this.boardState.ui.collapsed.has(this.epicId)
  }

  private _toggle() {
    this.boardState.ui.toggleEpic(this.epicId, !this.collapsed)
  }

  override render() {
    const epic = this.epic
    if (!epic) return html``
    const bodyId = `epic-body-${sanitiseId(this.epicId)}`
    const expanded = !this.collapsed
    const { done, total } = epicTally(this.boardState, this.epicId)

    return html`
      <section>
        <header class="epic-header">
          <button
            type="button"
            class="epic-toggle"
            aria-expanded=${expanded}
            aria-controls=${bodyId}
            @click=${this._toggle}
          >
            <span
              class="chevron ${expanded ? 'chevron--expanded' : ''}"
              aria-hidden="true"
            >▶</span>
            <h2 class="epic-title">${epic.title}</h2>
          </button>
          ${
            total > 0
              ? html`<span class="epic-tally" aria-label="${done} of ${total} tasks done">
                  <span class="epic-tally-done">${done}</span> / ${total}
                </span>`
              : ''
          }
        </header>
        <div id=${bodyId} class="columns" ?hidden=${this.collapsed}>
          <bd-column column="open" epic-id=${this.epicId}></bd-column>
          <bd-column column="ready" epic-id=${this.epicId}></bd-column>
          <bd-column column="inProgress" epic-id=${this.epicId}></bd-column>
          <bd-column column="done" epic-id=${this.epicId}></bd-column>
        </div>
      </section>
    `
  }
}
