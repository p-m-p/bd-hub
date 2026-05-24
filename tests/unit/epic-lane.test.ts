import { describe, expect, it } from 'vitest'

describe('epic-lane module', () => {
  it('source file exists at src/client/epic/epic-lane.ts', async () => {
    const { existsSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const modulePath = resolve(
      import.meta.dirname,
      '../../src/client/epic/epic-lane.ts',
    )
    expect(existsSync(modulePath)).toBe(true)
  })
})
