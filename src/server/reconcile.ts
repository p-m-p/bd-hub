// Periodically rebuilds the board while browsers are connected. The events
// journal only records mutations made in this clone, so changes that arrive
// via `bd dolt pull`, merges or `bd sql` would otherwise never reach the
// dashboard. broadcast() drops unchanged states, so idle ticks send nothing.

const RECONCILE_MS = 30_000

export function createReconciler(
  refresh: () => Promise<void>,
  hasClients: () => boolean,
  intervalMs = RECONCILE_MS,
): () => void {
  let inFlight = false

  const timer = setInterval(async () => {
    if (inFlight || !hasClients()) return
    inFlight = true
    try {
      await refresh()
    } catch (err) {
      console.error('Periodic board refresh failed:', err)
    } finally {
      inFlight = false
    }
  }, intervalMs)

  return () => clearInterval(timer)
}
