// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { applyStateUpdate } from '../../src/client/store/board-store.js'
import {
  type BoardState,
  boardContext,
  type Epic,
  emptyBoardState,
  type Task,
} from '../../src/client/store/context.js'

describe('boardContext', () => {
  it('defines a context key', () => {
    expect(boardContext).toBeDefined()
  })

  it('has the expected string identifier', () => {
    // @lit/context: createContext returns the key value cast to Context<K, V>
    // The runtime value is the string itself
    expect(boardContext).toBe('board-state')
  })
})

describe('emptyBoardState', () => {
  it('has the correct shape', () => {
    expect(emptyBoardState).toHaveProperty('epics')
    expect(emptyBoardState).toHaveProperty('tasks')
    expect(emptyBoardState.tasks).toHaveProperty('open')
    expect(emptyBoardState.tasks).toHaveProperty('ready')
    expect(emptyBoardState.tasks).toHaveProperty('inProgress')
    expect(emptyBoardState.tasks).toHaveProperty('done')
  })

  it('has empty arrays for all collections', () => {
    expect(emptyBoardState.epics).toEqual([])
    expect(emptyBoardState.tasks.open).toEqual([])
    expect(emptyBoardState.tasks.ready).toEqual([])
    expect(emptyBoardState.tasks.inProgress).toEqual([])
    expect(emptyBoardState.tasks.done).toEqual([])
  })
})

describe('BoardState type', () => {
  it('can construct a valid BoardState value', () => {
    const epic: Epic = {
      id: 'ep-1',
      title: 'My Epic',
      status: 'open',
      priority: 1,
    }

    const task: Task = {
      id: 'task-1',
      title: 'My Task',
      status: 'open',
      priority: 2,
      assignee: 'alice',
      epicId: 'ep-1',
      subtaskTotal: 3,
      subtaskDone: 1,
    }

    const state: BoardState = {
      epics: [epic],
      tasks: {
        open: [],
        ready: [task],
        inProgress: [],
        done: [],
      },
    }

    expect(state.epics).toHaveLength(1)
    expect(state.epics[0].id).toBe('ep-1')
    expect(state.tasks.ready[0].assignee).toBe('alice')
    expect(state.tasks.ready[0].epicId).toBe('ep-1')
    expect(state.tasks.ready[0].subtaskTotal).toBe(3)
    expect(state.tasks.ready[0].subtaskDone).toBe(1)
  })

  it('allows optional fields to be omitted on Task', () => {
    const task: Task = {
      id: 'task-2',
      title: 'Minimal Task',
      status: 'open',
      priority: 1,
      subtaskTotal: 0,
      subtaskDone: 0,
    }

    expect(task.assignee).toBeUndefined()
    expect(task.epicId).toBeUndefined()
  })
})

describe('applyStateUpdate()', () => {
  const newState: BoardState = {
    epics: [{ id: 'e1', title: 'Epic', status: 'open', priority: 1 }],
    tasks: { open: [], ready: [], inProgress: [], done: [] },
  }

  it('calls setter directly when startViewTransition is unavailable', () => {
    const setter = vi.fn()
    const originalVT = (document as Record<string, unknown>).startViewTransition
    delete (document as Record<string, unknown>).startViewTransition

    applyStateUpdate(newState, setter)

    expect(setter).toHaveBeenCalledOnce()
    expect(setter).toHaveBeenCalledWith(newState)

    if (originalVT !== undefined) {
      ;(document as Record<string, unknown>).startViewTransition = originalVT
    }
  })

  it('calls startViewTransition when available', () => {
    const setter = vi.fn()
    const mockTransition = vi.fn((cb: () => void) => {
      cb()
      return {}
    })
    ;(document as Record<string, unknown>).startViewTransition = mockTransition

    applyStateUpdate(newState, setter)

    expect(mockTransition).toHaveBeenCalledOnce()
    expect(setter).toHaveBeenCalledWith(newState)

    delete (document as Record<string, unknown>).startViewTransition
  })

  it('setter receives the exact state object passed in', () => {
    const setter = vi.fn()
    delete (document as Record<string, unknown>).startViewTransition

    applyStateUpdate(newState, setter)

    expect(setter.mock.calls[0][0]).toBe(newState)
  })
})
