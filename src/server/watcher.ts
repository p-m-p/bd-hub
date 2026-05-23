import chokidar from 'chokidar'

const DEBOUNCE_MS = 300

export function createWatcher(
  beadsDir: string,
  onChange: () => void,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined

  const watcher = chokidar.watch(beadsDir, {
    ignoreInitial: true,
    // Dolt writes to embeddeddolt/ on every db access (reads and writes).
    // Everything else in .beads/ — issues.jsonl, last-touched, etc. — is only
    // written by bd write commands, so it's a clean change signal.
    ignored: (p: string) => p.includes('/embeddeddolt/'),
  })

  watcher.on('all', () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => { onChange() }, DEBOUNCE_MS)
  })

  return () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    watcher.close()
  }
}
