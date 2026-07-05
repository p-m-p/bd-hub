import type { ThemeConfig } from './theme.js'

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
  },
}
