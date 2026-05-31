import { consume } from '@lit/context'
import { css, html, LitElement, nothing } from 'lit'
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

  /** Announce text queued for the live region; cleared after render. */
  @state() private _liveText = ''

  /** Total task count from the last render — used to detect updates. */
  private _prevTaskCount = 0

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
    /* Visually-hidden live region — readable by screen readers only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `

  private _onOpenBead(e: Event) {
    const { beadId } = (e as CustomEvent<{ beadId: string }>).detail
    this._dialog.beadId = beadId
    void this._dialog.open()
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has('boardState')) {
      const tasks = this.boardState.tasks
      const total =
        tasks.open.length +
        tasks.ready.length +
        tasks.inProgress.length +
        tasks.done.length
      if (this._prevTaskCount > 0 && total !== this._prevTaskCount) {
        this._liveText = 'Board updated'
        // Clear after a tick so future identical updates still fire
        setTimeout(() => {
          this._liveText = ''
        }, 1000)
      }
      this._prevTaskCount = total
    }
  }

  override render() {
    return html`
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        ${this._liveText || nothing}
      </div>
      <bd-title-bar></bd-title-bar>
      <div class="board-region" role="region" aria-label="Kanban board">
        <header class="column-header-row" role="group" aria-label="Board columns">
          <div class="column-label">Open</div>
          <div class="column-label">Ready</div>
          <div class="column-label column-label--inprogress">In Progress</div>
          <div class="column-label column-label--done">Done</div>
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
