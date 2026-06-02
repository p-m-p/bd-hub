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

/** How far back in time to display epics, keyed by their createdAt date. */
export type EpicAge = '1w' | '2w' | '1m' | '3m' | '6m' | '12m' | 'all'

export interface BoardUIState {
  collapsed: Set<string>
  epicAge: EpicAge
  /** Called by epic-lane to toggle collapse; provided by board-store. */
  toggleEpic: (epicId: string, collapsed: boolean) => void
  /** Called by title-bar to persist and apply the epic age filter. */
  setEpicAge: (age: EpicAge) => void
}

export interface BoardState {
  projectName: string
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

const noopToggle = (_epicId: string, _collapsed: boolean) => {}
const noopSetAge = (_age: EpicAge) => {}

export const emptyBoardState: BoardState = {
  projectName: '',
  epics: [],
  tasks: { open: [], ready: [], inProgress: [], done: [] },
  ui: {
    collapsed: new Set(),
    epicAge: '1m',
    toggleEpic: noopToggle,
    setEpicAge: noopSetAge,
  },
}
