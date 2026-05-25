import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  emptyBoardState,
} from '../store/context.js'
import '../task/bead-dialog.js'
import type { BdBeadDialog } from '../task/bead-dialog.js'
import './title-bar.js'

@customElement('bd-board')
export class BdBoard extends LitElement {
  @query('bd-bead-dialog') private _dialog!: BdBeadDialog

  @consume({ context: boardContext, subscribe: true })
  @state()
  boardState: BoardState = emptyBoardState

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
  `

  private _onOpenBead(e: Event) {
    const { beadId } = (e as CustomEvent<{ beadId: string }>).detail
    this._dialog.beadId = beadId
    void this._dialog.open()
  }

  override render() {
    return html`
      <bd-title-bar></bd-title-bar>
      <div class="board-region" role="region" aria-label="Kanban board">
        <header class="column-header-row" role="row" aria-label="Board columns">
          <div class="column-label" role="columnheader">Open</div>
          <div class="column-label" role="columnheader">Ready</div>
          <div class="column-label column-label--inprogress" role="columnheader">In Progress</div>
          <div class="column-label column-label--done" role="columnheader">Done</div>
        </header>
        <div class="board-scroll" @open-bead=${this._onOpenBead}>
          ${this.boardState.epics.map(
            (epic) => html`<bd-epic-lane epic-id=${epic.id}></bd-epic-lane>`,
          )}
        </div>
      </div>
      <bd-bead-dialog></bd-bead-dialog>
    `
  }
}
