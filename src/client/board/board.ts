import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  emptyBoardState,
} from '../store/context.js'

@customElement('bd-board')
export class BdBoard extends LitElement {
  @consume({ context: boardContext, subscribe: true })
  @state()
  boardState: BoardState = emptyBoardState

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      --col-header-h: 2rem;
      --bd-mocha-base: #1e1e2e;
      --bd-mocha-surface: #313244;
      --bd-mocha-text: #cdd6f4;
      --bd-mocha-subtext: #a6adc8;
      --bd-mocha-blue: #89b4fa;
      --bd-mocha-green: #a6e3a1;
      --bd-mocha-yellow: #f9e2af;
      --bd-mocha-red: #f38ba8;
      --bd-mocha-peach: #fab387;
    }
    .column-header-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      position: sticky;
      top: 0;
      z-index: 20;
      background: var(--bd-mocha-base);
      border-bottom: 1px solid var(--bd-mocha-surface);
      height: var(--col-header-h);
    }
    .column-label {
      display: flex;
      align-items: center;
      padding: 0 0.75rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--bd-mocha-subtext);
    }
    .column-label--inprogress { color: var(--bd-mocha-blue); }
    .column-label--done { color: var(--bd-mocha-green); }
    .board-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }
  `

  override render() {
    return html`
      <div role="region" aria-label="Kanban board">
        <header class="column-header-row" role="row" aria-label="Board columns">
          <div class="column-label" role="columnheader">Open</div>
          <div class="column-label" role="columnheader">Ready</div>
          <div class="column-label column-label--inprogress" role="columnheader">In Progress</div>
          <div class="column-label column-label--done" role="columnheader">Done</div>
        </header>
        <div class="board-scroll">
          ${this.boardState.epics.map(
            (epic) => html`<bd-epic-lane epic-id=${epic.id}></bd-epic-lane>`,
          )}
        </div>
      </div>
    `
  }
}
