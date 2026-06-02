import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  type BoardState,
  boardContext,
  type EpicAge,
  emptyBoardState,
} from '../store/context.js'

const AGE_OPTIONS: { value: EpicAge; label: string }[] = [
  { value: '1m', label: 'Last month' },
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last year' },
  { value: 'all', label: 'All time' },
]

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
      gap: var(--bd-space-3);
    }
    .project-name {
      font-size: var(--bd-font-size-sm);
      font-weight: var(--bd-font-weight-semibold);
      letter-spacing: var(--bd-tracking-label);
      color: var(--bd-color-text-primary);
    }
    .spacer { flex: 1; }
    .age-label {
      font-size: var(--bd-font-size-xs);
      color: var(--bd-color-text-muted);
    }
    .age-select {
      font-size: var(--bd-font-size-xs);
      font-family: inherit;
      color: var(--bd-color-text-primary);
      background: var(--bd-color-bg-surface);
      border: 1px solid var(--bd-color-border);
      border-radius: var(--bd-radius-sm);
      padding: 0.15rem var(--bd-space-2);
      cursor: pointer;
      appearance: none;
      padding-right: var(--bd-space-4);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.4rem center;
    }
    .age-select:focus-visible {
      outline: 2px solid var(--bd-color-accent-in-progress);
      outline-offset: 2px;
    }
  `

  override updated(changed: Map<string, unknown>) {
    if (changed.has('boardState')) {
      const name = this.boardState.projectName
      if (name) {
        document.title = `${name} — bd-hub`
      }
    }
  }

  private _onAgeChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as EpicAge
    this.boardState.ui.setEpicAge(value)
  }

  override render() {
    const currentAge = this.boardState.ui.epicAge
    return html`
      <span class="project-name">${this.boardState.projectName}</span>
      <div class="spacer" role="none"></div>
      <label class="age-label" for="epic-age-select">Show</label>
      <select
        id="epic-age-select"
        class="age-select"
        .value=${currentAge}
        @change=${this._onAgeChange}
        aria-label="Show epics from"
      >
        ${AGE_OPTIONS.map(
          ({ value, label }) =>
            html`<option value=${value} ?selected=${currentAge === value}>${label}</option>`,
        )}
      </select>
    `
  }
}
