import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock chokidar before importing watcher
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
    mockWatcher = {
      on: vi.fn().mockReturnThis(),
      close: vi.fn(),
    }
    vi.mocked(chokidar.watch).mockReturnValue(
      mockWatcher as ReturnType<typeof chokidar.watch>,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('watches the specified beads directory', () => {
    createWatcher('/path/to/.beads', vi.fn())
    expect(chokidar.watch).toHaveBeenCalledWith(
      '/path/to/.beads',
      expect.objectContaining({
        ignoreInitial: true,
      }),
    )
  })

  it('debounces rapid changes — only fires once for multiple changes within 300ms', () => {
    const onChange = vi.fn()
    createWatcher('/path/to/.beads', onChange)

    // Get the 'all' event handler registered on the mock watcher
    const [[, handler]] = vi.mocked(mockWatcher.on).mock.calls

    // Simulate rapid file changes
    handler('change', 'file1')
    handler('change', 'file2')
    handler('change', 'file3')

    // Before debounce window: onChange not called yet
    vi.advanceTimersByTime(200)
    expect(onChange).not.toHaveBeenCalled()

    // After 300ms: onChange called exactly once
    vi.advanceTimersByTime(100)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('fires onChange after quiet period following a single change', () => {
    const onChange = vi.fn()
    createWatcher('/path/to/.beads', onChange)
    const [[, handler]] = vi.mocked(mockWatcher.on).mock.calls

    handler('change', 'file1')
    vi.advanceTimersByTime(300)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('resets debounce timer on each new change', () => {
    const onChange = vi.fn()
    createWatcher('/path/to/.beads', onChange)
    const [[, handler]] = vi.mocked(mockWatcher.on).mock.calls

    handler('change', 'file1')
    vi.advanceTimersByTime(200)
    handler('change', 'file2') // resets timer
    vi.advanceTimersByTime(200) // still not 300ms from last change
    expect(onChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100) // now 300ms from last change
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('cleanup function closes the chokidar watcher', () => {
    const cleanup = createWatcher('/path/to/.beads', vi.fn())
    cleanup()
    expect(mockWatcher.close).toHaveBeenCalled()
  })

  it('cleanup prevents pending callbacks from firing', () => {
    const onChange = vi.fn()
    const cleanup = createWatcher('/path/to/.beads', onChange)
    const [[, handler]] = vi.mocked(mockWatcher.on).mock.calls

    handler('change', 'file1')
    cleanup() // clean up before debounce fires
    vi.advanceTimersByTime(300)
    expect(onChange).not.toHaveBeenCalled()
  })
})
