import { execa } from 'execa'
import type { BdIssue, BoardState, Epic, Task } from './types.js'

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
  }
}

export async function getBoardState(): Promise<BoardState> {
  const [allIssues, readyIssues] = await Promise.all([
    runBd(['list', '--json']),
    runBd(['ready', '--json']),
  ])

  const readyIds = new Set(readyIssues.map((i) => i.id))

  // Count subtasks per parent task
  const subtotalMap = new Map<string, { total: number; done: number }>()
  for (const issue of allIssues) {
    if (issue.issue_type === 'subtask' && issue.parent) {
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

    if (issue.issue_type === 'subtask') {
      // Subtasks are counted but not placed in board columns
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

  return { epics, tasks: { open, ready, inProgress, done } }
}
