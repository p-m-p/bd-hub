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

  @state() private isDark = document.documentElement.dataset.theme !== 'light'

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      --bd-col-header-h: 2rem;
    }
    .column-header-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      position: sticky;
      top: 0;
      z-index: 20;
      background: var(--bd-color-bg-mantle);
      border-bottom: 1px solid var(--bd-color-border);
      height: var(--bd-col-header-h);
    }
    .column-label {
      display: flex;
      align-items: center;
      padding: 0 0.75rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--bd-color-text-muted);
    }
    .column-label--inprogress { color: var(--bd-color-accent-in-progress); }
    .column-label--done { color: var(--bd-color-accent-done); }
    .board-region {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .board-scroll {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .theme-toggle {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      color: var(--bd-color-text-muted);
      padding: 0.25rem;
      line-height: 1;
    }
    .theme-toggle:hover {
      color: var(--bd-color-text-primary);
    }
  `

  private toggleTheme() {
    this.isDark = !this.isDark
    const theme = this.isDark ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    localStorage.setItem('bd-theme', theme)
  }

  override render() {
    return html`
      <div class="board-region" role="region" aria-label="Kanban board">
        <header class="column-header-row" role="row" aria-label="Board columns">
          <div class="column-label" role="columnheader">Open</div>
          <div class="column-label" role="columnheader">Ready</div>
          <div class="column-label column-label--inprogress" role="columnheader">In Progress</div>
          <div class="column-label column-label--done" role="columnheader">Done</div>
          <button
            class="theme-toggle"
            @click=${this.toggleTheme}
            aria-label=${this.isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >${this.isDark ? '☀' : '☾'}</button>
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
