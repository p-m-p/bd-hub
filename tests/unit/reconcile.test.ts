import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReconciler } from '../../src/server/reconcile.js'

describe('createReconciler()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('refreshes on each interval while clients are connected', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined)
    const stop = createReconciler(refresh, () => true, 30_000)
    await vi.advanceTimersByTimeAsync(29_999)
    expect(refresh).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(refresh).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(refresh).toHaveBeenCalledTimes(2)
    stop()
  })

  it('does nothing while no clients are connected', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined)
    const stop = createReconciler(refresh, () => false, 1000)
    await vi.advanceTimersByTimeAsync(5000)
    expect(refresh).not.toHaveBeenCalled()
    stop()
  })

  it('skips a tick while the previous refresh is still running', async () => {
    let finish!: () => void
    const refresh = vi.fn(
      () =>
        new Promise<void>((r) => {
          finish = r
        }),
    )
    const stop = createReconciler(refresh, () => true, 1000)
    await vi.advanceTimersByTimeAsync(3000)
    expect(refresh).toHaveBeenCalledTimes(1)
    finish()
    await vi.advanceTimersByTimeAsync(1000)
    expect(refresh).toHaveBeenCalledTimes(2)
    stop()
  })

  it('keeps ticking after a refresh fails', async () => {
    const refresh = vi
      .fn()
      .mockRejectedValueOnce(new Error('bd failed'))
      .mockResolvedValue(undefined)
    const stop = createReconciler(refresh, () => true, 1000)
    await vi.advanceTimersByTimeAsync(2000)
    expect(refresh).toHaveBeenCalledTimes(2)
    stop()
  })

  it('stops ticking after cleanup', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined)
    const stop = createReconciler(refresh, () => true, 1000)
    stop()
    await vi.advanceTimersByTimeAsync(5000)
    expect(refresh).not.toHaveBeenCalled()
  })
})
