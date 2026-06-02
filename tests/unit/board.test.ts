import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Lit modules before importing components.
// Vitest runs in Node (no DOM), so customElements.define does not exist.
// The mocks prevent runtime errors while still allowing the module to load.
vi.mock('lit', () => ({
  LitElement: class {},
  html: vi.fn(),
  css: vi.fn(),
  unsafeCSS: vi.fn((s) => s),
}))

vi.mock('lit/decorators.js', () => ({
  customElement: () => (cls) => cls,
  property: () => () => undefined,
  query: () => () => undefined,
  state: () => () => undefined,
}))

vi.mock('@lit/context', () => ({
  consume: () => () => undefined,
  createContext: (key) => key,
}))

import { isEpicVisible } from '../../src/client/board/board.js'
import {
  COLUMN_LABELS,
  filterTasksByEpic,
  ORPHAN_EPIC_ID,
  tallyText,
} from '../../src/client/board/column.js'
import type { Epic, EpicAge } from '../../src/client/store/context.js'

describe('COLUMN_LABELS', () => {
  it('has entries for all four columns', () => {
    const keys = ['open', 'ready', 'inProgress', 'done']
    for (const key of keys) {
      expect(COLUMN_LABELS[key]).toBeDefined()
    }
  })

  it('maps open to Open', () => {
    expect(COLUMN_LABELS.open).toBe('Open')
  })

  it('maps ready to Ready', () => {
    expect(COLUMN_LABELS.ready).toBe('Ready')
  })

  it('maps inProgress to In Progress', () => {
    expect(COLUMN_LABELS.inProgress).toBe('In Progress')
  })

  it('maps done to Done', () => {
    expect(COLUMN_LABELS.done).toBe('Done')
  })
})

describe('filterTasksByEpic', () => {
  const tasks = [
    {
      id: 't1',
      title: 'Task 1',
      status: 'open',
      priority: 1,
      epicId: 'ep-1',
      subtaskTotal: 0,
      subtaskDone: 0,
    },
    {
      id: 't2',
      title: 'Task 2',
      status: 'open',
      priority: 2,
      epicId: 'ep-2',
      subtaskTotal: 0,
      subtaskDone: 0,
    },
    {
      id: 't3',
      title: 'Task 3',
      status: 'open',
      priority: 3,
      subtaskTotal: 0,
      subtaskDone: 0,
    },
  ]

  it('returns all tasks when epicId is empty string', () => {
    expect(filterTasksByEpic(tasks, '')).toHaveLength(3)
  })

  it('filters tasks to only those matching the given epicId', () => {
    const result = filterTasksByEpic(tasks, 'ep-1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('t1')
  })

  it('returns empty array when no tasks match the epicId', () => {
    const result = filterTasksByEpic(tasks, 'ep-999')
    expect(result).toHaveLength(0)
  })

  it('excludes tasks with no epicId when filtering by a specific epicId', () => {
    const result = filterTasksByEpic(tasks, 'ep-2')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('t2')
  })

  it('returns tasks with no epicId when epicId is ORPHAN_EPIC_ID', () => {
    const result = filterTasksByEpic(tasks, ORPHAN_EPIC_ID)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('t3')
  })

  it('ORPHAN_EPIC_ID is "__orphan__"', () => {
    expect(ORPHAN_EPIC_ID).toBe('__orphan__')
  })
})

describe('COLUMN_LABELS exact values', () => {
  it('has exactly four entries', () => {
    expect(Object.keys(COLUMN_LABELS)).toHaveLength(4)
  })

  it('labels are Open, Ready, In Progress, Done', () => {
    expect(COLUMN_LABELS.open).toBe('Open')
    expect(COLUMN_LABELS.ready).toBe('Ready')
    expect(COLUMN_LABELS.inProgress).toBe('In Progress')
    expect(COLUMN_LABELS.done).toBe('Done')
  })
})

describe('tallyText()', () => {
  it('returns "—" for zero tasks', () => {
    expect(tallyText(0)).toBe('—')
  })

  it('returns "1 task" for a single task', () => {
    expect(tallyText(1)).toBe('1 task')
  })

  it('returns "2 tasks" for two tasks', () => {
    expect(tallyText(2)).toBe('2 tasks')
  })

  it('returns "10 tasks" for ten tasks', () => {
    expect(tallyText(10)).toBe('10 tasks')
  })
})

// ---------------------------------------------------------------------------
// isEpicVisible
// ---------------------------------------------------------------------------

const MOCK_NOW = new Date('2026-06-02T00:00:00Z')

function makeEpic(createdAt: string): Epic {
  return { id: 'e1', title: 'Epic', status: 'open', priority: 1, createdAt }
}

describe('isEpicVisible()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('always shows an epic when age is "all"', () => {
    expect(isEpicVisible(makeEpic('2020-01-01T00:00:00Z'), 'all')).toBe(true)
  })

  it('always shows the orphan epic (empty createdAt) regardless of filter', () => {
    const ages: EpicAge[] = ['1m', '3m', '6m', '12m', 'all']
    for (const age of ages) {
      expect(isEpicVisible(makeEpic(''), age)).toBe(true)
    }
  })

  it('"1m" shows an epic created on the cutoff day (2026-05-02)', () => {
    expect(isEpicVisible(makeEpic('2026-05-02T00:00:00Z'), '1m')).toBe(true)
  })

  it('"1m" hides an epic created before the cutoff', () => {
    expect(isEpicVisible(makeEpic('2026-05-01T23:59:59Z'), '1m')).toBe(false)
  })

  it('"3m" shows an epic created within 3 months', () => {
    expect(isEpicVisible(makeEpic('2026-04-01T00:00:00Z'), '3m')).toBe(true)
  })

  it('"3m" hides an epic older than 3 months', () => {
    expect(isEpicVisible(makeEpic('2026-03-01T00:00:00Z'), '3m')).toBe(false)
  })

  it('"6m" shows an epic created within 6 months', () => {
    expect(isEpicVisible(makeEpic('2026-01-15T00:00:00Z'), '6m')).toBe(true)
  })

  it('"6m" hides an epic older than 6 months', () => {
    expect(isEpicVisible(makeEpic('2025-11-01T00:00:00Z'), '6m')).toBe(false)
  })

  it('"12m" shows an epic created within 12 months', () => {
    expect(isEpicVisible(makeEpic('2025-08-01T00:00:00Z'), '12m')).toBe(true)
  })

  it('"12m" hides an epic older than 12 months', () => {
    expect(isEpicVisible(makeEpic('2025-06-01T00:00:00Z'), '12m')).toBe(false)
  })
})

describe('module smoke tests', () => {
  it('imports BdBoard without errors', async () => {
    const mod = await import('../../src/client/board/board.js')
    expect(mod.BdBoard).toBeDefined()
  })

  it('imports BdColumn without errors', async () => {
    const mod = await import('../../src/client/board/column.js')
    expect(mod.BdColumn).toBeDefined()
  })
})
