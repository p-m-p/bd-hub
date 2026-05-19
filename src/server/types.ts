export interface Epic {
  id: string
  title: string
  status: string
  priority: number
}

export interface Task {
  id: string
  title: string
  status: string
  priority: number
  assignee?: string
  epicId?: string // parent epic id
  subtaskTotal: number
  subtaskDone: number
}

export interface BoardState {
  epics: Epic[]
  tasks: {
    open: Task[] // blocked tasks
    ready: Task[] // open, no blockers
    inProgress: Task[]
    done: Task[]
  }
}

// Raw issue shape returned by `bd list --json`
export interface BdIssue {
  id: string
  title: string
  status: string
  issue_type: string
  priority: number
  assignee: string | null
  parent?: string | null
}
