import prismLight from 'catppuccin-prismjs/themes/latte.css?inline'
import prismDark from 'catppuccin-prismjs/themes/mocha.css?inline'
import { css, html, LitElement, nothing, unsafeCSS } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import MarkdownIt from 'markdown-it'
import Prism from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-yaml'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const md = new MarkdownIt({
  highlight(code, lang) {
    const grammar = Prism.languages[lang]
    const highlighted = grammar
      ? Prism.highlight(code, grammar, lang)
      : escapeHtml(code)
    const cls = lang ? ` class="language-${lang}"` : ''
    return `<pre${cls}><code${cls}>${highlighted}</code></pre>`
  },
})

type Dep = { id: string; title: string; status: string }

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

    /* Header */
    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 1rem 1.25rem 0.75rem;
      border-bottom: 1px solid var(--bd-color-border);
      flex-shrink: 0;
      gap: 0.75rem;
    }
    .dialog-title {
      margin: 0;
      font-size: 0.975rem;
      font-weight: 600;
      line-height: 1.35;
    }
    .dialog-id {
      font-size: 0.65rem;
      color: var(--bd-color-text-muted);
      font-family: monospace;
      margin-top: 0.2rem;
    }
    .dialog-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--bd-color-text-muted);
      font-size: 1.1rem;
      padding: 0.25rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .dialog-close:hover { color: var(--bd-color-text-primary); }

    /* Meta row */
    .dialog-meta {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 1.25rem;
      border-bottom: 1px solid var(--bd-color-border);
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .meta-chip {
      font-size: 0.625rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .meta-type {
      background: var(--bd-color-bg-mantle);
      color: var(--bd-color-text-muted);
    }
    .meta-status {
      color: var(--bd-color-text-on-accent);
      background: var(--bd-color-text-muted);
    }
    .meta-status[data-status='in_progress'] { background: var(--bd-color-accent-in-progress); }
    .meta-status[data-status='closed']      { background: var(--bd-color-accent-done); }
    .meta-status[data-status='blocked']     { background: var(--bd-color-priority-p0); }
    .meta-priority {
      background: var(--bd-color-bg-mantle);
      color: var(--bd-color-text-muted);
      border: 1px solid var(--bd-color-border);
    }
    .meta-dot { color: var(--bd-color-border); }
    .meta-assignee, .meta-time { font-size: 0.75rem; color: var(--bd-color-text-muted); }

    /* Body */
    .dialog-body {
      padding: 1rem 1.25rem 1.25rem;
      overflow-y: auto;
      flex: 1;
      line-height: 1.6;
    }
    /* Overflow containers swallow bottom padding; use a pseudo-element instead */
    .dialog-body::after {
      content: '';
      display: block;
      height: 0.25rem;
    }

    /* Prose */
    .dialog-body h1 { font-size: 1.05rem; margin: 1rem 0 0.35rem; font-weight: 600; }
    .dialog-body h2 { font-size: 0.95rem; margin: 0.85rem 0 0.3rem; font-weight: 600; }
    .dialog-body h3 { font-size: 0.875rem; margin: 0.7rem 0 0.25rem; font-weight: 600; }
    .dialog-body h1, .dialog-body h2, .dialog-body h3 { color: var(--bd-color-text-primary); }
    .dialog-body p { margin: 0.4rem 0; }
    .dialog-body ul, .dialog-body ol { margin: 0.4rem 0; padding-left: 1.4rem; }
    .dialog-body li { margin: 0.15rem 0; }
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
      padding: 0.75rem 1rem;
    }

    /* Sections (notes, criteria, deps) */
    .dialog-section {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--bd-color-border);
    }
    .section-title {
      font-size: 0.675rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--bd-color-text-muted);
      margin: 0 0 0.5rem;
    }

    /* Dependencies */
    .dep-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.3rem; }
    .dep-item { display: flex; align-items: baseline; gap: 0.5rem; }
    .dep-link {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      font-size: 0.8rem;
      color: var(--bd-color-accent-in-progress);
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
      text-align: left;
    }
    .dep-link:hover { opacity: 0.8; }
    .dep-status { font-size: 0.65rem; color: var(--bd-color-text-muted); margin-left: auto; flex-shrink: 0; }

    .dialog-loading { color: var(--bd-color-text-muted); padding: 2rem; text-align: center; }
    .dialog-error   { color: var(--bd-color-text-muted); padding: 1rem; }
  `

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has('beadId') && changed.get('beadId') !== undefined) {
      this._bead = null
      this._error = false
      this._renderedHtml = ''
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
    } catch (err) {
      console.error(`[bd-bead-dialog] Failed to fetch "${this.beadId}":`, err)
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

  private _navigateToBead(id: string) {
    this.beadId = id
    void this._fetchBead()
  }

  private _renderMd(text: unknown) {
    if (typeof text !== 'string' || !text) return nothing
    return unsafeHTML(md.render(text))
  }

  override render() {
    const b = this._bead
    const title = typeof b?.title === 'string' ? b.title : this.beadId
    const deps = (
      Array.isArray(b?.dependencies) ? b!.dependencies : []
    ) as Dep[]
    const status = typeof b?.status === 'string' ? b.status : ''

    return html`
      <dialog @click=${this._onDialogClick}>
        <header class="dialog-header">
          <div>
            <h2 class="dialog-title">${title}</h2>
            ${b?.id ? html`<div class="dialog-id">${b.id}</div>` : nothing}
          </div>
          <button type="button" class="dialog-close" aria-label="Close dialog" @click=${this._close}>✕</button>
        </header>

        ${
          b
            ? html`
          <div class="dialog-meta">
            <span class="meta-chip meta-type">${b.issue_type}</span>
            <span class="meta-chip meta-status" data-status=${status}>
              ${status.replace(/_/g, ' ')}
            </span>
            ${b.priority != null ? html`<span class="meta-chip meta-priority">P${b.priority}</span>` : nothing}
            ${b.assignee ? html`<span class="meta-dot">·</span><span class="meta-assignee">${b.assignee}</span>` : nothing}
            ${b.updated_at ? html`<span class="meta-dot">·</span><span class="meta-time">${relativeTime(b.updated_at as string)}</span>` : nothing}
          </div>
        `
            : nothing
        }

        <div class="dialog-body">
          ${
            this._loading
              ? html`<p class="dialog-loading">Loading…</p>`
              : this._error
                ? html`<p class="dialog-error">Failed to load bead details.</p>`
                : html`
                  ${unsafeHTML(this._renderedHtml)}

                  ${
                    b?.notes
                      ? html`
                    <div class="dialog-section">
                      <p class="section-title">Notes</p>
                      ${this._renderMd(b.notes)}
                    </div>
                  `
                      : nothing
                  }

                  ${
                    b?.acceptance_criteria
                      ? html`
                    <div class="dialog-section">
                      <p class="section-title">Acceptance criteria</p>
                      ${this._renderMd(b.acceptance_criteria)}
                    </div>
                  `
                      : nothing
                  }

                  ${
                    deps.length
                      ? html`
                    <div class="dialog-section">
                      <p class="section-title">Dependencies</p>
                      <ul class="dep-list">
                        ${deps.map(
                          (dep) => html`
                          <li class="dep-item">
                            <button type="button" class="dep-link"
                              @click=${() => this._navigateToBead(dep.id)}
                            >${dep.title}</button>
                            <span class="dep-status">${dep.status.replace(/_/g, ' ')}</span>
                          </li>
                        `,
                        )}
                      </ul>
                    </div>
                  `
                      : nothing
                  }
                `
          }
        </div>
      </dialog>
    `
  }
}
