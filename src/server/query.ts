import path from 'node:path'
import { execa } from 'execa'
import type { BdIssue, BoardState, Epic, Task } from './types.js'

export const ORPHAN_EPIC_ID = '__orphan__'

async function runBd(args: string[]): Promise<BdIssue[]> {
  try {
    const result = await execa('bd', args)
    return JSON.parse(result.stdout) as BdIssue[]
  } catch (err) {
    if (
      err instanceof Error &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      throw new Error(
        'bd not found in PATH — install beads (https://github.com/gastownhall/beads)',
      )
    }
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to query bd: ${message}`)
  }
}

function toEpic(issue: BdIssue): Epic {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    createdAt: issue.created_at,
  }
}

function toTask(
  issue: BdIssue,
  subtaskTotal: number,
  subtaskDone: number,
): Task {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    ...(issue.assignee != null ? { assignee: issue.assignee } : {}),
    ...(issue.parent != null ? { epicId: issue.parent } : {}),
    subtaskTotal,
    subtaskDone,
    createdAt: issue.created_at,
  }
}

export async function getBeadDetail(
  id: string,
): Promise<Record<string, unknown> | null> {
  try {
    const issues = await runBd(['show', id, '--json'])
    return (issues[0] as unknown as Record<string, unknown>) ?? null
  } catch (err) {
    console.error(`[getBeadDetail] Failed to fetch bead "${id}":`, err)
    return null
  }
}

function toTitleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

export async function getProjectInfo(): Promise<{ name: string }> {
  try {
    const result = await execa('bd', ['config', 'list'])
    const match = result.stdout.match(/issue_prefix\s*=\s*(\S+)/)
    if (match?.[1]) return { name: toTitleCase(match[1]) }
  } catch {
    // bd not available or not a bd project
  }
  return { name: toTitleCase(path.basename(process.cwd())) }
}

export async function getBoardState(): Promise<BoardState> {
  const [allIssues, readyIssues] = await Promise.all([
    runBd(['list', '--all', '--json']),
    runBd(['ready', '--json']),
  ])

  const readyIds = new Set(readyIssues.map((i) => i.id))

  // Build epic ID set to distinguish task→epic parenting from task→task parenting
  const epicIds = new Set(
    allIssues.filter((i) => i.issue_type === 'epic').map((i) => i.id),
  )

  // Count subtasks per parent task.
  // A subtask is a task whose parent is another task (not an epic).
  const subtotalMap = new Map<string, { total: number; done: number }>()
  for (const issue of allIssues) {
    const isSubtask = issue.parent != null && !epicIds.has(issue.parent)
    if (isSubtask && issue.parent != null) {
      const counts = subtotalMap.get(issue.parent) ?? { total: 0, done: 0 }
      counts.total += 1
      if (issue.status === 'closed') counts.done += 1
      subtotalMap.set(issue.parent, counts)
    }
  }

  const epics: Epic[] = []
  const open: Task[] = []
  const ready: Task[] = []
  const inProgress: Task[] = []
  const done: Task[] = []

  for (const issue of allIssues) {
    if (issue.issue_type === 'epic') {
      epics.push(toEpic(issue))
      continue
    }

    // Skip tasks that are subtasks of other tasks — shown as tallies only
    if (issue.parent != null && !epicIds.has(issue.parent)) {
      continue
    }

    const counts = subtotalMap.get(issue.id) ?? { total: 0, done: 0 }
    const task = toTask(issue, counts.total, counts.done)

    switch (issue.status) {
      case 'open':
        if (readyIds.has(issue.id)) {
          ready.push(task)
        } else {
          // open but not in ready list = has unresolved blockers
          open.push(task)
        }
        break
      case 'blocked':
        open.push(task)
        break
      case 'in_progress':
        inProgress.push(task)
        break
      case 'closed':
        done.push(task)
        break
      default:
        // deferred / unknown statuses skipped for now
        break
    }
  }

  // Sort real epics by creation date descending — newest first
  epics.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // Append a virtual epic for tasks with no parent epic — always last
  const hasOrphans = [...open, ...ready, ...inProgress, ...done].some(
    (t) => t.epicId === undefined,
  )
  if (hasOrphans) {
    epics.push({
      id: ORPHAN_EPIC_ID,
      title: 'Everything else',
      status: 'open',
      priority: 99,
      createdAt: '',
    })
  }

  return { epics, tasks: { open, ready, inProgress, done } }
}
