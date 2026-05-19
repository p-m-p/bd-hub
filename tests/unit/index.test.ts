import { describe, expect, it } from 'vitest'
import { parseArgs } from '../../src/server/index.js'

describe('parseArgs()', () => {
  it('returns defaults when no flags are provided', () => {
    const result = parseArgs([])
    expect(result.port).toBe(3003)
    expect(result.openBrowser).toBe(false)
  })

  it('sets openBrowser to true when --open is present', () => {
    const result = parseArgs(['--open'])
    expect(result.openBrowser).toBe(true)
    expect(result.port).toBe(3003)
  })

  it('parses --port flag correctly', () => {
    const result = parseArgs(['--port', '4000'])
    expect(result.port).toBe(4000)
    expect(result.openBrowser).toBe(false)
  })

  it('parses --open and --port together', () => {
    const result = parseArgs(['--open', '--port', '8080'])
    expect(result.openBrowser).toBe(true)
    expect(result.port).toBe(8080)
  })

  it('falls back to 3003 when --port value is not a valid number', () => {
    const result = parseArgs(['--port', 'abc'])
    expect(result.port).toBe(3003)
  })

  it('falls back to 3003 when --port flag is missing its value', () => {
    const result = parseArgs(['--port'])
    expect(result.port).toBe(3003)
  })
})
