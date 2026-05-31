# bd-hub

## 0.2.0

### Minor Changes

- 38baa51: ## Accessibility, design tokens, and correctness fixes

  ### Bug fixes

  - **Fix concurrent fetch race condition in bead dialog** — fetches triggered by rapid dependency-link navigation now discard stale responses; the dialog always shows data for the currently-selected bead.
  - **Fix SSE stale board after server restart** — the board now re-fetches full state when the EventSource reconnects after an error, preventing a silently out-of-date view.
  - **Fix invalid ARIA roles on kanban column header** — replaced the invalid `role="row"` (which requires a grid ancestor) with `role="group"` so the landmark is well-formed.
  - **Fix dialog missing accessible label** — `<dialog>` now carries `aria-labelledby` pointing at the title heading, satisfying WCAG 4.1.2.
  - **Add `aria-live` region for board updates** — screen readers are now announced when the board changes via SSE.

  ### New features

  - **Project name in title bar and document title** — the project name is fetched from `/api/info` at startup and surfaced in `bd-title-bar` and the browser tab title (`<name> — bd-hub`).
  - **Relative timestamps refresh every 60 s** — the "Xm ago" / "Xh ago" stamps in the bead detail dialog now update while the dialog stays open.
  - **Expanded design token system** — typography (`--bd-font-size-*`, `--bd-font-weight-*`, `--bd-line-height-*`, `--bd-tracking-*`), spacing (`--bd-space-1` – `--bd-space-5`), and border-radius (`--bd-radius-sm/md/lg/full`) tokens are now defined and used consistently across all components.
  - **Shared button base style** — all interactive buttons share a common CSS reset with `:focus-visible` rings, making focus management consistent and easier to override per component.

  ### Internal improvements

  - Skip `provider.setValue` when the `BoardState` reference is unchanged, preventing spurious context-consumer re-renders on no-op SSE events.
  - E2E tests use `BD_BIN` environment variable instead of a hardcoded Homebrew path, enabling them to run on Linux CI.
  - E2E tests added to the CI and PR workflows.

## 0.1.1

### Patch Changes

- f1daceb: Fix epic collapse/expand toggle and polish the bead detail dialog.

  - Fix epic lane collapse toggle — replace unreliable shadow-DOM event routing with a direct context callback (`toggleEpic`) so clicking the header reliably collapses and expands swim lanes
  - Fix epic lane `hidden` attribute being ignored — `display:grid` was overriding the UA stylesheet; add explicit `.columns[hidden] { display: none }` rule
  - Fix epics sort order — newest epics now appear at the top
  - Move dialog Notes, Acceptance criteria and Dependencies sections into a `<footer>` element pinned to the bottom of the dialog, keeping them visible while the description scrolls
  - Fix dialog body bottom padding being swallowed by `overflow-y: auto` — separate scroll container from padded inner wrapper
