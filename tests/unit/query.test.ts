import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock execa before importing query module
vi.mock('execa', () => ({
  execa: vi.fn(),
}))

import { execa } from 'execa'
import { getBeadDetail, getBoardState } from '../../src/server/query.js'
import type { BoardState } from '../../src/server/types.js'

const mockExeca = vi.mocked(execa)

// Sample bd issue data
const sampleEpic = {
  id: 'bd-epic-1',
  title: 'Epic One',
  status: 'open',
  issue_type: 'epic',
  priority: 1,
  assignee: null,
  parent: null,
}

const sampleOpenTask = {
  id: 'bd-task-1',
  title: 'Task One',
  status: 'open',
  issue_type: 'task',
  priority: 2,
  assignee: 'alice',
  parent: 'bd-epic-1',
}

const sampleBlockedTask = {
  id: 'bd-task-2',
  title: 'Task Two',
  status: 'blocked',
  issue_type: 'task',
  priority: 3,
  assignee: null,
  parent: null,
}

const sampleInProgressTask = {
  id: 'bd-task-3',
  title: 'Task Three',
  status: 'in_progress',
  issue_type: 'task',
  priority: 1,
  assignee: 'bob',
  parent: 'bd-epic-1',
}

const sampleClosedTask = {
  id: 'bd-task-4',
  title: 'Task Four',
  status: 'closed',
  issue_type: 'task',
  priority: 2,
  assignee: null,
  parent: null,
}

const sampleSubtaskDone = {
  id: 'bd-sub-1',
  title: 'Subtask One',
  status: 'closed',
  issue_type: 'subtask',
  priority: 2,
  assignee: null,
  parent: 'bd-task-1',
}

const sampleSubtaskOpen = {
  id: 'bd-sub-2',
  title: 'Subtask Two',
  status: 'open',
  issue_type: 'subtask',
  priority: 2,
  assignee: null,
  parent: 'bd-task-1',
}

// Helper to build a mock execa result
function mockResult(data: unknown) {
  return Promise.resolve({ stdout: JSON.stringify(data), stderr: '' })
}

// Helper: set up execa to return different data per call
// Call order: 1=bd list --all --json, 2=bd ready --json
function setupMocks(allIssues: unknown[], readyTasks: unknown[]) {
  mockExeca
    .mockImplementationOnce(
      () => mockResult(allIssues) as ReturnType<typeof execa>,
    )
    .mockImplementationOnce(
      () => mockResult(readyTasks) as ReturnType<typeof execa>,
    )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getBoardState()', () => {
  it('returns a BoardState with correct TypeScript shape', async () => {
    setupMocks(
      [sampleEpic, sampleOpenTask, sampleInProgressTask],
      [sampleOpenTask],
    )

    const state: BoardState = await getBoardState()

    expect(state).toHaveProperty('epics')
    expect(state).toHaveProperty('tasks')
    expect(state.tasks).toHaveProperty('open')
    expect(state.tasks).toHaveProperty('ready')
    expect(state.tasks).toHaveProperty('inProgress')
    expect(state.tasks).toHaveProperty('done')
  })

  it('filters epics correctly (issue_type === epic)', async () => {
    setupMocks(
      [sampleEpic, sampleOpenTask, sampleInProgressTask],
      [sampleOpenTask],
    )

    const state = await getBoardState()

    expect(state.epics).toHaveLength(1)
    expect(state.epics[0].id).toBe('bd-epic-1')
    expect(state.epics[0].title).toBe('Epic One')
  })

  it('puts ready tasks (open and in bd ready) into tasks.ready', async () => {
    setupMocks(
      [sampleEpic, sampleOpenTask, sampleBlockedTask],
      [sampleOpenTask], // only sampleOpenTask is truly ready
    )

    const state = await getBoardState()

    expect(state.tasks.ready).toHaveLength(1)
    expect(state.tasks.ready[0].id).toBe('bd-task-1')
  })

  it('puts blocked tasks (status=blocked) into tasks.open', async () => {
    setupMocks(
      [sampleEpic, sampleOpenTask, sampleBlockedTask],
      [sampleOpenTask], // sampleBlockedTask is not in ready list
    )

    const state = await getBoardState()

    // blocked status tasks should go to open (blocked)
    expect(state.tasks.open).toHaveLength(1)
    expect(state.tasks.open[0].id).toBe('bd-task-2')
  })

  it('puts in_progress tasks into tasks.inProgress', async () => {
    setupMocks([sampleEpic, sampleInProgressTask], [])

    const state = await getBoardState()

    expect(state.tasks.inProgress).toHaveLength(1)
    expect(state.tasks.inProgress[0].id).toBe('bd-task-3')
  })

  it('puts closed tasks into tasks.done', async () => {
    setupMocks([sampleEpic, sampleClosedTask], [])

    const state = await getBoardState()

    expect(state.tasks.done).toHaveLength(1)
    expect(state.tasks.done[0].id).toBe('bd-task-4')
  })

  it('maps parent epic id onto task.epicId', async () => {
    setupMocks([sampleEpic, sampleInProgressTask], [])

    const state = await getBoardState()

    expect(state.tasks.inProgress[0].epicId).toBe('bd-epic-1')
  })

  it('maps assignee onto task (null becomes undefined)', async () => {
    setupMocks([sampleClosedTask], [])

    const state = await getBoardState()

    expect(state.tasks.done[0].assignee).toBeUndefined()
  })

  it('correctly maps a task with an assignee', async () => {
    setupMocks([sampleEpic, sampleOpenTask], [sampleOpenTask])

    const state = await getBoardState()

    expect(state.tasks.ready[0].assignee).toBe('alice')
  })

  it('counts subtasks per parent task', async () => {
    setupMocks(
      [sampleEpic, sampleOpenTask, sampleSubtaskDone, sampleSubtaskOpen],
      [sampleOpenTask],
    )

    const state = await getBoardState()

    const task = state.tasks.ready[0]
    expect(task.subtaskTotal).toBe(2)
    expect(task.subtaskDone).toBe(1)
  })

  it('defaults subtaskTotal and subtaskDone to 0 when no subtasks', async () => {
    setupMocks([sampleEpic, sampleInProgressTask], [])

    const state = await getBoardState()

    expect(state.tasks.inProgress[0].subtaskTotal).toBe(0)
    expect(state.tasks.inProgress[0].subtaskDone).toBe(0)
  })

  it('throws a descriptive error when bd is not in PATH (ENOENT)', async () => {
    const enoentError = Object.assign(new Error('spawn bd ENOENT'), {
      code: 'ENOENT',
    })
    mockExeca.mockRejectedValueOnce(enoentError)

    await expect(getBoardState()).rejects.toThrow(/bd not found in PATH/)
  })

  it('wraps unexpected execa errors with context', async () => {
    const genericError = new Error('exited with code 1')
    mockExeca.mockRejectedValueOnce(genericError)

    await expect(getBoardState()).rejects.toThrow(/Failed to query bd/)
  })

  it('calls execa with correct bd list --json arguments', async () => {
    setupMocks([sampleEpic], [])

    await getBoardState()

    expect(mockExeca).toHaveBeenCalledWith('bd', ['list', '--all', '--json'])
    expect(mockExeca).toHaveBeenCalledWith('bd', ['ready', '--json'])
  })
})

describe('getBeadDetail()', () => {
  it('returns the first issue as a generic object on success', async () => {
    mockExeca.mockImplementationOnce(
      () =>
        mockResult([
          { id: 'bd-1', title: 'My bead', description: 'Some desc' },
        ]) as ReturnType<typeof execa>,
    )
    const result = await getBeadDetail('bd-1')
    expect(result).toEqual({
      id: 'bd-1',
      title: 'My bead',
      description: 'Some desc',
    })
  })

  it('returns null when the result array is empty', async () => {
    mockExeca.mockImplementationOnce(
      () => mockResult([]) as ReturnType<typeof execa>,
    )
    const result = await getBeadDetail('bd-missing')
    expect(result).toBeNull()
  })

  it('returns null when bd throws (e.g. id not found)', async () => {
    mockExeca.mockRejectedValueOnce(new Error('exit code 1'))
    const result = await getBeadDetail('bd-missing')
    expect(result).toBeNull()
  })

  it('calls bd show <id> --json with the correct arguments', async () => {
    mockExeca.mockImplementationOnce(
      () => mockResult([{ id: 'bd-1' }]) as ReturnType<typeof execa>,
    )
    await getBeadDetail('bd-1')
    expect(mockExeca).toHaveBeenCalledWith('bd', ['show', 'bd-1', '--json'])
  })
})
