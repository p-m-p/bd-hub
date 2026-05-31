import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

const BD = process.env.BD_BIN ?? 'bd'
const SERVER_PORT = 3099
const STATE_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../.test-state.json',
)

async function bd(args: string[], cwd: string): Promise<string> {
  const result = await execa(BD, args, { cwd })
  return result.stdout.trim()
}

async function bdJson<T>(args: string[], cwd: string): Promise<T> {
  const raw = await bd([...args, '--json'], cwd)
  return JSON.parse(raw) as T
}

async function waitForServer(url: string, timeoutMs = 25000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`)
}

export default async function globalSetup() {
  // 1. Create temp directory
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'beads-test-'))

  // 2. Initialise bd in the temp dir (non-interactive, skip hooks/agents)
  await execa(
    BD,
    ['init', '--non-interactive', '--skip-hooks', '--skip-agents'],
    {
      cwd: tmpDir,
    },
  )

  // 3. Create 2 epics
  const uiEpic = await bdJson<{ id: string }>(
    ['create', '--title', 'UI Components', '--type', 'epic', '--priority', '2'],
    tmpDir,
  )
  const serverEpic = await bdJson<{ id: string }>(
    ['create', '--title', 'Server Layer', '--type', 'epic', '--priority', '2'],
    tmpDir,
  )

  // 4. Create 5 tasks
  const boardTask = await bdJson<{ id: string }>(
    [
      'create',
      '--title',
      'Implement board layout',
      '--type',
      'task',
      '--priority',
      '2',
      '--parent',
      uiEpic.id,
    ],
    tmpDir,
  )

  const taskCardsTask = await bdJson<{ id: string }>(
    [
      'create',
      '--title',
      'Implement task cards',
      '--type',
      'task',
      '--priority',
      '2',
      '--parent',
      uiEpic.id,
    ],
    tmpDir,
  )

  const queryTask = await bdJson<{ id: string }>(
    [
      'create',
      '--title',
      'Implement query module',
      '--type',
      'task',
      '--priority',
      '1',
      '--parent',
      serverEpic.id,
    ],
    tmpDir,
  )

  const sseTask = await bdJson<{ id: string }>(
    [
      'create',
      '--title',
      'Implement SSE broadcaster',
      '--type',
      'task',
      '--priority',
      '2',
      '--parent',
      serverEpic.id,
    ],
    tmpDir,
  )

  const viteTask = await bdJson<{ id: string }>(
    [
      'create',
      '--title',
      'Configure Vite',
      '--type',
      'task',
      '--priority',
      '1',
    ],
    tmpDir,
  )

  // 5. Create 3 subtasks on "Implement board layout"
  const boardTestTask = await bdJson<{ id: string }>(
    [
      'create',
      '--title',
      'Write board component tests',
      '--type',
      'task',
      '--priority',
      '2',
      '--parent',
      boardTask.id,
    ],
    tmpDir,
  )

  const columnTestTask = await bdJson<{ id: string }>(
    [
      'create',
      '--title',
      'Write column component tests',
      '--type',
      'task',
      '--priority',
      '2',
      '--parent',
      boardTask.id,
    ],
    tmpDir,
  )

  const _integrationTestTask = await bdJson<{ id: string }>(
    [
      'create',
      '--title',
      'Write board integration tests',
      '--type',
      'task',
      '--priority',
      '3',
      '--parent',
      boardTask.id,
    ],
    tmpDir,
  )

  // 6. Set statuses
  // board layout → in_progress
  await execa(BD, ['update', boardTask.id, '--status', 'in_progress'], {
    cwd: tmpDir,
  })
  // task cards → open (blocked) — add a blocker dep so it appears in blocked column
  await execa(BD, ['update', taskCardsTask.id, '--status', 'blocked'], {
    cwd: tmpDir,
  })
  // query module → closed
  await execa(BD, ['close', queryTask.id], { cwd: tmpDir })
  // SSE broadcaster → in_progress
  await execa(BD, ['update', sseTask.id, '--status', 'in_progress'], {
    cwd: tmpDir,
  })
  // Configure Vite → closed
  await execa(BD, ['close', viteTask.id], { cwd: tmpDir })
  // Write board component tests → closed
  await execa(BD, ['close', boardTestTask.id], { cwd: tmpDir })
  // Write column component tests → closed
  await execa(BD, ['close', columnTestTask.id], { cwd: tmpDir })
  // Write board integration tests → open (default, no change needed)

  // 7. Start the server with cwd = tmpDir so bd where discovers the right .beads/
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..',
  )
  const serverScript = path.join(repoRoot, 'dist/server/index.js')

  // The server uses serveStatic({ root: './dist/public' }) relative to cwd.
  // Symlink the real dist/public into tmpDir so static assets are served.
  const distDir = path.join(tmpDir, 'dist')
  fs.mkdirSync(distDir)
  fs.symlinkSync(
    path.join(repoRoot, 'dist/public'),
    path.join(distDir, 'public'),
  )

  const serverProcess = spawn(
    'node',
    [serverScript, '--port', String(SERVER_PORT)],
    {
      cwd: tmpDir,
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PATH: process.env.PATH },
    },
  )

  serverProcess.stdout?.on('data', (d: Buffer) => {
    process.stdout.write(`[server] ${d}`)
  })
  serverProcess.stderr?.on('data', (d: Buffer) => {
    process.stderr.write(`[server] ${d}`)
  })

  // 8. Wait for server readiness
  const serverUrl = `http://localhost:${SERVER_PORT}`
  await waitForServer(`${serverUrl}/api/board`)

  // 9. Persist state for teardown
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({ tmpDir, serverPid: serverProcess.pid }),
    'utf8',
  )

  // 10. Expose URL to tests
  process.env.BEADS_TEST_URL = serverUrl

  console.log(`[global-setup] Server ready at ${serverUrl}, tmpDir=${tmpDir}`)

  // Keep reference alive — Playwright keeps this module in scope
  ;(globalThis as Record<string, unknown>).__beadsServerProcess = serverProcess
}
