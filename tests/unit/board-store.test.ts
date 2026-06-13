// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import {
  applyStateUpdate,
  createReconnectHandlers,
} from '../../src/client/store/board-store.js'
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
    expect(emptyBoardState).toHaveProperty('ui')
    expect(emptyBoardState.ui).toHaveProperty('collapsed')
    expect(emptyBoardState.ui).toHaveProperty('epicAge')
  })

  it('has empty arrays and ui defaults', () => {
    expect(emptyBoardState.epics).toEqual([])
    expect(emptyBoardState.tasks.open).toEqual([])
    expect(emptyBoardState.tasks.ready).toEqual([])
    expect(emptyBoardState.tasks.inProgress).toEqual([])
    expect(emptyBoardState.tasks.done).toEqual([])
    expect(emptyBoardState.ui.collapsed).toEqual(new Set())
    expect(emptyBoardState.ui.epicAge).toBe('1m')
  })
})

describe('BoardState type', () => {
  it('can construct a valid BoardState value', () => {
    const epic: Epic = {
      id: 'ep-1',
      title: 'My Epic',
      status: 'open',
      priority: 1,
      createdAt: '2026-01-01T00:00:00Z',
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
      createdAt: '2026-01-01T00:00:00Z',
    }

    const state: BoardState = {
      projectName: 'test-project',
      epics: [epic],
      tasks: {
        open: [],
        ready: [task],
        inProgress: [],
        done: [],
      },
      ui: {
        collapsed: new Set(),
        epicAge: '1m',
        toggleEpic: () => {},
        setEpicAge: () => {},
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
      createdAt: '',
    }

    expect(task.assignee).toBeUndefined()
    expect(task.epicId).toBeUndefined()
  })
})

describe('applyStateUpdate()', () => {
  const newState: BoardState = {
    projectName: '',
    epics: [
      {
        id: 'e1',
        title: 'Epic',
        status: 'open',
        priority: 1,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    tasks: { open: [], ready: [], inProgress: [], done: [] },
    ui: {
      collapsed: new Set(),
      epicAge: '1m',
      toggleEpic: () => {},
      setEpicAge: () => {},
    },
  }

  it('calls setter directly when startViewTransition is unavailable', () => {
    const setter = vi.fn()
    const originalVT = (document as unknown as Record<string, unknown>).startViewTransition
    delete (document as unknown as Record<string, unknown>).startViewTransition

    applyStateUpdate(newState, setter)

    expect(setter).toHaveBeenCalledOnce()
    expect(setter).toHaveBeenCalledWith(newState)

    if (originalVT !== undefined) {
      ;(document as unknown as Record<string, unknown>).startViewTransition = originalVT
    }
  })

  it('calls startViewTransition when available', () => {
    const setter = vi.fn()
    const mockTransition = vi.fn((cb: () => void) => {
      cb()
      return {}
    })
    ;(document as unknown as Record<string, unknown>).startViewTransition = mockTransition

    applyStateUpdate(newState, setter)

    expect(mockTransition).toHaveBeenCalledOnce()
    expect(setter).toHaveBeenCalledWith(newState)

    delete (document as unknown as Record<string, unknown>).startViewTransition
  })

  it('setter receives the exact state object passed in', () => {
    const setter = vi.fn()
    delete (document as unknown as Record<string, unknown>).startViewTransition

    applyStateUpdate(newState, setter)

    expect(setter.mock.calls[0][0]).toBe(newState)
  })
})

describe('createReconnectHandlers()', () => {
  it('does not call onReconnect when open fires without prior error', () => {
    const onReconnect = vi.fn()
    const { onOpen } = createReconnectHandlers(onReconnect)

    onOpen()

    expect(onReconnect).not.toHaveBeenCalled()
  })

  it('calls onReconnect when open fires after an error', () => {
    const onReconnect = vi.fn()
    const { onError, onOpen } = createReconnectHandlers(onReconnect)

    onError()
    onOpen()

    expect(onReconnect).toHaveBeenCalledOnce()
  })

  it('only calls onReconnect once per error-open cycle', () => {
    const onReconnect = vi.fn()
    const { onError, onOpen } = createReconnectHandlers(onReconnect)

    onError()
    onOpen()
    onOpen() // second open without a new error should be a no-op

    expect(onReconnect).toHaveBeenCalledOnce()
  })

  it('calls onReconnect again after a second error-open cycle', () => {
    const onReconnect = vi.fn()
    const { onError, onOpen } = createReconnectHandlers(onReconnect)

    onError()
    onOpen() // first reconnect
    onError()
    onOpen() // second reconnect

    expect(onReconnect).toHaveBeenCalledTimes(2)
  })

  it('multiple errors before open still result in one reconnect call', () => {
    const onReconnect = vi.fn()
    const { onError, onOpen } = createReconnectHandlers(onReconnect)

    onError()
    onError()
    onOpen()

    expect(onReconnect).toHaveBeenCalledOnce()
  })
})

describe('boardState setter identity guard', () => {
  it('skips setValue when the same reference is set again', () => {
    // Simulates the guard: `if (value === this.provider.value) return`
    const mockSetValue = vi.fn()
    let stored: BoardState = emptyBoardState
    const provider = {
      get value() {
        return stored
      },
      setValue(v: BoardState) {
        stored = v
        mockSetValue(v)
      },
    }

    function applyGuardedSet(value: BoardState) {
      if (value === provider.value) return
      provider.setValue(value)
    }

    // Setting the same reference must not call setValue
    applyGuardedSet(emptyBoardState)
    expect(mockSetValue).not.toHaveBeenCalled()

    // Setting a different reference (new object) must call setValue
    const updated: BoardState = { ...emptyBoardState, projectName: 'test' }
    applyGuardedSet(updated)
    expect(mockSetValue).toHaveBeenCalledOnce()
    expect(mockSetValue).toHaveBeenCalledWith(updated)

    // Setting the same updated reference again must not re-call setValue
    applyGuardedSet(updated)
    expect(mockSetValue).toHaveBeenCalledOnce()
  })
})
