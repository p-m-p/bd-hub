import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CONFIG_FILENAME,
  generateThemeCss,
  loadPrismCss,
  loadThemeConfig,
  type ThemeConfig,
} from '../../src/server/theme.js'
import { BUILTIN_THEMES } from '../../src/server/themes.js'

let tempDir: string | null = null

function dirWithConfig(contents: string): string {
  tempDir = mkdtempSync(join(tmpdir(), 'bd-hub-theme-'))
  writeFileSync(join(tempDir, CONFIG_FILENAME), contents)
  return tempDir
}

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true })
    tempDir = null
  }
  vi.restoreAllMocks()
})

describe('loadThemeConfig', () => {
  it('returns null when no config file exists', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bd-hub-theme-'))
    expect(loadThemeConfig(tempDir)).toBeNull()
  })

  it('returns the theme object from the config file', () => {
    const dir = dirWithConfig(
      JSON.stringify({ theme: { spacing: 'dense', mode: 'dark' } }),
    )
    expect(loadThemeConfig(dir)).toEqual({ spacing: 'dense', mode: 'dark' })
  })

  it('returns null when the config file has no theme key', () => {
    const dir = dirWithConfig(JSON.stringify({ other: true }))
    expect(loadThemeConfig(dir)).toBeNull()
  })

  it('returns null and warns when the config file is invalid JSON', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const dir = dirWithConfig('{ not json')
    expect(loadThemeConfig(dir)).toBeNull()
    expect(warn).toHaveBeenCalled()
  })

  it('returns null and warns when theme is neither a string nor an object', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const dir = dirWithConfig(JSON.stringify({ theme: 42 }))
    expect(loadThemeConfig(dir)).toBeNull()
    expect(warn).toHaveBeenCalled()
  })

  it('resolves a built-in theme name to its theme object', () => {
    const dir = dirWithConfig(JSON.stringify({ theme: 'dracula' }))
    expect(loadThemeConfig(dir)).toEqual(BUILTIN_THEMES.dracula)
  })

  it('resolves the catppuccin name to the built-in default (no overrides)', () => {
    const dir = dirWithConfig(JSON.stringify({ theme: 'catppuccin' }))
    const theme = loadThemeConfig(dir)
    expect(theme).toEqual(BUILTIN_THEMES.catppuccin)
    expect(generateThemeCss(theme)).not.toContain('--bd-')
  })

  it('returns null and warns for an unknown built-in theme name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const dir = dirWithConfig(JSON.stringify({ theme: 'mocha' }))
    expect(loadThemeConfig(dir)).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('mocha'))
  })
})

describe('built-in themes', () => {
  it('includes catppuccin, dracula, and monokai', () => {
    expect(Object.keys(BUILTIN_THEMES).sort()).toEqual([
      'catppuccin',
      'dracula',
      'monokai',
    ])
  })

  it('dracula forces dark mode and emits Dracula palette overrides', () => {
    const css = generateThemeCss(BUILTIN_THEMES.dracula)
    expect(css).toContain('--bd-color-scheme: dark;')
    expect(css).toContain('--bd-theme-dark-bg-base: #282a36;')
    expect(css).toContain('--bd-theme-dark-text-primary: #f8f8f2;')
    expect(css).toContain('--bd-theme-dark-accent-done: #50fa7b;')
    expect(css).toContain('--bd-theme-dark-priority-p0: #ff5555;')
  })

  it('monokai forces dark mode and emits Monokai palette overrides', () => {
    const css = generateThemeCss(BUILTIN_THEMES.monokai)
    expect(css).toContain('--bd-color-scheme: dark;')
    expect(css).toContain('--bd-theme-dark-bg-base: #272822;')
    expect(css).toContain('--bd-theme-dark-text-primary: #f8f8f2;')
    expect(css).toContain('--bd-theme-dark-accent-done: #a6e22e;')
    expect(css).toContain('--bd-theme-dark-priority-p0: #f92672;')
  })

  it('every built-in theme generates CSS without warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    for (const theme of Object.values(BUILTIN_THEMES)) {
      generateThemeCss(theme)
    }
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('generateThemeCss', () => {
  it('returns a :root rule with no declarations for a null theme', () => {
    const css = generateThemeCss(null)
    expect(css).toContain(':root {')
    expect(css).not.toContain('--bd-')
  })

  it('emits font family overrides', () => {
    const css = generateThemeCss({
      font: { family: 'Inter, sans-serif', monoFamily: 'Fira Code, monospace' },
    })
    expect(css).toContain('--bd-theme-font-family: Inter, sans-serif;')
    expect(css).toContain('--bd-theme-font-family-mono: Fira Code, monospace;')
  })

  it('emits a font scale override', () => {
    const css = generateThemeCss({ font: { scale: 1.15 } })
    expect(css).toContain('--bd-theme-font-scale: 1.15;')
  })

  it('ignores a non-numeric or non-positive font scale and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const css = generateThemeCss({
      font: { scale: -2 },
    } as unknown as ThemeConfig)
    expect(css).not.toContain('--bd-theme-font-scale')
    expect(warn).toHaveBeenCalled()
  })

  it('maps spacing density keywords to space scale values', () => {
    expect(generateThemeCss({ spacing: 'dense' })).toContain(
      '--bd-theme-space-scale: 0.75;',
    )
    expect(generateThemeCss({ spacing: 'spacious' })).toContain(
      '--bd-theme-space-scale: 1.25;',
    )
  })

  it('emits nothing for normal spacing', () => {
    expect(generateThemeCss({ spacing: 'normal' })).not.toContain(
      '--bd-theme-space-scale',
    )
  })

  it('ignores an unknown spacing keyword and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const css = generateThemeCss({ spacing: 'cosy' } as unknown as ThemeConfig)
    expect(css).not.toContain('--bd-theme-space-scale')
    expect(warn).toHaveBeenCalled()
  })

  it('forces a fixed color scheme for mode light or dark', () => {
    expect(generateThemeCss({ mode: 'dark' })).toContain(
      '--bd-color-scheme: dark;',
    )
    expect(generateThemeCss({ mode: 'light' })).toContain(
      '--bd-color-scheme: light;',
    )
  })

  it('emits no color scheme for mode auto', () => {
    expect(generateThemeCss({ mode: 'auto' })).not.toContain(
      '--bd-color-scheme',
    )
  })

  it('emits light and dark vars from per-scheme color blocks', () => {
    const css = generateThemeCss({
      light: { bgBase: '#ffffff' },
      dark: { bgBase: '#000000', textPrimary: 'oklch(0.9 0 0)' },
    })
    expect(css).toContain('--bd-theme-light-bg-base: #ffffff;')
    expect(css).toContain('--bd-theme-dark-bg-base: #000000;')
    expect(css).toContain('--bd-theme-dark-text-primary: oklch(0.9 0 0);')
  })

  it('emits a single non-reactive theme by setting both schemes from colors', () => {
    const css = generateThemeCss({ colors: { accentDone: 'rebeccapurple' } })
    expect(css).toContain('--bd-theme-light-accent-done: rebeccapurple;')
    expect(css).toContain('--bd-theme-dark-accent-done: rebeccapurple;')
  })

  it('supports every documented color key', () => {
    const colors = {
      bgBase: '#111111',
      bgMantle: '#222222',
      bgSurface: '#333333',
      border: '#444444',
      borderMuted: '#555555',
      textPrimary: '#666666',
      textMuted: '#777777',
      textOnAccent: '#888888',
      accentInProgress: '#999999',
      accentDone: '#aaaaaa',
      priorityP0: '#bbbbbb',
      priorityP1: '#cccccc',
      priorityP2: '#dddddd',
      priorityP3: '#eeeeee',
    }
    const css = generateThemeCss({ colors })
    expect(css).toContain('--bd-theme-dark-bg-base: #111111;')
    expect(css).toContain('--bd-theme-dark-bg-mantle: #222222;')
    expect(css).toContain('--bd-theme-dark-bg-surface: #333333;')
    expect(css).toContain('--bd-theme-dark-border: #444444;')
    expect(css).toContain('--bd-theme-dark-border-muted: #555555;')
    expect(css).toContain('--bd-theme-dark-text-primary: #666666;')
    expect(css).toContain('--bd-theme-dark-text-muted: #777777;')
    expect(css).toContain('--bd-theme-dark-text-on-accent: #888888;')
    expect(css).toContain('--bd-theme-dark-accent-in-progress: #999999;')
    expect(css).toContain('--bd-theme-dark-accent-done: #aaaaaa;')
    expect(css).toContain('--bd-theme-dark-priority-p0: #bbbbbb;')
    expect(css).toContain('--bd-theme-dark-priority-p1: #cccccc;')
    expect(css).toContain('--bd-theme-dark-priority-p2: #dddddd;')
    expect(css).toContain('--bd-theme-dark-priority-p3: #eeeeee;')
  })

  it('ignores unknown color keys and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const css = generateThemeCss({
      colors: { sparkle: '#ff00ff' },
    } as unknown as ThemeConfig)
    expect(css).not.toContain('sparkle')
    expect(warn).toHaveBeenCalled()
  })

  it('rejects values that would break out of the CSS declaration', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const css = generateThemeCss({
      colors: { bgBase: 'red; } body { display: none' },
      font: { family: 'Hack" }\n@import "evil' },
    } as unknown as ThemeConfig)
    expect(css).not.toContain('display: none')
    expect(css).not.toContain('@import')
    expect(warn).toHaveBeenCalled()
  })
})

describe('loadPrismCss', () => {
  function dirWithFiles(files: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), 'bd-hub-prism-'))
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(dir, name), content)
    }
    tempDir = dir
    return dir
  }

  it('returns { dark: null, light: null } when theme is null', () => {
    expect(loadPrismCss(null)).toEqual({ dark: null, light: null })
  })

  it('returns { dark: null, light: null } when prismTheme is not set', () => {
    expect(loadPrismCss({ mode: 'dark' })).toEqual({ dark: null, light: null })
  })

  it('reads a single string path and uses it for both schemes', () => {
    const dir = dirWithFiles({ 'my-prism.css': '.token { color: red; }' })
    const result = loadPrismCss({ prismTheme: 'my-prism.css' }, dir)
    expect(result.dark).toBe('.token { color: red; }')
    expect(result.light).toBe('.token { color: red; }')
  })

  it('reads separate dark and light files when given an object', () => {
    const dir = dirWithFiles({
      'dark.css': '.token { color: white; }',
      'light.css': '.token { color: black; }',
    })
    const result = loadPrismCss(
      { prismTheme: { dark: 'dark.css', light: 'light.css' } },
      dir,
    )
    expect(result.dark).toBe('.token { color: white; }')
    expect(result.light).toBe('.token { color: black; }')
  })

  it('returns null for a scheme that has no file configured', () => {
    const dir = dirWithFiles({ 'dark.css': '.token { color: white; }' })
    const result = loadPrismCss({ prismTheme: { dark: 'dark.css' } }, dir)
    expect(result.dark).toBe('.token { color: white; }')
    expect(result.light).toBeNull()
  })

  it('returns inline prismCss when the theme carries one', () => {
    const result = loadPrismCss({
      prismCss: { dark: '.token { color: pink; }' },
    })
    expect(result.dark).toBe('.token { color: pink; }')
    expect(result.light).toBeNull()
  })

  it('prefers user prismTheme files over inline prismCss', () => {
    const dir = dirWithFiles({ 'user.css': '.token { color: user; }' })
    const result = loadPrismCss(
      {
        prismTheme: 'user.css',
        prismCss: { dark: '.token { color: builtin; }' },
      },
      dir,
    )
    expect(result.dark).toBe('.token { color: user; }')
    expect(result.light).toBe('.token { color: user; }')
  })

  it('serves matching Prism CSS for the dracula built-in', () => {
    const result = loadPrismCss(BUILTIN_THEMES.dracula)
    expect(result.dark).toContain('#ff79c6')
    expect(result.dark).toContain('.token')
    expect(result.light).toBe(result.dark)
  })

  it('serves matching Prism CSS for the monokai built-in', () => {
    const result = loadPrismCss(BUILTIN_THEMES.monokai)
    expect(result.dark).toContain('#f92672')
    expect(result.dark).toContain('.token')
    expect(result.light).toBe(result.dark)
  })

  it('serves no Prism CSS for catppuccin (client bundles it)', () => {
    expect(loadPrismCss(BUILTIN_THEMES.catppuccin)).toEqual({
      dark: null,
      light: null,
    })
  })

  it('warns and returns null when the file cannot be read', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const dir = mkdtempSync(join(tmpdir(), 'bd-hub-prism-'))
    tempDir = dir
    const result = loadPrismCss({ prismTheme: 'missing.css' }, dir)
    expect(result.dark).toBeNull()
    expect(result.light).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('missing.css'))
  })
})
