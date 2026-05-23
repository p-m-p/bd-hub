import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { getBoardState } from './query.js'
import { addClient } from './sse.js'

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

// Static files — only active in production (dist/public/ must exist)
app.use('/*', serveStatic({ root: './dist/public' }))
