import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_THEME, loadBuiltinTheme } from './themes.js'

export const CONFIG_FILENAME = 'bd-hub.config.json'

export interface ThemeFont {
  family?: string
  monoFamily?: string
  scale?: number
}

export type ThemeColors = Partial<Record<ColorKey, string>>

export type PrismColors = Partial<Record<PrismColorKey, string>>

export interface ThemeConfig {
  font?: ThemeFont
  spacing?: 'dense' | 'normal' | 'spacious'
  mode?: 'auto' | 'light' | 'dark'
  colors?: ThemeColors
  light?: ThemeColors
  dark?: ThemeColors
  /**
   * Syntax-highlighting colors, emitted as --bd-theme-prism-* override
   * vars read by the client's shared Prism token stylesheet. `colors`
   * applies to both schemes; `light`/`dark` per scheme.
   */
  prism?: { colors?: PrismColors; light?: PrismColors; dark?: PrismColors }
  prismTheme?: string | { dark?: string; light?: string }
}

/** Config color keys → token name suffixes used in tokens.css */
export const COLOR_KEYS = {
  bgBase: 'bg-base',
  bgMantle: 'bg-mantle',
  bgSurface: 'bg-surface',
  border: 'border',
  borderMuted: 'border-muted',
  textPrimary: 'text-primary',
  textMuted: 'text-muted',
  textOnAccent: 'text-on-accent',
  accentInProgress: 'accent-in-progress',
  accentDone: 'accent-done',
  priorityP0: 'priority-p0',
  priorityP1: 'priority-p1',
  priorityP2: 'priority-p2',
  priorityP3: 'priority-p3',
} as const

export type ColorKey = keyof typeof COLOR_KEYS

/**
 * Prism color keys → var name suffixes used by the client's shared Prism
 * token stylesheet (src/client/styles/prism-tokens.ts). One key per themed
 * Prism token class, plus the base `text` color and code `background`.
 */
export const PRISM_COLOR_KEYS = {
  text: 'text',
  background: 'background',
  comment: 'comment',
  prolog: 'prolog',
  doctype: 'doctype',
  cdata: 'cdata',
  punctuation: 'punctuation',
  namespace: 'namespace',
  property: 'property',
  tag: 'tag',
  boolean: 'boolean',
  number: 'number',
  constant: 'constant',
  symbol: 'symbol',
  deleted: 'deleted',
  selector: 'selector',
  attrName: 'attr-name',
  string: 'string',
  char: 'char',
  builtin: 'builtin',
  inserted: 'inserted',
  operator: 'operator',
  entity: 'entity',
  url: 'url',
  atrule: 'atrule',
  attrValue: 'attr-value',
  keyword: 'keyword',
  function: 'function',
  className: 'class-name',
  regex: 'regex',
  important: 'important',
  variable: 'variable',
} as const

export type PrismColorKey = keyof typeof PRISM_COLOR_KEYS

const SPACE_SCALES: Record<string, number> = {
  dense: 0.75,
  normal: 1,
  spacious: 1.25,
}

/**
 * Load the theme config from `bd-hub.config.json` in the given directory
 * (defaults to the server's working directory). `theme` may be a built-in
 * theme name (e.g. "catppuccin", "dracula") or a theme object. When the
 * file or the theme option is missing or unusable, the named default
 * (catppuccin) is loaded instead — its theme file mirrors the fallback
 * values baked into tokens.css.
 */
export function loadThemeConfig(dir = process.cwd()): ThemeConfig | null {
  const path = join(dir, CONFIG_FILENAME)
  if (!existsSync(path)) return loadBuiltinTheme(DEFAULT_THEME)
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    const theme = parsed?.theme
    if (theme === undefined) return loadBuiltinTheme(DEFAULT_THEME)
    if (typeof theme === 'string') {
      return loadBuiltinTheme(theme) ?? loadBuiltinTheme(DEFAULT_THEME)
    }
    if (theme === null || typeof theme !== 'object' || Array.isArray(theme)) {
      console.warn(
        `bd-hub: "theme" in ${CONFIG_FILENAME} must be a built-in theme name or an object`,
      )
      return loadBuiltinTheme(DEFAULT_THEME)
    }
    return theme as ThemeConfig
  } catch (err) {
    console.warn(`bd-hub: could not parse ${CONFIG_FILENAME}:`, err)
    return loadBuiltinTheme(DEFAULT_THEME)
  }
}

// CSS values are interpolated into a stylesheet — reject anything that could
// terminate the declaration or rule it lives in.
function safeValue(value: unknown, label: string): string | null {
  const hasControlChar = [...String(value)].some(
    (ch) => (ch.codePointAt(0) ?? 0) < 0x20,
  )
  if (typeof value !== 'string' || /[{};]/.test(value) || hasControlChar) {
    console.warn(`bd-hub: ignoring invalid theme value for ${label}`)
    return null
  }
  return value
}

function colorVars(
  colors: Record<string, unknown> | undefined,
  schemes: Array<'light' | 'dark'>,
  label: string,
  keys: Record<string, string> = COLOR_KEYS,
  varPrefix = '--bd-theme-',
): string[] {
  if (!colors || typeof colors !== 'object') return []
  const vars: string[] = []
  for (const [key, value] of Object.entries(colors)) {
    const suffix = keys[key]
    if (!suffix) {
      console.warn(`bd-hub: unknown theme color "${label}.${key}"`)
      continue
    }
    const safe = safeValue(value, `${label}.${key}`)
    if (safe === null) continue
    for (const scheme of schemes) {
      vars.push(`${varPrefix}${scheme}-${suffix}: ${safe};`)
    }
  }
  return vars
}

/**
 * Generate the contents of /theme.css from a loaded theme config. Only emits
 * the `--bd-theme-*` override vars the user actually set; tokens.css supplies
 * every default via var() fallbacks, so an empty rule means stock Catppuccin.
 */
export function generateThemeCss(theme: ThemeConfig | null): string {
  const vars: string[] = []

  if (theme) {
    if (theme.mode === 'light' || theme.mode === 'dark') {
      vars.push(`--bd-color-scheme: ${theme.mode};`)
    } else if (theme.mode !== undefined && theme.mode !== 'auto') {
      console.warn(`bd-hub: unknown theme mode "${theme.mode}"`)
    }

    if (theme.font && typeof theme.font === 'object') {
      const family = theme.font.family
      if (family !== undefined) {
        const safe = safeValue(family, 'font.family')
        if (safe !== null) vars.push(`--bd-theme-font-family: ${safe};`)
      }
      const monoFamily = theme.font.monoFamily
      if (monoFamily !== undefined) {
        const safe = safeValue(monoFamily, 'font.monoFamily')
        if (safe !== null) vars.push(`--bd-theme-font-family-mono: ${safe};`)
      }
      const scale = theme.font.scale
      if (scale !== undefined) {
        if (typeof scale === 'number' && Number.isFinite(scale) && scale > 0) {
          vars.push(`--bd-theme-font-scale: ${scale};`)
        } else {
          console.warn('bd-hub: theme font.scale must be a positive number')
        }
      }
    }

    if (theme.spacing !== undefined) {
      const scale = SPACE_SCALES[theme.spacing]
      if (scale === undefined) {
        console.warn(`bd-hub: unknown theme spacing "${theme.spacing}"`)
      } else if (scale !== 1) {
        vars.push(`--bd-theme-space-scale: ${scale};`)
      }
    }

    // `colors` is a single non-reactive theme: apply to both schemes so the
    // light-dark() tokens resolve to the same value either way.
    vars.push(...colorVars(theme.colors, ['light', 'dark'], 'colors'))
    vars.push(...colorVars(theme.light, ['light'], 'light'))
    vars.push(...colorVars(theme.dark, ['dark'], 'dark'))

    if (theme.prism && typeof theme.prism === 'object') {
      const prismVars = (
        colors: PrismColors | undefined,
        schemes: Array<'light' | 'dark'>,
        label: string,
      ) =>
        colorVars(colors, schemes, label, PRISM_COLOR_KEYS, '--bd-theme-prism-')
      vars.push(
        ...prismVars(theme.prism.colors, ['light', 'dark'], 'prism.colors'),
      )
      vars.push(...prismVars(theme.prism.light, ['light'], 'prism.light'))
      vars.push(...prismVars(theme.prism.dark, ['dark'], 'prism.dark'))
    }
  }

  const body = vars.map((v) => `  ${v}`).join('\n')
  return `/* bd-hub theme overrides — generated from ${CONFIG_FILENAME} */\n:root {\n${body}${body ? '\n' : ''}}\n`
}

/**
 * Read custom Prism theme CSS files referenced by `prismTheme` in the config.
 * Returns `{ dark: null, light: null }` when no custom theme is configured.
 * A single string path is used for both schemes; `{ dark, light }` keys select
 * per-scheme files. Missing files are warned and returned as null (falls back
 * to the shared Prism token stylesheet in the client). Built-in themes use
 * the `prism` color block instead and never produce CSS here.
 */
export function loadPrismCss(
  theme: ThemeConfig | null,
  dir = process.cwd(),
): { dark: string | null; light: string | null } {
  if (!theme?.prismTheme) return { dark: null, light: null }

  const readFile = (relPath: string): string | null => {
    try {
      return readFileSync(join(dir, relPath), 'utf8')
    } catch {
      console.warn(`bd-hub: could not read prismTheme file "${relPath}"`)
      return null
    }
  }

  if (typeof theme.prismTheme === 'string') {
    const css = readFile(theme.prismTheme)
    return { dark: css, light: css }
  }

  return {
    dark: theme.prismTheme.dark ? readFile(theme.prismTheme.dark) : null,
    light: theme.prismTheme.light ? readFile(theme.prismTheme.light) : null,
  }
}
