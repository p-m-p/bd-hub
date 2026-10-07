// The SSE registry and broadcast function.
// app.ts wires this into Hono routes.
// The events feed calls broadcast() when the beads journal records a change.

import type { BoardState } from './types.js'

type SseWriter = (event: string, data: string) => void

const clients = new Set<SseWriter>()
let lastSent: string | undefined

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
  // Clients already hold this state — skip no-op updates (e.g. reconcile ticks)
  if (data === lastSent) return
  lastSent = data
  for (const writer of clients) {
    writer('board-update', data)
  }
}

export function clientCount(): number {
  return clients.size
}
