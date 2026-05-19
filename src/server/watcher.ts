import chokidar from 'chokidar'

const DEBOUNCE_MS = 300

export function createWatcher(
  beadsDir: string,
  onChange: () => void,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined

  const watcher = chokidar.watch(beadsDir, { ignoreInitial: true })

  watcher.on('all', () => {
    if (timer !== undefined) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      onChange()
    }, DEBOUNCE_MS)
  })

  return () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    watcher.close()
  }
}
