import { describe, expect, it } from 'vitest'
import { epicTally, sanitiseId } from '../../src/client/epic/epic-lane.js'
import { applyStateUpdate } from '../../src/client/store/board-store.js'
import type { BoardState, Task } from '../../src/client/store/context.js'
import { emptyBoardState } from '../../src/client/store/context.js'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseTask: Task = {
  id: 'bd-task-1',
  title: 'Task One',
  status: 'open',
  priority: 2,
  epicId: 'epic-1',
  subtaskTotal: 0,
  subtaskDone: 0,
  createdAt: '2026-01-01T00:00:00Z',
}

function makeState(overrides: Partial<BoardState['tasks']> = {}): BoardState {
  return {
    ...emptyBoardState,
    tasks: { ...emptyBoardState.tasks, ...overrides },
  }
}

// ---------------------------------------------------------------------------
// sanitiseId
// ---------------------------------------------------------------------------

describe('sanitiseId()', () => {
  it('passes through lowercase alphanumeric and hyphens unchanged', () => {
    expect(sanitiseId('epic-1')).toBe('epic-1')
  })

  it('replaces underscores with hyphens', () => {
    expect(sanitiseId('__orphan__')).toBe('--orphan--')
  })

  it('replaces dots with hyphens', () => {
    expect(sanitiseId('a.b.c')).toBe('a-b-c')
  })

  it('handles typical bead ID format unchanged', () => {
    expect(sanitiseId('beads-dashboard-p3n')).toBe('beads-dashboard-p3n')
  })
})

// ---------------------------------------------------------------------------
// epicTally
// ---------------------------------------------------------------------------

describe('epicTally()', () => {
  it('returns zero counts when epic has no tasks', () => {
    expect(epicTally(emptyBoardState, 'epic-1')).toEqual({ done: 0, total: 0 })
  })

  it('counts all tasks across all columns for the epic', () => {
    const ready: Task = { ...baseTask, id: 'task-2', status: 'ready' }
    const inProgress: Task = {
      ...baseTask,
      id: 'task-3',
      status: 'in_progress',
    }
    const done: Task = { ...baseTask, id: 'task-4', status: 'closed' }
    const state = makeState({
      open: [baseTask],
      ready: [ready],
      inProgress: [inProgress],
      done: [done],
    })

    expect(epicTally(state, 'epic-1')).toEqual({ done: 1, total: 4 })
  })

  it('counts only done-column tasks toward done', () => {
    const done1: Task = { ...baseTask, id: 'done-1', status: 'closed' }
    const done2: Task = { ...baseTask, id: 'done-2', status: 'closed' }
    const state = makeState({ open: [baseTask], done: [done1, done2] })

    expect(epicTally(state, 'epic-1')).toEqual({ done: 2, total: 3 })
  })

  it('excludes tasks belonging to other epics', () => {
    const other: Task = { ...baseTask, id: 'other', epicId: 'epic-99' }
    const state = makeState({ open: [baseTask, other] })

    expect(epicTally(state, 'epic-1')).toEqual({ done: 0, total: 1 })
  })

  it('collects orphan tasks when epicId is __orphan__', () => {
    const orphan: Task = { ...baseTask, id: 'orphan-1', epicId: undefined }
    const orphanDone: Task = {
      ...baseTask,
      id: 'orphan-2',
      epicId: undefined,
      status: 'closed',
    }
    const state = makeState({ open: [orphan, baseTask], done: [orphanDone] })

    expect(epicTally(state, '__orphan__')).toEqual({ done: 1, total: 2 })
  })

  it('all done returns done === total', () => {
    const done1: Task = { ...baseTask, id: 'done-1' }
    const done2: Task = { ...baseTask, id: 'done-2' }
    const state = makeState({ done: [done1, done2] })

    const result = epicTally(state, 'epic-1')
    expect(result.done).toBe(result.total)
    expect(result.total).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// applyStateUpdate (re-export smoke tests — full coverage in board-store.test.ts)
// ---------------------------------------------------------------------------

describe('applyStateUpdate() export', () => {
  it('is a function', () => {
    expect(typeof applyStateUpdate).toBe('function')
  })
})
