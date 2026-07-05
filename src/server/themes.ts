import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ThemeConfig } from './theme.js'

/**
 * Built-in themes live as standalone files in the top-level themes/
 * directory so new themes can be contributed without touching code:
 *
 *   themes/<name>.json           the theme (filename is the config name)
 *   themes/<name>.prism.css      optional Prism CSS, referenced from the
 *                                JSON via "prismTheme" (same shape as the
 *                                user config option, resolved against the
 *                                themes directory and inlined at load time)
 *
 * After adding a theme run `pnpm generate-schema` to add its name to the
 * config JSON schema — a unit test fails if the two drift apart.
 *
 * Resolved relative to this module: src/server/ in dev, dist/server/ in
 * the published package — themes/ sits two levels up in both.
 */
export const THEMES_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../themes',
)

/** Used when the config file or its "theme" option is missing */
export const DEFAULT_THEME = 'catppuccin'

/** Theme names indexed from the file names in the themes directory */
export function listBuiltinThemes(dir = THEMES_DIR): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -'.json'.length))
    .sort()
}

/**
 * Load a single built-in theme by name, reading only that theme's files.
 * Any Prism CSS it references is inlined as `prismCss` so callers never
 * resolve paths against the themes directory themselves. Returns null
 * (with a warning) for unknown names or unreadable files.
 */
export function loadBuiltinTheme(
  name: string,
  dir = THEMES_DIR,
): ThemeConfig | null {
  // The name comes from user config — never let it form a path
  if (!/^[a-z0-9-]+$/.test(name)) {
    console.warn(`bd-hub: invalid built-in theme name "${name}"`)
    return null
  }

  let raw: string
  try {
    raw = readFileSync(join(dir, `${name}.json`), 'utf8')
  } catch {
    const known = listBuiltinThemes(dir).join(', ')
    console.warn(
      `bd-hub: unknown built-in theme "${name}" (available: ${known})`,
    )
    return null
  }

  let theme: ThemeConfig
  try {
    theme = JSON.parse(raw) as ThemeConfig
  } catch (err) {
    console.warn(`bd-hub: could not parse theme "${name}":`, err)
    return null
  }

  const { prismTheme, ...rest } = theme
  if (!prismTheme) return rest

  const readCss = (relPath: string): string | undefined => {
    try {
      return readFileSync(join(dir, relPath), 'utf8')
    } catch {
      console.warn(
        `bd-hub: theme "${name}" references missing Prism CSS "${relPath}"`,
      )
      return undefined
    }
  }
  if (typeof prismTheme === 'string') {
    const css = readCss(prismTheme)
    return { ...rest, prismCss: { dark: css, light: css } }
  }
  return {
    ...rest,
    prismCss: {
      dark: prismTheme.dark ? readCss(prismTheme.dark) : undefined,
      light: prismTheme.light ? readCss(prismTheme.light) : undefined,
    },
  }
}
