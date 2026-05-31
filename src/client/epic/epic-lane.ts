import { consume } from '@lit/context'
import { css, html, LitElement, nothing } from 'lit'
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
      border-top: 2px solid var(--bd-color-border);
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
    .update-badge {
      font-size: var(--bd-font-size-2xs);
      font-weight: var(--bd-font-weight-bold);
      background: var(--bd-color-accent-in-progress);
      color: var(--bd-color-text-on-accent);
      border-radius: var(--bd-radius-full);
      padding: 0.1em 0.45em;
      margin-left: auto;
      flex-shrink: 0;
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

  private get updateCount(): number {
    return this.boardState.ui.updates[this.epicId] ?? 0
  }

  private _toggle() {
    this.boardState.ui.toggleEpic(this.epicId, !this.collapsed)
  }

  override render() {
    const epic = this.epic
    if (!epic) return html``
    const bodyId = `epic-body-${sanitiseId(this.epicId)}`
    const expanded = !this.collapsed

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
            this.collapsed && this.updateCount > 0
              ? html`<span
                class="update-badge"
                role="status"
                aria-label="${this.updateCount} task update${this.updateCount === 1 ? '' : 's'}"
              >${this.updateCount}</span>`
              : nothing
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
