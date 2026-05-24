import { exec } from 'node:child_process'
import { serve } from '@hono/node-server'
import { execa } from 'execa'
import { app } from './app.js'
import { getBoardState } from './query.js'
import { broadcast } from './sse.js'
import { createWatcher } from './watcher.js'

async function findBeadsDir(): Promise<string> {
  try {
    const result = await execa('bd', ['where'])
    return result.stdout.split('\n')[0].trim()
  } catch {
    return process.cwd()
  }
}

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

PREREQUISITES
  bd (beads) must be installed and available in PATH.
  Run from a directory that contains a .beads/ database (i.e. bd init has been run).

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
  const beadsDir = await findBeadsDir()

  const server = serve({ fetch: app.fetch, port }, () => {
    const url = `http://localhost:${port}`
    console.log(`beads-dashboard running at ${url}`)
    if (openBrowser) {
      openBrowserUrl(url)
    }
  })

  const cleanup = createWatcher(beadsDir, async () => {
    try {
      const state = await getBoardState()
      broadcast(state)
    } catch (err) {
      console.error('Failed to broadcast update:', err)
    }
  })

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
