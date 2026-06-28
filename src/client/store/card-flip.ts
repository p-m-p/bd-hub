/**
 * FLIP animation support for task cards moving between columns.
 *
 * Cards register themselves here. Before each board state update,
 * snapshotPositions() captures their rects. When a card appears at a new
 * position it reads the snapshot and animates from the old rect to the new one.
 */

const registry = new Map<string, Element>()
let snapshot: Map<string, DOMRect> = new Map()

export function registerCard(beadId: string, el: Element): void {
  registry.set(beadId, el)
}

export function unregisterCard(beadId: string): void {
  registry.delete(beadId)
}

export function snapshotPositions(): void {
  snapshot = new Map()
  for (const [id, el] of registry) {
    snapshot.set(id, el.getBoundingClientRect())
  }
}

export function getOldPosition(beadId: string): DOMRect | null {
  return snapshot.get(beadId) ?? null
}

/** @internal Reset state for testing only */
export function _resetCardFlipState(): void {
  registry.clear()
  snapshot = new Map()
}
