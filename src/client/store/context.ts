import { createContext } from '@lit/context'

export interface Epic {
  id: string
  title: string
  status: string
  priority: number
  createdAt: string
}

export interface Task {
  id: string
  title: string
  status: string
  priority: number
  assignee?: string
  epicId?: string
  subtaskTotal: number
  subtaskDone: number
}

export interface BoardUIState {
  collapsed: Set<string>
  updates: Record<string, number>
}

export interface BoardState {
  epics: Epic[]
  tasks: {
    open: Task[]
    ready: Task[]
    inProgress: Task[]
    done: Task[]
  }
  ui: BoardUIState
}

export const boardContext = createContext<BoardState>('board-state')

export const emptyBoardState: BoardState = {
  epics: [],
  tasks: { open: [], ready: [], inProgress: [], done: [] },
  ui: { collapsed: new Set(), updates: {} },
}
