import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { getBoardState } from './query.js'
import { addClient } from './sse.js'

// Resolve the public dir relative to this file so npx (any cwd) works correctly
const __dirname = dirname(fileURLToPath(import.meta.url))
const publicRoot = resolve(__dirname, '../public')

export const app = new Hono()

app.get('/api/board', async (c) => {
  const state = await getBoardState()
  return c.json(state)
})

app.get('/events', (c) =>
  streamSSE(c, async (stream) => {
    const write = (event: string, data: string) =>
      stream.writeSSE({ event, data })
    addClient(write, c.req.raw.signal)
    // Keep the stream open until the client disconnects
    await new Promise<void>((resolve) => {
      c.req.raw.signal.addEventListener('abort', () => resolve(), { once: true })
    })
  }),
)

// Static files served from the package's own dist/public/ (absolute path)
app.use('/*', serveStatic({ root: publicRoot }))
