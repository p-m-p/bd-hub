import prismLight from 'catppuccin-prismjs/themes/latte.css?inline'
import prismDark from 'catppuccin-prismjs/themes/mocha.css?inline'
import { css, html, LitElement, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import MarkdownIt from 'markdown-it'
import Prism from 'prismjs'

const md = new MarkdownIt({
  highlight(code, lang) {
    const grammar = Prism.languages[lang]
    if (grammar) return Prism.highlight(code, grammar, lang)
    return code
  },
})

@customElement('bd-bead-dialog')
export class BdBeadDialog extends LitElement {
  @property({ type: String, attribute: 'bead-id' })
  beadId = ''

  @state() private _bead: Record<string, unknown> | null = null
  @state() private _loading = false
  @state() private _error = false

  static override styles = css`
    @media (prefers-color-scheme: dark) {
      ${unsafeCSS(prismDark)}
    }
    @media (prefers-color-scheme: light) {
      ${unsafeCSS(prismLight)}
    }
    dialog {
      border: none;
      border-radius: 8px;
      padding: 0;
      width: min(720px, 90vw);
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      background: var(--bd-color-bg-surface);
      color: var(--bd-color-text-primary);
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem 0.75rem;
      border-bottom: 1px solid var(--bd-color-border);
      flex-shrink: 0;
    }
    .dialog-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--bd-color-text-primary);
    }
    .dialog-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--bd-color-text-muted);
      font-size: 1.1rem;
      padding: 0.25rem;
      line-height: 1;
    }
    .dialog-close:hover { color: var(--bd-color-text-primary); }
    .dialog-body {
      padding: 1rem 1.25rem;
      overflow-y: auto;
      flex: 1;
      line-height: 1.6;
    }
    .dialog-body h1, .dialog-body h2, .dialog-body h3 {
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
      color: var(--bd-color-text-primary);
    }
    .dialog-body p { margin: 0.5rem 0; }
    .dialog-body code:not([class]) {
      background: var(--bd-color-bg-mantle);
      border-radius: 3px;
      padding: 0.1em 0.35em;
      font-size: 0.875em;
    }
    .dialog-body pre {
      border-radius: 6px;
      overflow-x: auto;
      margin: 0.75rem 0;
    }
    .dialog-loading {
      color: var(--bd-color-text-muted);
      padding: 2rem;
      text-align: center;
    }
    .dialog-error {
      color: var(--bd-color-text-muted);
      padding: 1rem;
    }
  `

  open() {
    const dialog = this.shadowRoot?.querySelector('dialog')
    if (!dialog) return
    dialog.showModal()
    if (!this._bead && !this._loading) {
      this._fetchBead()
    }
  }

  private async _fetchBead() {
    this._loading = true
    this._error = false
    try {
      const res = await fetch(`/api/bead/${this.beadId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      this._bead = (await res.json()) as Record<string, unknown>
    } catch {
      this._error = true
    } finally {
      this._loading = false
    }
  }

  private _onDialogClick(e: MouseEvent) {
    const dialog = e.currentTarget as HTMLDialogElement
    if (e.target === dialog) dialog.close()
  }

  private get _renderedHtml(): string {
    const description = this._bead?.description
    if (typeof description !== 'string' || !description) return ''
    return md.render(description)
  }

  override render() {
    const title =
      typeof this._bead?.title === 'string' ? this._bead.title : this.beadId

    return html`
      <dialog @click=${this._onDialogClick}>
        <header class="dialog-header">
          <h2 class="dialog-title">${title}</h2>
          <button
            type="button"
            class="dialog-close"
            aria-label="Close dialog"
            @click=${() => this.shadowRoot?.querySelector('dialog')?.close()}
          >✕</button>
        </header>
        <div class="dialog-body">
          ${
            this._loading
              ? html`<p class="dialog-loading">Loading…</p>`
              : this._error
                ? html`<p class="dialog-error">Failed to load bead details.</p>`
                : unsafeHTML(this._renderedHtml)
          }
        </div>
      </dialog>
    `
  }
}
