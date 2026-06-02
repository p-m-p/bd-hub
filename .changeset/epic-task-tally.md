---
"bd-hub": patch
---

## Epic task tally in lane header

Replace the non-functional update badge on collapsed epic lanes with a permanent **done / total** task tally shown on the right of every epic header.

- The tally is always visible (expanded and collapsed), giving a quick progress read at a glance
- The done count renders in green; epics with no tasks show no tally
- Removes the `updates` bookkeeping from `BoardUIState` and the `diffUpdates` / `epicTaskSnapshot` internals that powered the old badge
