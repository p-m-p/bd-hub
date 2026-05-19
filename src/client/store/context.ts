import { createContext } from '@lit/context'

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
  epicId?: string
  subtaskTotal: number
  subtaskDone: number
}

export interface BoardState {
  epics: Epic[]
  tasks: {
    open: Task[]
    ready: Task[]
    inProgress: Task[]
    done: Task[]
  }
}

export const boardContext = createContext<BoardState>('board-state')

export const emptyBoardState: BoardState = {
  epics: [],
  tasks: { open: [], ready: [], inProgress: [], done: [] },
}
