import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { getBeadDetail, getBoardState, getProjectInfo } from './query.js'
import { addClient } from './sse.js'
import { generateThemeCss, loadThemeConfig } from './theme.js'

// Resolve the public dir relative to this file so npx (any cwd) works correctly.
// Only register static middleware when the directory exists — in dev mode Vite
// serves the frontend, so dist/public won't be present.
const __dirname = dirname(fileURLToPath(import.meta.url))
const publicRoot = resolve(__dirname, '../public')

export const app = new Hono()

app.get('/api/board', async (c) => {
  const state = await getBoardState()
  return c.json(state)
})

app.get('/api/bead/:id', async (c) => {
  const id = c.req.param('id')
  const bead = await getBeadDetail(id)
  if (!bead) return c.json({ error: 'not found' }, 404)
  return c.json(bead)
})

app.get('/api/info', async (c) => {
  const info = await getProjectInfo()
  return c.json(info)
})

// Read the config on every request so theme edits apply on browser refresh
app.get('/theme.css', (c) => {
  const css = generateThemeCss(loadThemeConfig())
  c.header('Content-Type', 'text/css; charset=utf-8')
  c.header('Cache-Control', 'no-cache')
  return c.body(css)
})

app.get('/events', (c) =>
  streamSSE(c, async (stream) => {
    const write = (event: string, data: string) =>
      stream.writeSSE({ event, data })
    addClient(write, c.req.raw.signal)
    // Keep the stream open until the client disconnects
    await new Promise<void>((resolve) => {
      c.req.raw.signal.addEventListener('abort', () => resolve(), {
        once: true,
      })
    })
  }),
)

// Static files served from the package's own dist/public/ (absolute path)
if (existsSync(publicRoot)) {
  app.use('/*', serveStatic({ root: publicRoot }))
}
