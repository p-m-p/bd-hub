import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('chokidar', () => ({
  default: {
    watch: vi.fn(),
  },
}))

import chokidar from 'chokidar'
import { createWatcher } from '../../src/server/watcher.js'

describe('createWatcher', () => {
  let mockWatcher: {
    on: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.useFakeTimers()
    mockWatcher = { on: vi.fn().mockReturnThis(), close: vi.fn() }
    vi.mocked(chokidar.watch).mockReturnValue(
      mockWatcher as unknown as ReturnType<typeof chokidar.watch>,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('watches beadsDir excluding embeddeddolt/', () => {
    createWatcher('/path/to/.beads', vi.fn())
    expect(chokidar.watch).toHaveBeenCalledWith(
      '/path/to/.beads',
      expect.objectContaining({
        ignoreInitial: true,
        ignored: expect.any(Function),
      }),
    )
    // The ignored function should exclude embeddeddolt paths
    const { ignored } = vi.mocked(chokidar.watch).mock.calls[0][1] as {
      ignored: (p: string) => boolean
    }
    expect(ignored('/path/to/.beads/embeddeddolt/foo')).toBe(true)
    expect(ignored('/path/to/.beads/issues.jsonl')).toBe(false)
    expect(ignored('/path/to/.beads/last-touched')).toBe(false)
  })

  it('debounces rapid changes — only fires once within 300ms', () => {
    const onChange = vi.fn()
    createWatcher('/path/to/.beads', onChange)
    const [[, handler]] = vi.mocked(mockWatcher.on).mock.calls
    handler('change', 'issues.jsonl')
    handler('change', 'issues.jsonl')
    handler('change', 'issues.jsonl')
    vi.advanceTimersByTime(200)
    expect(onChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('resets debounce timer on each new change', () => {
    const onChange = vi.fn()
    createWatcher('/path/to/.beads', onChange)
    const [[, handler]] = vi.mocked(mockWatcher.on).mock.calls
    handler('change', 'issues.jsonl')
    vi.advanceTimersByTime(200)
    handler('change', 'issues.jsonl')
    vi.advanceTimersByTime(200)
    expect(onChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('cleanup closes the watcher and cancels pending callbacks', () => {
    const onChange = vi.fn()
    const cleanup = createWatcher('/path/to/.beads', onChange)
    const [[, handler]] = vi.mocked(mockWatcher.on).mock.calls
    handler('change', 'issues.jsonl')
    cleanup()
    vi.advanceTimersByTime(300)
    expect(mockWatcher.close).toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })
})
