---
'bd-hub': minor
---

Live updates now follow the beads events journal (`bd events tail --follow`) instead of watching `.beads/` with chokidar, so the board refreshes on exactly the changes bd records. **Breaking:** bd-hub now requires beads 1.3.0 or later with the journal enabled (`bd config set events-journal true`) and exits with that hint if it isn't. The tail resumes from its last sequence number if it exits, and rebuilds the board if its checkpoint has been pruned.
