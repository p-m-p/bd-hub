import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const CONFIG_FILENAME = 'bd-hub.config.json'

export interface ThemeFont {
  family?: string
  monoFamily?: string
  scale?: number
}

export type ThemeColors = Partial<Record<ColorKey, string>>

export interface ThemeConfig {
  font?: ThemeFont
  spacing?: 'dense' | 'normal' | 'spacious'
  mode?: 'auto' | 'light' | 'dark'
  colors?: ThemeColors
  light?: ThemeColors
  dark?: ThemeColors
}

/** Config color keys → token name suffixes used in tokens.css */
const COLOR_KEYS = {
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

const SPACE_SCALES: Record<string, number> = {
  dense: 0.75,
  normal: 1,
  spacious: 1.25,
}

/**
 * Load the optional theme config from `bd-hub.config.json` in the given
 * directory (defaults to the server's working directory). Returns null when
 * the file is missing or unusable — the dashboard then falls back to the
 * built-in Catppuccin defaults in tokens.css.
 */
export function loadThemeConfig(dir = process.cwd()): ThemeConfig | null {
  const path = join(dir, CONFIG_FILENAME)
  if (!existsSync(path)) return null
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    const theme = parsed?.theme
    if (theme === undefined) return null
    if (theme === null || typeof theme !== 'object' || Array.isArray(theme)) {
      console.warn(`bd-hub: "theme" in ${CONFIG_FILENAME} must be an object`)
      return null
    }
    return theme as ThemeConfig
  } catch (err) {
    console.warn(`bd-hub: could not parse ${CONFIG_FILENAME}:`, err)
    return null
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
  colors: ThemeColors | undefined,
  schemes: Array<'light' | 'dark'>,
  label: string,
): string[] {
  if (!colors || typeof colors !== 'object') return []
  const vars: string[] = []
  for (const [key, value] of Object.entries(colors)) {
    const suffix = COLOR_KEYS[key as ColorKey]
    if (!suffix) {
      console.warn(`bd-hub: unknown theme color "${label}.${key}"`)
      continue
    }
    const safe = safeValue(value, `${label}.${key}`)
    if (safe === null) continue
    for (const scheme of schemes) {
      vars.push(`--bd-theme-${scheme}-${suffix}: ${safe};`)
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
  }

  const body = vars.map((v) => `  ${v}`).join('\n')
  return `/* bd-hub theme overrides — generated from ${CONFIG_FILENAME} */\n:root {\n${body}${body ? '\n' : ''}}\n`
}
