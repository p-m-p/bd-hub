import { describe, expect, it } from 'vitest'
import { sanitiseId } from '../../src/client/epic/epic-lane.js'
import {
  applyStateUpdate,
  diffUpdates,
  epicTaskSnapshot,
} from '../../src/client/store/board-store.js'
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
}

function makeState(
  overrides: Partial<BoardState['tasks']> = {},
  ui: Partial<BoardState['ui']> = {},
): BoardState {
  return {
    ...emptyBoardState,
    tasks: { ...emptyBoardState.tasks, ...overrides },
    ui: { ...emptyBoardState.ui, ...ui },
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
// epicTaskSnapshot
// ---------------------------------------------------------------------------

describe('epicTaskSnapshot()', () => {
  it('returns JSON of sorted {id, status} pairs for the epic', () => {
    const t2: Task = { ...baseTask, id: 'bd-task-2', status: 'in_progress' }
    const state = makeState({ ready: [baseTask], inProgress: [t2] })

    const snap = epicTaskSnapshot(state, 'epic-1')
    expect(JSON.parse(snap)).toEqual([
      { id: 'bd-task-1', status: 'open' },
      { id: 'bd-task-2', status: 'in_progress' },
    ])
  })

  it('sorts tasks by id regardless of column order', () => {
    const tZ: Task = { ...baseTask, id: 'zzz', status: 'open' }
    const tA: Task = { ...baseTask, id: 'aaa', status: 'closed' }
    const state = makeState({ ready: [tZ], done: [tA] })

    const snap = JSON.parse(epicTaskSnapshot(state, 'epic-1'))
    expect(snap[0].id).toBe('aaa')
    expect(snap[1].id).toBe('zzz')
  })

  it('returns empty array JSON for an epic with no tasks', () => {
    expect(epicTaskSnapshot(emptyBoardState, 'epic-1')).toBe('[]')
  })

  it('collects orphan tasks when epicId is __orphan__', () => {
    const orphan: Task = { ...baseTask, id: 'orphan-1', epicId: undefined }
    const state = makeState({ open: [orphan] })

    const snap = JSON.parse(epicTaskSnapshot(state, '__orphan__'))
    expect(snap).toHaveLength(1)
    expect(snap[0].id).toBe('orphan-1')
  })

  it('excludes tasks belonging to other epics', () => {
    const other: Task = { ...baseTask, id: 'other-task', epicId: 'epic-99' }
    const state = makeState({ open: [baseTask, other] })

    const snap = JSON.parse(epicTaskSnapshot(state, 'epic-1'))
    expect(snap).toHaveLength(1)
    expect(snap[0].id).toBe('bd-task-1')
  })
})

// ---------------------------------------------------------------------------
// diffUpdates
// ---------------------------------------------------------------------------

describe('diffUpdates()', () => {
  it('increments update count for a collapsed epic when tasks change', () => {
    const oldState = makeState({ ready: [baseTask] })
    const movedTask: Task = { ...baseTask, status: 'in_progress' }
    const newState = makeState({ inProgress: [movedTask] })
    const ui = { collapsed: new Set(['epic-1']), updates: {} }

    const result = diffUpdates(oldState, newState, ui)

    expect(result.updates['epic-1']).toBe(1)
  })

  it('does not increment for an expanded epic', () => {
    const oldState = makeState({ ready: [baseTask] })
    const movedTask: Task = { ...baseTask, status: 'in_progress' }
    const newState = makeState({ inProgress: [movedTask] })
    const ui = { collapsed: new Set<string>(), updates: {} }

    const result = diffUpdates(oldState, newState, ui)

    expect(result.updates['epic-1']).toBeUndefined()
  })

  it('accumulates multiple updates', () => {
    const task1: Task = { ...baseTask, id: 'task-1' }
    const task1Moved: Task = { ...task1, status: 'in_progress' }
    const oldState = makeState({ ready: [task1] })
    const newState = makeState({ inProgress: [task1Moved] })
    const ui = { collapsed: new Set(['epic-1']), updates: { 'epic-1': 2 } }

    const result = diffUpdates(oldState, newState, ui)

    expect(result.updates['epic-1']).toBe(3)
  })

  it('does not mutate the original ui object', () => {
    const oldState = makeState({ ready: [baseTask] })
    const newState = makeState({
      inProgress: [{ ...baseTask, status: 'in_progress' }],
    })
    const ui = { collapsed: new Set(['epic-1']), updates: {} }

    diffUpdates(oldState, newState, ui)

    expect(ui.updates).toEqual({})
  })

  it('returns the same ui reference when no collapsed epics', () => {
    const ui = { collapsed: new Set<string>(), updates: {} }
    const result = diffUpdates(emptyBoardState, emptyBoardState, ui)
    expect(result).toBe(ui)
  })

  it('does not increment when tasks are unchanged for a collapsed epic', () => {
    const state = makeState({ ready: [baseTask] })
    const ui = { collapsed: new Set(['epic-1']), updates: {} }

    const result = diffUpdates(state, state, ui)

    expect(result.updates['epic-1']).toBeUndefined()
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
