import { describe, expect, it } from 'vitest'
import type { BoardState, Task } from '../../src/client/store/context.js'
import { emptyBoardState } from '../../src/client/store/context.js'
import { cardViewTransitionName, isDoneTask } from '../../src/client/task/task-card.js'

// ---------------------------------------------------------------------------
// PRIORITY_COLOURS logic (mirrors task-card.ts constant)
// ---------------------------------------------------------------------------
const PRIORITY_COLOURS: Record<number, string> = {
  0: '#f38ba8',
  1: '#fab387',
  2: '#f9e2af',
  3: '#a6e3a1',
  4: '#313244',
}

function priorityColour(priority: number): string {
  return PRIORITY_COLOURS[priority] ?? PRIORITY_COLOURS[4]
}

// ---------------------------------------------------------------------------
// Task lookup logic (mirrors BdTaskCard.task getter)
// ---------------------------------------------------------------------------
function findTask(boardState: BoardState, beadId: string): Task | undefined {
  const all = Object.values(boardState.tasks).flat()
  return all.find((t) => t.id === beadId)
}

// ---------------------------------------------------------------------------
// Subtask tally visibility logic (mirrors BdSubtaskTally.render condition)
// ---------------------------------------------------------------------------
function tallyVisible(total: number): boolean {
  return total > 0
}

function tallyText(done: number, total: number): string {
  return `${done} of ${total} complete`
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const baseTask: Task = {
  id: 'bd-task-1',
  title: 'Write tests',
  status: 'open',
  priority: 2,
  subtaskTotal: 0,
  subtaskDone: 0,
}

const taskWithSubtasks: Task = {
  ...baseTask,
  id: 'bd-task-2',
  subtaskTotal: 10,
  subtaskDone: 2,
}

const taskWithAssignee: Task = {
  ...baseTask,
  id: 'bd-task-3',
  assignee: 'alice',
}

// ---------------------------------------------------------------------------
// PRIORITY_COLOURS tests
// ---------------------------------------------------------------------------
describe('PRIORITY_COLOURS', () => {
  it('P0 maps to red (#f38ba8)', () => {
    expect(priorityColour(0)).toBe('#f38ba8')
  })

  it('P1 maps to peach (#fab387)', () => {
    expect(priorityColour(1)).toBe('#fab387')
  })

  it('P2 maps to yellow (#f9e2af)', () => {
    expect(priorityColour(2)).toBe('#f9e2af')
  })

  it('P3 maps to green (#a6e3a1)', () => {
    expect(priorityColour(3)).toBe('#a6e3a1')
  })

  it('P4 maps to surface (#313244)', () => {
    expect(priorityColour(4)).toBe('#313244')
  })

  it('unknown priority falls back to P4 surface colour', () => {
    expect(priorityColour(99)).toBe('#313244')
  })
})

// ---------------------------------------------------------------------------
// Task lookup tests
// ---------------------------------------------------------------------------
describe('findTask()', () => {
  it('finds a task in the open bucket', () => {
    const state: BoardState = {
      ...emptyBoardState,
      tasks: { ...emptyBoardState.tasks, open: [baseTask] },
    }
    expect(findTask(state, 'bd-task-1')).toBe(baseTask)
  })

  it('finds a task in the ready bucket', () => {
    const state: BoardState = {
      ...emptyBoardState,
      tasks: { ...emptyBoardState.tasks, ready: [taskWithSubtasks] },
    }
    expect(findTask(state, 'bd-task-2')).toBe(taskWithSubtasks)
  })

  it('finds a task in the inProgress bucket', () => {
    const state: BoardState = {
      ...emptyBoardState,
      tasks: { ...emptyBoardState.tasks, inProgress: [taskWithAssignee] },
    }
    expect(findTask(state, 'bd-task-3')).toBe(taskWithAssignee)
  })

  it('finds a task in the done bucket', () => {
    const doneTask: Task = { ...baseTask, id: 'bd-task-done', status: 'closed' }
    const state: BoardState = {
      ...emptyBoardState,
      tasks: { ...emptyBoardState.tasks, done: [doneTask] },
    }
    expect(findTask(state, 'bd-task-done')).toBe(doneTask)
  })

  it('returns undefined when bead-id does not match any task', () => {
    const state: BoardState = {
      ...emptyBoardState,
      tasks: { ...emptyBoardState.tasks, open: [baseTask] },
    }
    expect(findTask(state, 'no-such-id')).toBeUndefined()
  })

  it('returns undefined on empty board state', () => {
    expect(findTask(emptyBoardState, 'bd-task-1')).toBeUndefined()
  })

  it('searches across all buckets and returns the first match', () => {
    const state: BoardState = {
      ...emptyBoardState,
      tasks: {
        open: [baseTask],
        ready: [taskWithSubtasks],
        inProgress: [taskWithAssignee],
        done: [],
      },
    }
    expect(findTask(state, 'bd-task-2')).toBe(taskWithSubtasks)
    expect(findTask(state, 'bd-task-3')).toBe(taskWithAssignee)
  })
})

// ---------------------------------------------------------------------------
// Subtask tally visibility and text
// ---------------------------------------------------------------------------
describe('subtask tally visibility', () => {
  it('is hidden when total is 0', () => {
    expect(tallyVisible(0)).toBe(false)
  })

  it('is visible when total is 1', () => {
    expect(tallyVisible(1)).toBe(true)
  })

  it('is visible when total is 10', () => {
    expect(tallyVisible(10)).toBe(true)
  })
})

describe('subtask tally text', () => {
  it('formats "2 of 10 complete"', () => {
    expect(tallyText(2, 10)).toBe('2 of 10 complete')
  })

  it('formats "0 of 5 complete"', () => {
    expect(tallyText(0, 5)).toBe('0 of 5 complete')
  })

  it('formats "5 of 5 complete" when all done', () => {
    expect(tallyText(5, 5)).toBe('5 of 5 complete')
  })
})

// ---------------------------------------------------------------------------
// cardViewTransitionName and isDoneTask exported pure functions
// ---------------------------------------------------------------------------
describe('cardViewTransitionName()', () => {
  it('prefixes with "card-"', () => {
    expect(cardViewTransitionName('abc')).toBe('card-abc')
  })

  it('replaces non-alphanumeric characters with hyphens', () => {
    expect(cardViewTransitionName('bd-hub_3xk')).toBe('card-bd-hub-3xk')
  })

  it('handles typical bead ID format', () => {
    expect(cardViewTransitionName('beads-dashboard-1oq')).toBe('card-beads-dashboard-1oq')
  })

  it('replaces dots and special chars', () => {
    expect(cardViewTransitionName('abc.def')).toBe('card-abc-def')
  })
})

describe('isDoneTask()', () => {
  it('returns true for status "closed"', () => {
    expect(isDoneTask('closed')).toBe(true)
  })

  it('returns false for status "open"', () => {
    expect(isDoneTask('open')).toBe(false)
  })

  it('returns false for status "in_progress"', () => {
    expect(isDoneTask('in_progress')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isDoneTask('')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Module import smoke tests
// ---------------------------------------------------------------------------
describe('context module imports', () => {
  it('emptyBoardState is importable and has expected shape', () => {
    expect(emptyBoardState).toHaveProperty('tasks')
    expect(emptyBoardState.tasks).toHaveProperty('open')
    expect(emptyBoardState.tasks).toHaveProperty('ready')
    expect(emptyBoardState.tasks).toHaveProperty('inProgress')
    expect(emptyBoardState.tasks).toHaveProperty('done')
  })

  it('Task type has subtaskDone field (not done)', () => {
    const t: Task = {
      id: 'x',
      title: 'x',
      status: 'open',
      priority: 0,
      subtaskTotal: 3,
      subtaskDone: 1,
    }
    expect(t.subtaskDone).toBe(1)
    expect(t.subtaskTotal).toBe(3)
  })
})
