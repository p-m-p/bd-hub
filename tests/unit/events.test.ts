import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

import { execa } from 'execa'
import {
  assertEventsJournal,
  createEventFeed,
  JOURNAL_DISABLED_MESSAGE,
} from '../../src/server/events.js'

type FakeSubprocess = Promise<void> & {
  [Symbol.asyncIterator]: () => AsyncIterator<string>
  kill: ReturnType<typeof vi.fn>
  push: (line: string) => void
  exit: (err?: Error) => void
}

// Mimics an execa subprocess: awaitable, async-iterable over stdout lines,
// and killable. push() emits a line; exit() ends the process.
function fakeSubprocess(): FakeSubprocess {
  const lines: string[] = []
  let waiting: (() => void) | undefined
  let done = false
  let failure: Error | undefined
  let settle!: (err?: Error) => void
  const promise = new Promise<void>((resolve, reject) => {
    settle = (err) => (err ? reject(err) : resolve())
  })
  promise.catch(() => {})
  const wake = () => {
    waiting?.()
    waiting = undefined
  }
  const sub = Object.assign(promise, {
    async *[Symbol.asyncIterator]() {
      while (true) {
        if (lines.length > 0) {
          yield lines.shift() as string
          continue
        }
        if (failure) throw failure
        if (done) return
        await new Promise<void>((r) => {
          waiting = r
        })
      }
    },
    kill: vi.fn(() => sub.exit(new Error('killed'))),
    push: (line: string) => {
      lines.push(line)
      wake()
    },
    exit: (err?: Error) => {
      done = true
      failure = err
      settle(err)
      wake()
    },
  })
  return sub as unknown as FakeSubprocess
}

const record = (seq: number) =>
  JSON.stringify({ seq, op: 'update', issue_id: 'x-1', issue: {} })

describe('assertEventsJournal()', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('resolves when events-journal is true', async () => {
    vi.mocked(execa).mockResolvedValue({
      stdout: JSON.stringify({ key: 'events-journal', value: 'true' }),
    } as never)
    await expect(assertEventsJournal()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('bd', [
      'config',
      'get',
      'events-journal',
      '--json',
    ])
  })

  it('throws the enable hint when events-journal is false', async () => {
    vi.mocked(execa).mockResolvedValue({
      stdout: JSON.stringify({ key: 'events-journal', value: 'false' }),
    } as never)
    await expect(assertEventsJournal()).rejects.toThrow(
      JOURNAL_DISABLED_MESSAGE,
    )
  })

  it('throws the enable hint when bd fails (e.g. bd < 1.3.0)', async () => {
    vi.mocked(execa).mockRejectedValue(new Error('unknown key'))
    await expect(assertEventsJournal()).rejects.toThrow(
      JOURNAL_DISABLED_MESSAGE,
    )
  })

  it('accepts BD_EVENTS_JOURNAL=1 without consulting config', async () => {
    vi.stubEnv('BD_EVENTS_JOURNAL', '1')
    await expect(assertEventsJournal()).resolves.toBeUndefined()
    expect(execa).not.toHaveBeenCalled()
  })

  it('mentions how to enable the journal', () => {
    expect(JOURNAL_DISABLED_MESSAGE).toContain(
      'bd config set events-journal true',
    )
  })
})

describe('createEventFeed()', () => {
  let subs: FakeSubprocess[]

  beforeEach(() => {
    vi.useFakeTimers()
    subs = []
    vi.mocked(execa).mockImplementation((() => {
      const sub = fakeSubprocess()
      subs.push(sub)
      return sub
    }) as never)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  const tailArgs = (since: number) => [
    'events',
    'tail',
    '--since',
    String(since),
    '--follow',
    '--json',
  ]

  it('follows the journal from the start', () => {
    const stop = createEventFeed(vi.fn())
    expect(execa).toHaveBeenCalledWith(
      'bd',
      tailArgs(0),
      expect.objectContaining({ buffer: { stdout: false, stderr: true } }),
    )
    stop()
  })

  it('debounces a burst of records into one onChange call', async () => {
    const onChange = vi.fn()
    const stop = createEventFeed(onChange)
    subs[0].push(record(1))
    subs[0].push(record(2))
    subs[0].push(record(3))
    await vi.advanceTimersByTimeAsync(299)
    expect(onChange).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(onChange).toHaveBeenCalledTimes(1)
    stop()
  })

  it('ignores lines that are not journal records', async () => {
    const onChange = vi.fn()
    const stop = createEventFeed(onChange)
    subs[0].push('not json')
    subs[0].push('')
    await vi.advanceTimersByTimeAsync(500)
    expect(onChange).not.toHaveBeenCalled()
    stop()
  })

  it('restarts from the last seen seq after the tail exits', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stop = createEventFeed(vi.fn(), { restartDelayMs: 1000 })
    subs[0].push(record(41))
    subs[0].push(record(42))
    await vi.advanceTimersByTimeAsync(0)
    subs[0].exit(new Error('boom'))
    await vi.advanceTimersByTimeAsync(999)
    expect(execa).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(execa).toHaveBeenCalledTimes(2)
    expect(vi.mocked(execa).mock.calls[1][1]).toEqual(tailArgs(42))
    stop()
    errSpy.mockRestore()
  })

  it('resumes from floor-1 and refreshes when the checkpoint was pruned', async () => {
    const onChange = vi.fn()
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stop = createEventFeed(onChange, { restartDelayMs: 10 })
    const err = Object.assign(new Error('exit 1'), {
      stderr: JSON.stringify({
        code: 'events_journal_truncated',
        since: 0,
        floor: 500,
        head: 900,
      }),
    })
    subs[0].exit(err)
    await vi.advanceTimersByTimeAsync(10)
    expect(vi.mocked(execa).mock.calls[1][1]).toEqual(tailArgs(499))
    await vi.advanceTimersByTimeAsync(300)
    expect(onChange).toHaveBeenCalledTimes(1)
    stop()
    errSpy.mockRestore()
  })

  it('detects a truncation error printed on stdout', async () => {
    const stop = createEventFeed(vi.fn(), { restartDelayMs: 10 })
    subs[0].push(
      JSON.stringify({ code: 'events_journal_truncated', floor: 7, head: 9 }),
    )
    await vi.advanceTimersByTimeAsync(0)
    subs[0].exit(new Error('exit 1'))
    await vi.advanceTimersByTimeAsync(10)
    expect(vi.mocked(execa).mock.calls[1][1]).toEqual(tailArgs(6))
    stop()
  })

  it('cleanup kills the tail and stops restarting', async () => {
    const onChange = vi.fn()
    const stop = createEventFeed(onChange, { restartDelayMs: 10 })
    subs[0].push(record(1))
    await vi.advanceTimersByTimeAsync(0)
    stop()
    expect(subs[0].kill).toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1000)
    expect(execa).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('logs and keeps running when the tail exits with an error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stop = createEventFeed(vi.fn(), { restartDelayMs: 10 })
    subs[0].exit(new Error('bd crashed'))
    await vi.advanceTimersByTimeAsync(10)
    expect(errSpy).toHaveBeenCalled()
    expect(execa).toHaveBeenCalledTimes(2)
    stop()
    errSpy.mockRestore()
  })
})
