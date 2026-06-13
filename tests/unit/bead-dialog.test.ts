// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

// Mock heavy imports that bead-dialog pulls in before we can import isStaleFetch
vi.mock('catppuccin-prismjs/themes/latte.css?inline', () => ({ default: '' }))
vi.mock('catppuccin-prismjs/themes/mocha.css?inline', () => ({ default: '' }))

vi.mock('lit', () => ({
  LitElement: class {},
  html: vi.fn(),
  css: vi.fn(),
  nothing: undefined,
  unsafeCSS: vi.fn((s) => s),
}))

vi.mock('lit/decorators.js', () => ({
  customElement: () => (cls: unknown) => cls,
  property: () => () => undefined,
  query: () => () => undefined,
  state: () => () => undefined,
}))

vi.mock('lit/directives/unsafe-html.js', () => ({
  unsafeHTML: vi.fn((s) => s),
}))

vi.mock('markdown-it', () => ({
  default: class {
    render(s: string) {
      return s
    }
    highlight() {
      return ''
    }
  },
}))

vi.mock('prismjs', () => ({ default: { languages: {}, highlight: vi.fn() } }))
vi.mock('prismjs/components/prism-bash', () => ({}))
vi.mock('prismjs/components/prism-json', () => ({}))
vi.mock('prismjs/components/prism-markdown', () => ({}))
vi.mock('prismjs/components/prism-typescript', () => ({}))
vi.mock('prismjs/components/prism-yaml', () => ({}))

import {
  isStaleFetch,
  relativeTime,
  resolveScheme,
} from '../../src/client/task/bead-dialog.js'

describe('isStaleFetch()', () => {
  it('returns false when currentBeadId matches targetBeadId', () => {
    expect(isStaleFetch('bead-123', 'bead-123')).toBe(false)
  })

  it('returns true when beadId changed before the fetch resolved', () => {
    // Simulate: user clicked dep link while first fetch was in-flight
    // targetId = first bead, currentId = second bead
    expect(isStaleFetch('bead-456', 'bead-123')).toBe(true)
  })

  it('returns true for any mismatch regardless of order', () => {
    expect(isStaleFetch('a', 'b')).toBe(true)
    expect(isStaleFetch('b', 'a')).toBe(true)
  })

  it('returns false for equal empty strings', () => {
    expect(isStaleFetch('', '')).toBe(false)
  })

  it('is case-sensitive', () => {
    expect(isStaleFetch('Bead-1', 'bead-1')).toBe(true)
  })
})

describe('isStaleFetch() — concurrent fetch scenario', () => {
  it('first fetch is stale after navigation to second bead', () => {
    const firstBeadId = 'bead-001'
    const secondBeadId = 'bead-002'

    // User opens bead-001, fetch starts with targetId = 'bead-001'
    // User clicks dep link → beadId becomes 'bead-002'
    // First fetch resolves — currentBeadId is now 'bead-002'
    expect(isStaleFetch(secondBeadId, firstBeadId)).toBe(true)

    // Second fetch resolves — targetId = currentBeadId = 'bead-002'
    expect(isStaleFetch(secondBeadId, secondBeadId)).toBe(false)
  })
})

describe('resolveScheme()', () => {
  it('returns "dark" when cssVar is explicitly "dark" regardless of OS', () => {
    expect(resolveScheme('dark', false)).toBe('dark')
    expect(resolveScheme('dark', true)).toBe('dark')
  })

  it('returns "light" when cssVar is explicitly "light" regardless of OS', () => {
    expect(resolveScheme('light', true)).toBe('light')
    expect(resolveScheme('light', false)).toBe('light')
  })

  it('strips surrounding whitespace before comparing', () => {
    expect(resolveScheme('  dark  ', false)).toBe('dark')
    expect(resolveScheme('  light  ', true)).toBe('light')
  })

  it('falls back to OS preference when cssVar is "light dark" (auto mode)', () => {
    expect(resolveScheme('light dark', true)).toBe('dark')
    expect(resolveScheme('light dark', false)).toBe('light')
  })

  it('falls back to OS preference when cssVar is empty', () => {
    expect(resolveScheme('', true)).toBe('dark')
    expect(resolveScheme('', false)).toBe('light')
  })
})

describe('relativeTime()', () => {
  it('returns "just now" for timestamps within the last minute', () => {
    const now = new Date().toISOString()
    expect(relativeTime(now)).toBe('just now')
  })

  it('returns "Xm ago" for timestamps between 1 and 59 minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    expect(relativeTime(fiveMinutesAgo)).toBe('5m ago')
  })

  it('returns "Xh ago" for timestamps between 1 and 23 hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString()
    expect(relativeTime(threeHoursAgo)).toBe('3h ago')
  })

  it('returns "Xd ago" for timestamps 24+ hours ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString()
    expect(relativeTime(twoDaysAgo)).toBe('2d ago')
  })

  it('returns "1m ago" for exactly 1 minute ago', () => {
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    expect(relativeTime(oneMinuteAgo)).toBe('1m ago')
  })
})
