# bd-hub

## 0.1.1

### Patch Changes

- f1daceb: Fix epic collapse/expand toggle and polish the bead detail dialog.

  - Fix epic lane collapse toggle — replace unreliable shadow-DOM event routing with a direct context callback (`toggleEpic`) so clicking the header reliably collapses and expands swim lanes
  - Fix epic lane `hidden` attribute being ignored — `display:grid` was overriding the UA stylesheet; add explicit `.columns[hidden] { display: none }` rule
  - Fix epics sort order — newest epics now appear at the top
  - Move dialog Notes, Acceptance criteria and Dependencies sections into a `<footer>` element pinned to the bottom of the dialog, keeping them visible while the description scrolls
  - Fix dialog body bottom padding being swallowed by `overflow-y: auto` — separate scroll container from padded inner wrapper
