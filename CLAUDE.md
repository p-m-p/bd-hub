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
npm install                    # Install dependencies
npx beads-dashboard           # Main entry point
```

### Testing
```bash
npm test                      # Run all tests (Vitest + Playwright)
npm run test:unit            # Unit tests with Vitest + Testing Library
npm run test:e2e             # End-to-end tests with Playwright
npm run test:coverage        # Generate coverage report (85% minimum required)
```

### Code Quality
```bash
npm run format               # Format code with Biome
npm run lint                 # Lint code with Biome
npm run build                # Production build
```

### Test Environment
- **Test database**: test/beads-test setup on port 3308
- **Coverage enforcement**: 85% minimum required
- **CI/CD**: GitHub Actions enforces all quality gates

## Architecture Overview

**beads-dashboard** is a real-time dashboard built with modern web technologies:

- **Backend**: Hono (lightweight web framework)
- **Frontend**: Lit (web components)
- **Real-time**: Server-Sent Events (SSE)
- **Development**: File watching for hot reload
- **Package**: NPM with `npx beads-dashboard` entry point

### Key Components
- **Server**: Hono-based API server with SSE support
- **Client**: Lit web components for reactive UI
- **Database**: Beads issue tracker with test/beads-test environment
- **Build**: Modern ES modules with optimized bundling

## Conventions & Patterns

### Testing Standards
- **Unit Testing**: Vitest + Testing Library for component testing
- **E2E Testing**: Playwright for full user workflows
- **Coverage**: 85% minimum coverage enforced in CI
- **Test Environment**: Isolated test/beads-test database on port 3308

### Code Quality
- **Formatting**: Biome for consistent code style
- **Linting**: Biome for code quality enforcement
- **CI/CD**: GitHub Actions runs all quality gates
- **Pre-commit**: Quality checks before commits

### Architecture Patterns
- **Component-based**: Lit web components for modularity
- **Real-time Updates**: SSE for live dashboard updates
- **File Watching**: Development server with hot reload
- **Clean API**: Hono for lightweight, fast server responses

### Development Workflow
1. **Start Development**: `npx beads-dashboard` (starts server + file watching)
2. **Run Tests**: All tests must pass with 85% coverage
3. **Quality Gates**: Biome formatting and linting must pass
4. **Integration**: GitHub Actions enforces all standards
5. **Deployment**: NPM package with global entry point