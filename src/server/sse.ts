// The SSE registry and broadcast function.
// app.ts wires this into Hono routes.
// The watcher calls broadcast() when .beads/ changes.

import type { BoardState } from './types.js'

type SseWriter = (event: string, data: string) => void

const clients = new Set<SseWriter>()

export function addClient(writer: SseWriter, signal: AbortSignal): void {
  clients.add(writer)
  signal.addEventListener(
    'abort',
    () => {
      clients.delete(writer)
    },
    { once: true },
  )
}

export function broadcast(state: BoardState): void {
  const data = JSON.stringify(state)
  for (const writer of clients) {
    writer('board-update', data)
  }
}

export function clientCount(): number {
  return clients.size
}
