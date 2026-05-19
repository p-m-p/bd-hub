# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->


## Build & Test

This project uses modern JavaScript tooling with strict quality standards.

### Installation & Setup
```bash
pnpm install
npx beads-dashboard
```

### Testing
```bash
pnpm test              # Unit + component tests (Vitest, 85% coverage required)
pnpm test:e2e          # E2E tests (Playwright, bootstraps real bd project)
```

### Code Quality
```bash
pnpm lint              # Lint and format check (Biome)
pnpm lint:fix          # Auto-fix formatting
pnpm build             # Production build (Vite + tsup)
pnpm dev               # Dev server (Vite :5173 + Hono :3003 with proxy)
```

## Architecture Overview

**beads-dashboard** is a real-time kanban dashboard for bd (beads) issue tracking, distributed as an npm package (`npx beads-dashboard`).

- **Server**: Hono on port 3003 — serves static files, `/api/board`, `/events` (SSE)
- **Frontend**: Lit web components with Material Web UI, Catppuccin Mocha theme
- **Realtime**: chokidar watches `.beads/`, debounced 300ms, broadcasts via SSE
- **Data**: bd CLI (execa) — no direct DB access; beads manages Dolt transparently
- **Build**: Vite for client → `dist/public/`, tsup for server → `dist/server/`

### Key Conventions
- State lives in `board-store.ts` (Lit ContextProvider), never in components
- Components are display-only; they receive bead IDs as attributes and look up data from context
- TDD: write tests before implementation for all server modules and frontend components
- E2E tests bootstrap a real temporary bd project (bd init + seed) — no fixtures
- Biome: 2-space indent, single quotes, no semicolons

### Shell Commands
Always use non-interactive flags to avoid hanging on prompts:
```bash
cp -f src dest      # not: cp src dest
mv -f src dest      # not: mv src dest
rm -f file          # not: rm file
rm -rf dir          # not: rm -r dir
```
