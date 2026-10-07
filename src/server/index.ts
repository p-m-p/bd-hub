import { exec } from 'node:child_process'
import { serve } from '@hono/node-server'
import { app } from './app.js'
import { assertEventsJournal, createEventFeed } from './events.js'
import { getBoardState } from './query.js'
import { createReconciler } from './reconcile.js'
import { broadcast, clientCount } from './sse.js'

export function parseArgs(argv = process.argv.slice(2)): {
  openBrowser: boolean
  port: number
  help: boolean
} {
  if (argv.includes('--help') || argv.includes('-h')) {
    return { openBrowser: false, port: 3003, help: true }
  }
  const openBrowser = argv.includes('--open')
  const portIdx = argv.indexOf('--port')
  const port = portIdx !== -1 ? parseInt(argv[portIdx + 1], 10) : 3003
  return { openBrowser, port: Number.isNaN(port) ? 3003 : port, help: false }
}

function printHelp(): void {
  console.log(
    `
bd-hub — kanban dashboard for bd (beads) issue tracker

USAGE
  npx bd-hub [options]

OPTIONS
  --port <n>   Port to listen on (default: 3003)
  --open       Open the dashboard in your default browser on startup
  --help, -h   Show this help message

THEMING
  Create an optional bd-hub.config.json in the directory you start bd-hub
  from to customise fonts, colors, spacing density and light/dark mode.
  See https://github.com/p-m-p/bd-hub#theming for the config format.

PREREQUISITES
  bd (beads) >= 1.3.0 must be installed and available in PATH.
  Run from a directory that contains a .beads/ database (i.e. bd init has been run).
  The beads events journal must be enabled: bd config set events-journal true

  Install beads: https://github.com/gastownhall/beads
`.trim(),
  )
}

function openBrowserUrl(url: string): void {
  const platform = process.platform
  const cmd =
    platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} "${url}"`)
}

async function main() {
  const { openBrowser, port, help } = parseArgs()
  if (help) {
    printHelp()
    process.exit(0)
  }
  try {
    await assertEventsJournal()
  } catch (err) {
    console.error((err as Error).message)
    process.exit(1)
  }

  const server = serve({ fetch: app.fetch, port }, () => {
    const url = `http://localhost:${port}`
    console.log(`beads-dashboard running at ${url}`)
    if (openBrowser) {
      openBrowserUrl(url)
    }
  })

  const refresh = async () => {
    try {
      const state = await getBoardState()
      broadcast(state)
    } catch (err) {
      console.error('Failed to broadcast update:', err)
    }
  }

  const stopFeed = createEventFeed(refresh)
  const stopReconciler = createReconciler(refresh, () => clientCount() > 0)
  const cleanup = () => {
    stopFeed()
    stopReconciler()
  }

  process.on('SIGINT', () => {
    cleanup()
    server.close()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    cleanup()
    server.close()
    process.exit(0)
  })
}

main().catch(console.error)
