import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  emptyBoardState,
} from '../store/context.js'

@customElement('bd-title-bar')
export class BdTitleBar extends LitElement {
  @consume({ context: boardContext, subscribe: true })
  @state()
  boardState: BoardState = emptyBoardState

  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      height: 2.5rem;
      padding: 0 var(--bd-space-4);
      background: var(--bd-color-bg-mantle);
      border-bottom: 1px solid var(--bd-color-border);
      flex-shrink: 0;
    }
    .project-name {
      font-size: var(--bd-font-size-sm);
      font-weight: var(--bd-font-weight-semibold);
      letter-spacing: var(--bd-tracking-label);
      color: var(--bd-color-text-primary);
    }
    .spacer { flex: 1; }
  `

  override updated(changed: Map<string, unknown>) {
    if (changed.has('boardState')) {
      const name = this.boardState.projectName
      if (name) {
        document.title = `${name} — bd-hub`
      }
    }
  }

  override render() {
    return html`
      <span class="project-name">${this.boardState.projectName}</span>
      <div class="spacer" role="none"></div>
    `
  }
}
