import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('bd-subtask-tally')
export class BdSubtaskTally extends LitElement {
  @property({ type: Number }) total = 0
  @property({ type: Number }) done = 0

  static override styles = css`
    :host { display: inline-block; }
    .tally {
      font-size: 0.7rem;
      color: var(--bd-mocha-subtext, #a6adc8);
      padding: 0.1rem 0.4rem;
      background: var(--bd-mocha-base, #1e1e2e);
      border-radius: 0.25rem;
    }
  `

  override render() {
    if (this.total === 0) return html``
    return html`<span class="tally">${this.done} of ${this.total} complete</span>`
  }
}
