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
      display: block;
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
    .board {
      display: flex;
      flex-direction: column;
      gap: 0;
      background: var(--bd-mocha-base);
      min-height: 100vh;
      padding: 1rem;
    }
  `

  override render() {
    return html`
      <div class="board">
        ${this.boardState.epics.map(
          (epic) => html`
          <bd-epic-lane epic-id=${epic.id}></bd-epic-lane>
        `,
        )}
      </div>
    `
  }
}
