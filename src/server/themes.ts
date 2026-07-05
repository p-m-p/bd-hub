import type { ThemeConfig } from './theme.js'

// Same minimal shape as the bundled catppuccin-prismjs themes: base color,
// code background, and token colors only — layout comes from the dialog.

/** Based on the official Dracula theme for Prism (MIT, draculatheme.com) */
const DRACULA_PRISM_CSS = `
code[class*="language-"],
pre[class*="language-"] {
  color: #f8f8f2;
}

:not(pre) > code[class*="language-"],
pre[class*="language-"] {
  background: #21222c;
}

.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: #6272a4;
}

.token.punctuation,
.token.operator,
.token.entity,
.token.url {
  color: #f8f8f2;
}

.token.property,
.token.tag,
.token.constant,
.token.symbol,
.token.deleted {
  color: #ff79c6;
}

.token.boolean,
.token.number {
  color: #bd93f9;
}

.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin,
.token.inserted {
  color: #50fa7b;
}

.token.atrule,
.token.attr-value,
.token.function,
.token.class-name {
  color: #f1fa8c;
}

.token.keyword {
  color: #8be9fd;
}

.token.regex,
.token.important {
  color: #ffb86c;
}

.token.important,
.token.bold {
  font-weight: bold;
}

.token.italic {
  font-style: italic;
}
`

/** Based on Prism's okaidia theme (MIT), itself based on Monokai */
const MONOKAI_PRISM_CSS = `
code[class*="language-"],
pre[class*="language-"] {
  color: #f8f8f2;
}

:not(pre) > code[class*="language-"],
pre[class*="language-"] {
  background: #1e1f1c;
}

.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: #75715e;
}

.token.punctuation,
.token.operator,
.token.entity,
.token.url {
  color: #f8f8f2;
}

.token.property,
.token.tag,
.token.constant,
.token.symbol,
.token.deleted {
  color: #f92672;
}

.token.boolean,
.token.number {
  color: #ae81ff;
}

.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin,
.token.inserted {
  color: #a6e22e;
}

.token.atrule,
.token.attr-value,
.token.function,
.token.class-name {
  color: #e6db74;
}

.token.keyword {
  color: #66d9ef;
}

.token.regex,
.token.important {
  color: #fd971f;
}

.token.important,
.token.bold {
  font-weight: bold;
}

.token.italic {
  font-style: italic;
}
`

/**
 * Built-in themes selectable by name via `"theme": "<name>"` in
 * bd-hub.config.json. Each entry is a plain ThemeConfig, so a named theme
 * goes through exactly the same CSS generation as a user-supplied object.
 *
 * Catppuccin is the stock palette baked into tokens.css (Latte light /
 * Mocha dark), so its entry emits no overrides.
 */
export const BUILTIN_THEMES: Record<string, ThemeConfig> = {
  catppuccin: {},
  dracula: {
    // Dracula is a dark-only palette (https://draculatheme.com/contribute)
    mode: 'dark',
    colors: {
      bgBase: '#282a36',
      bgMantle: '#21222c',
      bgSurface: '#343746',
      border: '#44475a',
      borderMuted: '#6272a4',
      textPrimary: '#f8f8f2',
      textMuted: '#6272a4',
      textOnAccent: '#282a36',
      accentInProgress: '#bd93f9',
      accentDone: '#50fa7b',
      priorityP0: '#ff5555',
      priorityP1: '#ffb86c',
      priorityP2: '#f1fa8c',
      priorityP3: '#50fa7b',
    },
    prismCss: { dark: DRACULA_PRISM_CSS, light: DRACULA_PRISM_CSS },
  },
  monokai: {
    // Classic Monokai is a dark-only palette
    mode: 'dark',
    colors: {
      bgBase: '#272822',
      bgMantle: '#1e1f1c',
      bgSurface: '#3e3d32',
      border: '#49483e',
      borderMuted: '#75715e',
      textPrimary: '#f8f8f2',
      textMuted: '#75715e',
      textOnAccent: '#272822',
      accentInProgress: '#66d9ef',
      accentDone: '#a6e22e',
      priorityP0: '#f92672',
      priorityP1: '#fd971f',
      priorityP2: '#e6db74',
      priorityP3: '#a6e22e',
    },
    prismCss: { dark: MONOKAI_PRISM_CSS, light: MONOKAI_PRISM_CSS },
  },
}
