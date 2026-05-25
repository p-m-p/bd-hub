import prismLight from 'catppuccin-prismjs/themes/latte.css?inline'
import prismDark from 'catppuccin-prismjs/themes/mocha.css?inline'
import { css, html, LitElement, unsafeCSS } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
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
  @state() private _renderedHtml = ''

  @query('dialog') private _dialog!: HTMLDialogElement

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
      background: var(--bd-color-bg-surface);
      color: var(--bd-color-text-primary);
    }
    dialog[open] {
      display: flex;
      flex-direction: column;
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

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has('beadId') && changed.get('beadId') !== undefined) {
      this._bead = null
      this._error = false
    }
  }

  async open() {
    await this.updateComplete
    if (!this._dialog) return
    this._dialog.showModal()
    if (!this._bead && !this._loading) {
      void this._fetchBead()
    }
  }

  private async _fetchBead() {
    this._loading = true
    this._error = false
    try {
      const res = await fetch(`/api/bead/${this.beadId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      this._bead = (await res.json()) as Record<string, unknown>
      const description = this._bead?.description
      this._renderedHtml =
        typeof description === 'string' && description
          ? md.render(description)
          : ''
    } catch {
      this._error = true
    } finally {
      this._loading = false
    }
  }

  private _close() {
    this._dialog?.close()
  }

  private _onDialogClick(e: MouseEvent) {
    if (e.target === this._dialog) this._dialog.close()
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
            @click=${this._close}
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
