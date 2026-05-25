import { css, html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'

@customElement('bd-title-bar')
export class BdTitleBar extends LitElement {
  @state() private _name = ''

  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      height: 2.5rem;
      padding: 0 1rem;
      background: var(--bd-color-bg-mantle);
      border-bottom: 1px solid var(--bd-color-border);
      flex-shrink: 0;
    }
    .project-name {
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--bd-color-text-primary);
    }
    .spacer { flex: 1; }
  `

  override async connectedCallback() {
    super.connectedCallback()
    try {
      const res = await fetch('/api/info')
      if (res.ok) {
        const { name } = (await res.json()) as { name: string }
        this._name = name
        document.title = `${name} — bd-hub`
      }
    } catch {
      // server not ready — leave name empty, title stays as-is
    }
  }

  override render() {
    return html`
      <span class="project-name">${this._name}</span>
      <div class="spacer" role="none"></div>
    `
  }
}
