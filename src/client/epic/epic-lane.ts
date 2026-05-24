import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  type Epic,
  emptyBoardState,
} from '../store/context.js'
import '../board/column.js'

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
    }
    .epic-header {
      padding: 0.45rem 0.75rem;
      display: flex;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bd-mocha-mantle, #181825);
      border-top: 2px solid var(--bd-mocha-surface, #313244);
      border-bottom: 1px solid var(--bd-mocha-surface, #313244);
    }
    .epic-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--bd-mocha-text, #cdd6f4);
      margin: 0;
    }
    .columns {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }
  `

  private get epic(): Epic | undefined {
    return this.boardState.epics.find((e) => e.id === this.epicId)
  }

  override render() {
    const epic = this.epic
    if (!epic) return html``
    return html`
      <section>
        <header class="epic-header">
          <h2 class="epic-title">${epic.title}</h2>
        </header>
        <div class="columns">
          <bd-column column="open" epic-id=${this.epicId}></bd-column>
          <bd-column column="ready" epic-id=${this.epicId}></bd-column>
          <bd-column column="inProgress" epic-id=${this.epicId}></bd-column>
          <bd-column column="done" epic-id=${this.epicId}></bd-column>
        </div>
      </section>
    `
  }
}
