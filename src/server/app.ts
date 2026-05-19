import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { getBoardState } from './query.js'
import { addClient } from './sse.js'

export const app = new Hono()

app.get('/api/board', async (c) => {
  const state = await getBoardState()
  return c.json(state)
})

app.get('/events', (c) => {
  const { req } = c
  return new Response(
    new ReadableStream({
      start(controller) {
        const write = (event: string, data: string) => {
          controller.enqueue(`event: ${event}\ndata: ${data}\n\n`)
        }
        addClient(write, req.raw.signal)
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    },
  )
})

// Static files — only active in production (dist/public/ must exist)
app.use('/*', serveStatic({ root: './dist/public' }))
