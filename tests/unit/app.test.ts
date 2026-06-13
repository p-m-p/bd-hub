import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies before importing app
vi.mock('../../src/server/query.js', () => ({
  getBoardState: vi.fn(),
  getBeadDetail: vi.fn(),
  getProjectInfo: vi.fn(),
}))

vi.mock('../../src/server/sse.js', () => ({
  addClient: vi.fn(),
}))

// serveStatic will 404 in test environment (no dist/public/) — that's expected
vi.mock('@hono/node-server/serve-static', () => ({
  serveStatic: () => async () => new Response('Not Found', { status: 404 }),
}))

import {
  getBeadDetail,
  getBoardState,
  getProjectInfo,
} from '../../src/server/query.js'
import { addClient } from '../../src/server/sse.js'
import type { BoardState } from '../../src/server/types.js'

const mockGetBoardState = vi.mocked(getBoardState)
const mockGetBeadDetail = vi.mocked(getBeadDetail)
const mockGetProjectInfo = vi.mocked(getProjectInfo)
const mockAddClient = vi.mocked(addClient)

const sampleBoardState: BoardState = {
  epics: [
    {
      id: 'e1',
      title: 'Epic One',
      status: 'open',
      priority: 1,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ],
  tasks: {
    open: [],
    ready: [
      {
        id: 't1',
        title: 'Task One',
        status: 'open',
        priority: 2,
        subtaskTotal: 0,
        subtaskDone: 0,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    inProgress: [],
    done: [],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/board', () => {
  it('returns 200 with JSON body matching BoardState', async () => {
    mockGetBoardState.mockResolvedValueOnce(sampleBoardState)

    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/api/board')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/application\/json/)

    const body = await res.json()
    expect(body).toEqual(sampleBoardState)
  })

  it('calls getBoardState() once per request', async () => {
    mockGetBoardState.mockResolvedValueOnce(sampleBoardState)

    const { app } = await import('../../src/server/app.js')
    await app.request('/api/board')

    expect(mockGetBoardState).toHaveBeenCalledTimes(1)
  })

  it('returns 500 when getBoardState throws', async () => {
    mockGetBoardState.mockRejectedValueOnce(new Error('bd not found'))

    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/api/board')

    expect(res.status).toBe(500)
  })
})

describe('GET /events', () => {
  it('returns text/event-stream content-type', async () => {
    mockAddClient.mockImplementation(() => undefined)

    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/events')

    expect(res.headers.get('content-type')).toMatch(/text\/event-stream/)
  })

  it('calls addClient with a writer function and AbortSignal', async () => {
    mockAddClient.mockImplementation(() => undefined)

    const { app } = await import('../../src/server/app.js')
    await app.request('/events')

    expect(mockAddClient).toHaveBeenCalledTimes(1)
    const [writer, signal] = mockAddClient.mock.calls[0]
    expect(typeof writer).toBe('function')
    expect(signal).toBeInstanceOf(AbortSignal)
  })

  it('returns Cache-Control: no-cache header', async () => {
    mockAddClient.mockImplementation(() => undefined)

    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/events')

    expect(res.headers.get('cache-control')).toBe('no-cache')
  })
})

describe('GET /api/bead/:id', () => {
  it('returns 200 with the bead object when found', async () => {
    const bead = { id: 'bd-1', title: 'My Bead', description: 'Hello' }
    mockGetBeadDetail.mockResolvedValueOnce(bead)

    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/api/bead/bd-1')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(bead)
  })

  it('returns 404 with error body when bead is not found', async () => {
    mockGetBeadDetail.mockResolvedValueOnce(null)

    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/api/bead/bd-missing')

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'not found' })
  })

  it('calls getBeadDetail with the id from the URL', async () => {
    mockGetBeadDetail.mockResolvedValueOnce({ id: 'bd-42' })

    const { app } = await import('../../src/server/app.js')
    await app.request('/api/bead/bd-42')

    expect(mockGetBeadDetail).toHaveBeenCalledWith('bd-42')
  })
})

describe('GET /api/info', () => {
  it('returns 200 with project name', async () => {
    mockGetProjectInfo.mockResolvedValueOnce({ name: 'Test Project' })
    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/api/info')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ name: 'Test Project' })
  })
})

describe('GET /api/prism-theme', () => {
  it('returns 200 with JSON containing dark and light keys', async () => {
    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/api/prism-theme')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
    const body = await res.json()
    expect(body).toHaveProperty('dark')
    expect(body).toHaveProperty('light')
  })

  it('returns null for both schemes when no custom theme is configured', async () => {
    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/api/prism-theme')

    const body = await res.json()
    expect(body.dark).toBeNull()
    expect(body.light).toBeNull()
  })

  it('is not cached', async () => {
    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/api/prism-theme')
    expect(res.headers.get('cache-control')).toBe('no-cache')
  })
})

describe('GET /theme.css', () => {
  it('returns 200 with a text/css stylesheet', async () => {
    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/theme.css')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/css/)
    const body = await res.text()
    expect(body).toContain(':root {')
  })

  it('is not cached so config edits apply on refresh', async () => {
    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/theme.css')

    expect(res.headers.get('cache-control')).toBe('no-cache')
  })
})

describe('GET /nonexistent', () => {
  it('returns 404 for unknown routes', async () => {
    const { app } = await import('../../src/server/app.js')
    const res = await app.request('/nonexistent')

    expect(res.status).toBe(404)
  })
})
