import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CONFIG_FILENAME,
  generateThemeCss,
  loadThemeConfig,
  type ThemeConfig,
} from '../../src/server/theme.js'

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

  it('returns null and warns when theme is not an object', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const dir = dirWithConfig(JSON.stringify({ theme: 'mocha' }))
    expect(loadThemeConfig(dir)).toBeNull()
    expect(warn).toHaveBeenCalled()
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
