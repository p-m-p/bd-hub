import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const STATE_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../.test-state.json',
)

export default async function globalTeardown() {
  if (!fs.existsSync(STATE_FILE)) {
    console.warn('[global-teardown] No state file found, nothing to clean up')
    return
  }

  const raw = fs.readFileSync(STATE_FILE, 'utf8')
  const { tmpDir, serverPid } = JSON.parse(raw) as {
    tmpDir: string
    serverPid: number
  }

  // Kill server process
  if (serverPid) {
    try {
      process.kill(serverPid, 'SIGTERM')
      // Give it a moment to clean up
      await new Promise((r) => setTimeout(r, 500))
      // Force kill if still running
      try {
        process.kill(serverPid, 'SIGKILL')
      } catch {
        // Already dead — that's fine
      }
    } catch (err) {
      console.warn(
        `[global-teardown] Could not kill server PID ${serverPid}:`,
        err,
      )
    }
  }

  // Delete temp dir
  if (tmpDir && fs.existsSync(tmpDir)) {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
      console.log(`[global-teardown] Removed tmpDir: ${tmpDir}`)
    } catch (err) {
      console.warn(`[global-teardown] Failed to remove tmpDir ${tmpDir}:`, err)
    }
  }

  // Remove state file
  try {
    fs.unlinkSync(STATE_FILE)
  } catch {
    // ignore
  }
}
