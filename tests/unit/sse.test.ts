import { beforeEach, describe, expect, it, vi } from 'vitest'

// Use vi.resetModules() + dynamic import to get a fresh module state for each test
// This resets the module-level `clients` Set between tests

describe('SSE registry', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function importSse() {
    const mod = await import('../../src/server/sse.js')
    return mod
  }

  it('addClient registers a writer', async () => {
    const { addClient, clientCount } = await importSse()
    const writer = vi.fn()
    const controller = new AbortController()

    addClient(writer, controller.signal)
    expect(clientCount()).toBe(1)
  })

  it('clientCount returns 0 when no clients', async () => {
    const { clientCount } = await importSse()
    expect(clientCount()).toBe(0)
  })

  it('broadcast sends board-update event to all registered clients', async () => {
    const { addClient, broadcast } = await importSse()
    const writer = vi.fn()
    const controller = new AbortController()
    addClient(writer, controller.signal)

    const state = {
      epics: [],
      tasks: { open: [], ready: [], inProgress: [], done: [] },
    }
    broadcast(state)

    expect(writer).toHaveBeenCalledTimes(1)
    expect(writer).toHaveBeenCalledWith('board-update', JSON.stringify(state))
  })

  it('abort signal removes client from registry', async () => {
    const { addClient, clientCount } = await importSse()
    const writer = vi.fn()
    const controller = new AbortController()

    addClient(writer, controller.signal)
    expect(clientCount()).toBe(1)

    controller.abort()
    expect(clientCount()).toBe(0)
  })

  it('removed client does not receive subsequent broadcasts', async () => {
    const { addClient, broadcast } = await importSse()
    const writer = vi.fn()
    const controller = new AbortController()

    addClient(writer, controller.signal)
    controller.abort()

    const state = {
      epics: [],
      tasks: { open: [], ready: [], inProgress: [], done: [] },
    }
    broadcast(state)

    expect(writer).not.toHaveBeenCalled()
  })

  it('multiple clients all receive the same broadcast', async () => {
    const { addClient, broadcast } = await importSse()
    const writer1 = vi.fn()
    const writer2 = vi.fn()
    const writer3 = vi.fn()
    const controller1 = new AbortController()
    const controller2 = new AbortController()
    const controller3 = new AbortController()

    addClient(writer1, controller1.signal)
    addClient(writer2, controller2.signal)
    addClient(writer3, controller3.signal)

    const state = {
      epics: [],
      tasks: { open: [], ready: [], inProgress: [], done: [] },
    }
    broadcast(state)

    const expectedData = JSON.stringify(state)
    expect(writer1).toHaveBeenCalledWith('board-update', expectedData)
    expect(writer2).toHaveBeenCalledWith('board-update', expectedData)
    expect(writer3).toHaveBeenCalledWith('board-update', expectedData)
  })

  it('clientCount reflects correct count as clients are added and removed', async () => {
    const { addClient, clientCount } = await importSse()
    const controller1 = new AbortController()
    const controller2 = new AbortController()

    addClient(vi.fn(), controller1.signal)
    addClient(vi.fn(), controller2.signal)
    expect(clientCount()).toBe(2)

    controller1.abort()
    expect(clientCount()).toBe(1)

    controller2.abort()
    expect(clientCount()).toBe(0)
  })

  it('only disconnected client is removed, others still receive broadcasts', async () => {
    const { addClient, broadcast, clientCount } = await importSse()
    const writer1 = vi.fn()
    const writer2 = vi.fn()
    const controller1 = new AbortController()
    const controller2 = new AbortController()

    addClient(writer1, controller1.signal)
    addClient(writer2, controller2.signal)

    controller1.abort()
    expect(clientCount()).toBe(1)

    const state = {
      epics: [],
      tasks: { open: [], ready: [], inProgress: [], done: [] },
    }
    broadcast(state)

    expect(writer1).not.toHaveBeenCalled()
    expect(writer2).toHaveBeenCalledWith('board-update', JSON.stringify(state))
  })
})
