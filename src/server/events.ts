// Follows the beads events journal (`bd events tail --follow`, beads >= 1.3.0)
// and calls onChange, debounced, whenever a bead is mutated. Records are only
// used as a change signal — the board is still rebuilt from `bd list`/`bd ready`.

import { execa } from 'execa'

const DEBOUNCE_MS = 300
const RESTART_DELAY_MS = 1000

export const JOURNAL_DISABLED_MESSAGE =
  'bd-hub requires the beads events journal (beads >= 1.3.0). Enable it with: bd config set events-journal true'

export async function assertEventsJournal(): Promise<void> {
  const env = process.env.BD_EVENTS_JOURNAL
  if (env === '1' || env === 'true') return
  let value: unknown
  try {
    const result = await execa('bd', [
      'config',
      'get',
      'events-journal',
      '--json',
    ])
    value = (JSON.parse(result.stdout) as { value?: unknown }).value
  } catch (err) {
    throw new Error(JOURNAL_DISABLED_MESSAGE, { cause: err })
  }
  if (value !== 'true') throw new Error(JOURNAL_DISABLED_MESSAGE)
}

type Parsed = { seq: number } | { floor: number } | undefined

function parseLine(line: string): Parsed {
  try {
    const obj = JSON.parse(line) as Record<string, unknown>
    if (
      obj.code === 'events_journal_truncated' &&
      typeof obj.floor === 'number'
    )
      return { floor: obj.floor }
    if (typeof obj.seq === 'number') return { seq: obj.seq }
  } catch {
    // not a journal record
  }
  return undefined
}

function truncationFloor(err: unknown): number | undefined {
  const stderr = (err as { stderr?: unknown } | null)?.stderr
  if (typeof stderr !== 'string') return undefined
  for (const line of stderr.split('\n')) {
    const parsed = parseLine(line)
    if (parsed && 'floor' in parsed) return parsed.floor
  }
  return undefined
}

export function createEventFeed(
  onChange: () => void,
  { restartDelayMs = RESTART_DELAY_MS } = {},
): () => void {
  let since = 0
  let stopped = false
  let debounce: ReturnType<typeof setTimeout> | undefined
  let restart: ReturnType<typeof setTimeout> | undefined
  let current: ReturnType<typeof execa> | undefined

  const schedule = () => {
    if (debounce !== undefined) clearTimeout(debounce)
    debounce = setTimeout(() => {
      debounce = undefined
      onChange()
    }, DEBOUNCE_MS)
  }

  // A pruned checkpoint means we may have missed changes: resume from the
  // oldest retained record and rebuild the board from current state.
  const resumeFromFloor = (floor: number) => {
    since = floor - 1
    schedule()
  }

  const follow = async () => {
    let floor: number | undefined
    // --follow never exits on its own, so don't buffer stdout in memory.
    current = execa(
      'bd',
      ['events', 'tail', '--since', String(since), '--follow', '--json'],
      { buffer: { stdout: false, stderr: true } },
    )
    try {
      for await (const line of current) {
        const parsed = parseLine(String(line))
        if (!parsed) continue
        if ('floor' in parsed) {
          floor = parsed.floor
          continue
        }
        since = Math.max(since, parsed.seq)
        schedule()
      }
      await current
    } catch (err) {
      if (stopped) return
      floor ??= truncationFloor(err)
      if (floor === undefined) {
        console.error('bd events tail exited, restarting:', err)
      }
    }
    if (stopped) return
    if (floor !== undefined) resumeFromFloor(floor)
    restart = setTimeout(follow, restartDelayMs)
  }

  follow()

  return () => {
    stopped = true
    if (debounce !== undefined) clearTimeout(debounce)
    if (restart !== undefined) clearTimeout(restart)
    current?.kill()
  }
}
