---
'bd-hub': patch
---

Changes that reach the workspace without being journaled — `bd dolt pull`, merges, `bd sql` — now show up on the board: while a browser is connected, bd-hub rebuilds the board every 30 seconds and broadcasts only if something changed. Identical board states are no longer re-sent to clients.
