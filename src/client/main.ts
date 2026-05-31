import './styles/tokens.css'
// entry point — components registered here
import './board/board.js'
import './board/column.js'
import './epic/epic-lane.js'
import './task/task-card.js'
import './task/bead-dialog.js'
import './store/board-store.js'

document.body.innerHTML =
  '<bd-board-store><bd-board></bd-board></bd-board-store>'
