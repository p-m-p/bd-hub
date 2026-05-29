import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock execa before importing query module
vi.mock('execa', () => ({
  execa: vi.fn(),
}))

import { execa } from 'execa'
import {
  getBeadDetail,
  getBoardState,
  getProjectInfo,
  ORPHAN_EPIC_ID,
} from '../../src/server/query.js'
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
  created_at: '2026-01-01T00:00:00Z',
}

const sampleOpenTask = {
  id: 'bd-task-1',
  title: 'Task One',
  status: 'open',
  issue_type: 'task',
  priority: 2,
  assignee: 'alice',
  parent: 'bd-epic-1',
  created_at: '2026-01-02T00:00:00Z',
}

const sampleBlockedTask = {
  id: 'bd-task-2',
  title: 'Task Two',
  status: 'blocked',
  issue_type: 'task',
  priority: 3,
  assignee: null,
  parent: null,
  created_at: '2026-01-03T00:00:00Z',
}

const sampleInProgressTask = {
  id: 'bd-task-3',
  title: 'Task Three',
  status: 'in_progress',
  issue_type: 'task',
  priority: 1,
  assignee: 'bob',
  parent: 'bd-epic-1',
  created_at: '2026-01-04T00:00:00Z',
}

const sampleClosedTask = {
  id: 'bd-task-4',
  title: 'Task Four',
  status: 'closed',
  issue_type: 'task',
  priority: 2,
  assignee: null,
  parent: null,
  created_at: '2026-01-05T00:00:00Z',
}

const sampleSubtaskDone = {
  id: 'bd-sub-1',
  title: 'Subtask One',
  status: 'closed',
  issue_type: 'subtask',
  priority: 2,
  assignee: null,
  parent: 'bd-task-1',
  created_at: '2026-01-06T00:00:00Z',
}

const sampleSubtaskOpen = {
  id: 'bd-sub-2',
  title: 'Subtask Two',
  status: 'open',
  issue_type: 'subtask',
  priority: 2,
  assignee: null,
  parent: 'bd-task-1',
  created_at: '2026-01-07T00:00:00Z',
}

const sampleOrphanTask = {
  id: 'bd-task-orphan',
  title: 'Orphan Task',
  status: 'open',
  issue_type: 'task',
  priority: 2,
  assignee: null,
  parent: null, // <-- no parent
  created_at: '2026-01-08T00:00:00Z',
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

  it('maps created_at to createdAt on epics', async () => {
    setupMocks([sampleEpic, sampleOpenTask], [sampleOpenTask])

    const state = await getBoardState()

    expect(state.epics[0].createdAt).toBe('2026-01-01T00:00:00Z')
  })

  it('sorts epics by createdAt ascending', async () => {
    const epicA = {
      ...sampleEpic,
      id: 'epic-a',
      created_at: '2026-03-01T00:00:00Z',
    }
    const epicB = {
      ...sampleEpic,
      id: 'epic-b',
      created_at: '2026-01-01T00:00:00Z',
    }
    const epicC = {
      ...sampleEpic,
      id: 'epic-c',
      created_at: '2026-02-01T00:00:00Z',
    }
    setupMocks([epicA, epicB, epicC], [])

    const state = await getBoardState()

    expect(state.epics.map((e) => e.id)).toEqual(['epic-b', 'epic-c', 'epic-a'])
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

describe('orphan epic in getBoardState()', () => {
  it('appends a virtual __orphan__ epic when tasks have no epicId', async () => {
    setupMocks([sampleOrphanTask], [sampleOrphanTask])
    const state = await getBoardState()
    const orphan = state.epics.find((e) => e.id === '__orphan__')
    expect(orphan).toBeDefined()
    expect(orphan?.title).toBe('Everything else')
  })

  it('always places the orphan epic last, after all real epics', async () => {
    const earlyEpic = {
      ...sampleEpic,
      id: 'early-epic',
      created_at: '2020-01-01T00:00:00Z',
    }
    setupMocks([earlyEpic, sampleOrphanTask], [sampleOrphanTask])

    const state = await getBoardState()

    const ids = state.epics.map((e) => e.id)
    expect(ids[ids.length - 1]).toBe(ORPHAN_EPIC_ID)
    expect(ids[0]).toBe('early-epic')
  })

  it('does NOT append the orphan epic when all tasks have an epic parent', async () => {
    setupMocks([sampleEpic, sampleOpenTask], [sampleOpenTask])
    const state = await getBoardState()
    const orphan = state.epics.find((e) => e.id === '__orphan__')
    expect(orphan).toBeUndefined()
  })

  it('does NOT append the orphan epic when there are no tasks at all', async () => {
    setupMocks([sampleEpic], [])
    const state = await getBoardState()
    const orphan = state.epics.find((e) => e.id === '__orphan__')
    expect(orphan).toBeUndefined()
  })

  it('exports ORPHAN_EPIC_ID as "__orphan__"', () => {
    expect(ORPHAN_EPIC_ID).toBe('__orphan__')
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

describe('getProjectInfo()', () => {
  it('parses issue_prefix from bd config list and title-cases it', async () => {
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: '  issue_prefix = my-cool-project\n',
      stderr: '',
    } as ReturnType<typeof execa>)
    const info = await getProjectInfo()
    expect(info.name).toBe('My Cool Project')
  })

  it('handles hyphen and underscore separators', async () => {
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: 'issue_prefix = hello_world\n',
      stderr: '',
    } as ReturnType<typeof execa>)
    const info = await getProjectInfo()
    expect(info.name).toBe('Hello World')
  })

  it('falls back to a non-empty string when bd throws', async () => {
    vi.mocked(execa).mockRejectedValueOnce(new Error('bd not found'))
    const info = await getProjectInfo()
    expect(typeof info.name).toBe('string')
    expect(info.name.length).toBeGreaterThan(0)
  })
})
